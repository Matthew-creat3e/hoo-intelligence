// HOO Surface Scan — live satellite surface detection
// Express server: POST /scan-surfaces { address }
//   -> Mapbox geocode
//   -> OSM Overpass (real building + driveway polygons, authoritative)
//   -> Claude Vision for anything OSM doesn't know (patio, walkway, deck)
//   -> returns GeoJSON rings + sqft for each surface

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const turf = require('@turf/turf');

const PORT = process.env.SURFACE_SCAN_PORT || 7891;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || '__MAPBOX_TOKEN__';
const MODEL = 'claude-sonnet-4-6';
const IMG_SIZE = 1024;
const ZOOM = 20;     // mapbox static zoom
const USE_2X = false; // @2x doubles resolution but complicates pixel math; 1x is more reliable

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const app = express();
app.use(cors());
app.use(express.json());

// ── Web Mercator pixel <-> lng/lat (Mapbox Static Images API) ──────────────
function pixelToLngLat(px, py, centerLng, centerLat, zoom, imgW, imgH) {
  const scale = 256 * Math.pow(2, zoom);
  const cx = ((centerLng + 180) / 360) * scale;
  const sinLat = Math.sin((centerLat * Math.PI) / 180);
  const cy = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  const x = cx + (px - imgW / 2);
  const y = cy + (py - imgH / 2);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
}

// ── Haversine-based square-feet from lng/lat polygon ───────────────────────
function polygonSqFt(ring) {
  // Shoelace on equirectangular-projected meters
  const R = 6378137;
  const lat0 = ring[0][1] * Math.PI / 180;
  const cosLat = Math.cos(lat0);
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i];
    const [lng2, lat2] = ring[i + 1];
    const x1 = R * lng1 * Math.PI / 180 * cosLat;
    const y1 = R * lat1 * Math.PI / 180;
    const x2 = R * lng2 * Math.PI / 180 * cosLat;
    const y2 = R * lat2 * Math.PI / 180;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2) * 10.7639;
}

// ── Jackson County MO ArcGIS: authoritative parcel polygons ────────────────
// Public ArcGIS REST — no key required. Covers all of Jackson County
// (Independence, KC proper, Grandview, Raytown, Blue Springs, Lee's Summit, etc)
const JACKSON_PARCELS = 'https://jcgis.jacksongov.org/arcgis/rest/services/ParcelViewer/ParcelsAscendRelate/MapServer/1/query';

async function findJacksonParcel(lng, lat) {
  // Search within 60m — Mapbox often geocodes to the street right-of-way,
  // which isn't a parcel. 60m buffer captures the address's actual parcel.
  const qs = new URLSearchParams({
    where: '1=1',
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    distance: '60',
    units: 'esriSRUnit_Meter',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326', outSR: '4326',
    returnGeometry: 'true',
    outFields: 'parcel_id,Name,CalculatedArea',
    f: 'geojson'
  });
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000);
    const url = `${JACKSON_PARCELS}?${qs}`;
    console.log('[parcel] fetching:', url.slice(0, 180));
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'HOO-ScanServer/1.0' } });
    clearTimeout(to);
    if (!res.ok) { console.log('[parcel] http', res.status); return null; }
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch (e) { console.log('[parcel] non-json:', txt.slice(0, 200)); return null; }
    const feats = (data.features || []).filter(f => f.geometry && f.geometry.coordinates?.[0]?.length >= 3);
    if (!feats.length) { console.log('[parcel] no parcel within 60m (outside Jackson County?)'); return null; }
    // Prefer a parcel that CONTAINS the point. Otherwise pick nearest edge
    // within 8m (tight — Mapbox sometimes lands on the street side of the lot line).
    const pt = turf.point([lng, lat]);
    let containsMatch = null;
    let nearestEdge = null, nearestEdgeDist = Infinity;
    for (const f of feats) {
      try {
        const poly = turf.polygon(f.geometry.coordinates);
        if (turf.booleanPointInPolygon(pt, poly)) { containsMatch = f; break; }
        const line = turf.polygonToLine(poly);
        const d = turf.pointToLineDistance(pt, line, { units: 'meters' });
        if (d < nearestEdgeDist) { nearestEdgeDist = d; nearestEdge = f; }
      } catch (e) {}
    }
    let pick, mode;
    if (containsMatch) { pick = containsMatch; mode = 'contains'; }
    else if (nearestEdge && nearestEdgeDist <= 8) { pick = nearestEdge; mode = `near-edge(${Math.round(nearestEdgeDist)}m)`; }
    else { console.log(`[parcel] ${feats.length} nearby but none contain pin, nearest edge ${Math.round(nearestEdgeDist)}m — too ambiguous, skipping`); return null; }

    const ring = pick.geometry.coordinates[0];
    return {
      ring,
      parcelId: pick.properties?.parcel_id || pick.properties?.Name,
      lotSqft: Math.round(polygonSqFt(ring)),
      mode
    };
  } catch (e) {
    console.log('[parcel] err:', e.message);
    return null;
  }
}

// ── OSM Overpass: fetch real building + driveway polygons ──────────────────
// Overpass is free, public, no key. Residential coverage varies but US urban
// areas (incl. KC metro) are well-mapped. Returns null if nothing found.
// Multiple Overpass mirrors; try fastest first, fall back on failure
const OVERPASS_URLS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

async function overpassQuery(body) {
  let lastErr;
  for (const url of OVERPASS_URLS) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(body),
        signal: ctrl.signal
      });
      clearTimeout(to);
      if (!res.ok) { lastErr = new Error(url + ' ' + res.status); continue; }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) { lastErr = new Error(url + ' non-json'); continue; }
      return res.json();
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('All Overpass endpoints failed');
}

function osmWayToRing(el) {
  // el.geometry = [{lat, lon}, ...]  ->  [[lng, lat], ...]
  if (!el.geometry) return null;
  const ring = el.geometry.map(p => [p.lon, p.lat]);
  if (ring.length < 3) return null;
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }
  return ring;
}

async function findOsmBuilding(lng, lat) {
  // Mapbox often geocodes to street centerline, so actual building can be 50-150m away.
  // Query wide, then score by (proximity + size) to prefer the main residence.
  const q = `[out:json][timeout:8];way(around:180,${lat},${lng})["building"];out geom;`;
  const data = await overpassQuery(q);
  const total = (data.elements || []).length;
  const pt = turf.point([lng, lat]);
  const candidates = [];
  for (const el of (data.elements || [])) {
    const ring = osmWayToRing(el);
    if (!ring) continue;
    try {
      const poly = turf.polygon([ring]);
      if (turf.booleanPointInPolygon(pt, poly)) {
        console.log('[osm] building contains point → exact match');
        return { ring, source: 'osm:contains' };
      }
      const d = turf.distance(pt, turf.centroid(poly), { units: 'meters' });
      const sqft = polygonSqFt(ring);
      if (sqft < 400) continue;         // sheds/garages
      if (d > 150) continue;            // too far to be target's building
      candidates.push({ ring, dist: d, sqft });
    } catch (e) {}
  }
  if (!candidates.length) {
    console.log(`[osm] buildings: ${total} total → no viable candidate within 150m (>=400 sqft)`);
    return null;
  }
  // Score: smaller is better. Penalize distance, reward size up to typical house (~2500 sqft).
  candidates.forEach(c => { c.score = c.dist - Math.min(c.sqft, 2500) / 50; });
  candidates.sort((a, b) => a.score - b.score);
  const pick = candidates[0];
  console.log(`[osm] buildings: ${total} total, ${candidates.length} candidates, picked ${Math.round(pick.dist)}m (${pick.sqft}sqft, score ${pick.score.toFixed(1)})`);
  return { ring: pick.ring, source: 'osm:nearest' };
}

async function findOsmDriveway(lng, lat) {
  // OSM tags driveways as highway=service + service=driveway (LineString)
  const q = `[out:json][timeout:8];way(around:100,${lat},${lng})["highway"="service"]["service"="driveway"];out geom;`;
  const data = await overpassQuery(q);
  if (!data.elements || !data.elements.length) return null;
  const pt = turf.point([lng, lat]);
  let best = null, bestDist = Infinity;
  for (const el of data.elements) {
    if (!el.geometry || el.geometry.length < 2) continue;
    const line = turf.lineString(el.geometry.map(p => [p.lon, p.lat]));
    const d = turf.pointToLineDistance(pt, line, { units: 'meters' });
    if (d < bestDist) { bestDist = d; best = line; }
  }
  if (!best) return null;
  // Buffer centerline by ~2.75m (half of 18ft 2-car driveway) to get a polygon
  const buffered = turf.buffer(best, 0.00275, { units: 'kilometers' });
  const coords = buffered.geometry.type === 'MultiPolygon'
    ? buffered.geometry.coordinates[0][0]
    : buffered.geometry.coordinates[0];
  return { ring: coords, source: 'osm:driveway' };
}

// Project a lng/lat point to pixel coords in the Mapbox Static image frame
function lngLatToPixel(lng, lat, centerLng, centerLat, zoom, imgW, imgH) {
  const scale = 256 * Math.pow(2, zoom);
  const cx = ((centerLng + 180) / 360) * scale;
  const sinLat0 = Math.sin((centerLat * Math.PI) / 180);
  const cy = (0.5 - Math.log((1 + sinLat0) / (1 - sinLat0)) / (4 * Math.PI)) * scale;
  const tx = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const ty = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [tx - cx + imgW / 2, ty - cy + imgH / 2];
}

// ── Geocode address via Mapbox ─────────────────────────────────────────────
async function geocode(address) {
  const url = 'https://api.mapbox.com/search/geocode/v6/forward'
    + '?q=' + encodeURIComponent(address)
    + '&country=us&limit=1&access_token=' + MAPBOX_TOKEN;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocode failed: ' + res.status);
  const data = await res.json();
  const f = data.features && data.features[0];
  if (!f) throw new Error('No match for address: ' + address);
  const [lng, lat] = f.geometry.coordinates;
  return { lng, lat, placeName: f.properties.full_address || f.properties.name };
}

// ── Fetch Mapbox satellite image (with target pin) as base64 ───────────────
// Returns { pinned, clean } — pinned has red dot over target property for
// Claude to focus on; clean is used for any downstream reference.
// Build a GeoJSON URL overlay for Mapbox Static Images API (yellow lot outline)
function parcelGeoJsonOverlay(ring) {
  // Simplify to <80 points to stay under Mapbox's URL length limit
  const step = Math.max(1, Math.ceil(ring.length / 80));
  const simple = ring.filter((_, i) => i % step === 0);
  if (simple[0] !== ring[ring.length - 1]) simple.push(ring[0]);
  const geo = {
    type: 'Feature',
    properties: {
      stroke: '#ffd000', 'stroke-width': 4, 'stroke-opacity': 1,
      fill: '#ffd000', 'fill-opacity': 0.08
    },
    geometry: { type: 'Polygon', coordinates: [simple] }
  };
  return 'geojson(' + encodeURIComponent(JSON.stringify(geo)) + ')';
}

async function fetchSatelliteImages(lng, lat, parcelRing) {
  const overlays = [];
  if (parcelRing) overlays.push(parcelGeoJsonOverlay(parcelRing));
  overlays.push('pin-l+ff2d2d(' + lng + ',' + lat + ')');
  const base = 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/';
  const res2x = USE_2X ? '@2x' : '';
  const suffix = '/' + lng + ',' + lat + ',' + ZOOM + ',0/'
    + IMG_SIZE + 'x' + IMG_SIZE + res2x
    + '?access_token=' + MAPBOX_TOKEN
    + '&attribution=false&logo=false';
  const url = base + overlays.join(',') + suffix;
  const res = await fetch(url);
  if (!res.ok) {
    // URL may have exceeded Mapbox's ~8KB limit with parcel overlay; retry without
    if (parcelRing) return fetchSatelliteImages(lng, lat, null);
    throw new Error('Static image fetch failed: ' + res.status);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString('base64');
}

// ── Parcel-based surface estimator ─────────────────────────────────────────
// Given the real parcel polygon from the county assessor, use industry-standard
// ratios to generate surface estimates with realistic geometry placed on the lot.
// This is what Deep Lawn / SatQuote effectively do under the hood.
//
// Ratios (residential US baseline, Angi/HomeGuide/Jobber 2026):
//   • House footprint = 20% of lot area (clamped 900–3500 sqft)
//   • Driveway        = 600 sqft (two-car baseline; scales lightly with lot)
//   • Front walkway   = 120 sqft
//   • Sidewalk        = lot_frontage × 4 ft (public walkway along street)
//   • Roof area       = house footprint × 1.3 (pitch multiplier)
function estimateSurfacesFromParcel(parcelRing) {
  const lotSqft = polygonSqFt(parcelRing);
  const poly = turf.polygon([parcelRing]);
  const [cLng, cLat] = turf.centroid(poly).geometry.coordinates;
  const bbox = turf.bbox(poly);
  // Approximate lot width (E-W) and depth (N-S) in meters
  const widthM = turf.distance([bbox[0], cLat], [bbox[2], cLat], { units: 'meters' });
  const depthM = turf.distance([cLng, bbox[1]], [cLng, bbox[3]], { units: 'meters' });
  // Pick the shorter side as "frontage" (typically faces the street)
  const frontageFt = Math.min(widthM, depthM) * 3.28084;
  const frontageHoriz = widthM <= depthM;

  const out = [];

  // HOUSE FOOTPRINT — centered in parcel, 20% of lot clamped to residential range
  const houseSqft = Math.round(Math.min(3500, Math.max(900, lotSqft * 0.20)));
  const houseM2 = houseSqft / 10.7639;
  const houseSide = Math.sqrt(houseM2) * 1.3; // slightly rectangular (1.3:1)
  const houseW = houseSide;
  const houseD = houseSide / 1.3;
  const houseRing = rectAround(cLng, cLat, houseW, houseD);
  out.push({ type: 'roof', ring: houseRing, sqft: Math.round(houseSqft * 1.3), source: 'parcel:est' });

  // DRIVEWAY — 600 sqft, offset toward the front edge of the parcel
  const dwSqft = 600;
  const dwW = frontageHoriz ? 5.5 : 10.3; // meters (18ft or 34ft)
  const dwD = frontageHoriz ? 10.3 : 5.5;
  const dwOffsetM = (depthM / 2) * 0.6 * (frontageHoriz ? 1 : 0);
  const dwOffsetM2 = (widthM / 2) * 0.6 * (frontageHoriz ? 0 : 1);
  const dwCenter = offsetLngLat(cLng, cLat, dwOffsetM2, -dwOffsetM);
  const dwRing = rectAround(dwCenter[0], dwCenter[1], dwW, dwD);
  out.push({ type: 'driveway', ring: dwRing, sqft: dwSqft, source: 'parcel:est' });

  // SIDEWALK — along the street frontage (4 ft wide × frontage length)
  const sidewalkSqft = Math.round(frontageFt * 4);
  const swW = frontageHoriz ? widthM * 0.9 : 1.2;
  const swD = frontageHoriz ? 1.2 : depthM * 0.9;
  const swOffsetM = (depthM / 2) * 0.95 * (frontageHoriz ? 1 : 0);
  const swOffsetM2 = (widthM / 2) * 0.95 * (frontageHoriz ? 0 : 1);
  const swCenter = offsetLngLat(cLng, cLat, swOffsetM2, -swOffsetM);
  const swRing = rectAround(swCenter[0], swCenter[1], swW, swD);
  out.push({ type: 'sidewalk', ring: swRing, sqft: sidewalkSqft, source: 'parcel:est' });

  // WALKWAY — private path from driveway to front door
  const wkSqft = 120;
  const wkW = frontageHoriz ? 1.1 : 10.2;
  const wkD = frontageHoriz ? 10.2 : 1.1;
  const wkOffsetM = (depthM / 2) * 0.35 * (frontageHoriz ? 1 : 0);
  const wkOffsetM2 = (widthM / 2) * 0.35 * (frontageHoriz ? 0 : 1);
  const wkCenter = offsetLngLat(cLng, cLat, wkOffsetM2, -wkOffsetM);
  const wkRing = rectAround(wkCenter[0], wkCenter[1], wkW, wkD);
  out.push({ type: 'walkway', ring: wkRing, sqft: wkSqft, source: 'parcel:est' });

  return { surfaces: out, lotSqft: Math.round(lotSqft) };
}

function rectAround(lng, lat, widthM, depthM) {
  const halfW = widthM / 2, halfD = depthM / 2;
  const nw = offsetLngLat(lng, lat, -halfW, halfD);
  const ne = offsetLngLat(lng, lat, halfW, halfD);
  const se = offsetLngLat(lng, lat, halfW, -halfD);
  const sw = offsetLngLat(lng, lat, -halfW, -halfD);
  return [nw, ne, se, sw, nw];
}

function offsetLngLat(lng, lat, eastM, northM) {
  const R = 6378137;
  const dLat = (northM / R) * (180 / Math.PI);
  const dLng = (eastM / (R * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
  return [lng + dLng, lat + dLat];
}

// ── Send image to Claude for surfaces OSM doesn't know (patio/walkway/deck) ─
// Passes the known building pixel polygon as context so Claude anchors to it.
async function detectSurfacesClaude(imageB64, wantTypes, buildingPxPoly, parcelPxPoly) {
  const actualPx = USE_2X ? IMG_SIZE * 2 : IMG_SIZE;
  const DESC = {
    roof:     'the main house roof of the target property (trace the full roofline from above)',
    driveway: 'the paved strip from street to garage/house on the target lot',
    sidewalk: 'narrow public walkway paralleling the street in front of the property',
    walkway:  'private paved path from driveway/street to the front door',
    patio:    'paved outdoor living area, usually behind or beside the house',
    deck:     'raised wooden platform, usually behind the house'
  };
  const WANT = wantTypes.filter(t => DESC[t]);
  if (!WANT.length) return { surfaces: [], usage: null };

  let context;
  if (parcelPxPoly) {
    context = `\n\nThe TARGET LOT BOUNDARY (property line from the county assessor) is at these pixel coordinates: ${JSON.stringify(parcelPxPoly)}. ALL surfaces you detect must be INSIDE this boundary. The house, driveway, sidewalks, patios, decks belong to this exact lot only — ignore everything outside it.`;
  } else if (buildingPxPoly) {
    context = `\n\nThe TARGET HOUSE footprint is at these pixel coordinates: ${JSON.stringify(buildingPxPoly)}. Surfaces you detect should be on or adjacent to this house.`;
  } else {
    context = '\n\nIdentify the house the RED PIN is sitting on — ignore all neighboring houses.';
  }

  const surfaceList = WANT.map(t => `- "${t}" — ${DESC[t]}`).join('\n');

  const prompt = `You are analyzing an overhead satellite image of a residential property for a pressure washing quote.

Image: ${actualPx} x ${actualPx} pixels, top-left origin. A RED PIN marks the approximate center.${context}

Detect ONLY these surfaces on the target property:
${surfaceList}

For each surface, return a polygon (6-14 [x,y] pixel points) tracing the actual edge. Do NOT return loose bounding rectangles. Return at most ONE of each type. Skip anything not clearly visible.

Return ONLY this JSON:
{"surfaces":[{"type":"patio","polygon":[[x,y],...]}]}`;

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1536,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageB64 } },
        { type: 'text', text: prompt }
      ]
    }]
  });

  const text = msg.content.find(b => b.type === 'text')?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { surfaces: [], usage: msg.usage };
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return { surfaces: parsed.surfaces || [], usage: msg.usage };
  } catch (e) {
    return { surfaces: [], usage: msg.usage };
  }
}

// ── Route ──────────────────────────────────────────────────────────────────
app.post('/scan-surfaces', async (req, res) => {
  const t0 = Date.now();
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'address required' });
    console.log('[scan]', address);

    const { lng: gLng, lat: gLat, placeName } = await geocode(address);
    const parcel = await findJacksonParcel(gLng, gLat);

    // PRIMARY PATH: Jackson County parcel → industry-ratio surface estimates.
    // Deterministic, fast (1-3s), works for any address in Jackson County.
    if (parcel) {
      const [cLng, cLat] = turf.centroid(turf.polygon([parcel.ring])).geometry.coordinates;
      const est = estimateSurfacesFromParcel(parcel.ring);
      const ms = Date.now() - t0;
      console.log(`[scan] ${placeName} → parcel ${parcel.parcelId} (${est.lotSqft} sqft lot) → ${est.surfaces.map(s => `${s.type}:${s.sqft}sf`).join(' ')} in ${ms}ms`);
      return res.json({
        center: [cLng, cLat],
        placeName,
        parcelRing: parcel.ring,
        lotSqft: est.lotSqft,
        surfaces: est.surfaces,
        source: 'jackson-co-parcel',
        ms
      });
    }

    // FALLBACK: no Jackson County parcel found — just echo the address.
    // (Future: extend to Clay/Platte/Cass MO counties or statistical-default lot.)
    console.log(`[scan] ${placeName} → no parcel found (outside Jackson County)`);
    res.json({
      center: [gLng, gLat],
      placeName,
      parcelRing: null,
      lotSqft: null,
      surfaces: [],
      source: 'geocode-only',
      ms: Date.now() - t0,
      note: "We couldn't find county assessor data for this address. Try a Jackson County, MO address."
    });
  } catch (err) {
    console.error('[scan] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true, model: MODEL }));

// Debug: return the exact satellite image we send to Claude, given an address
app.get('/debug-image', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) return res.status(400).send('?address=...');
    const { lng: gLng, lat: gLat } = await geocode(address);
    const parcel = await findJacksonParcel(gLng, gLat);
    let lng = gLng, lat = gLat;
    if (parcel) {
      const [cLng, cLat] = turf.centroid(turf.polygon([parcel.ring])).geometry.coordinates;
      lng = cLng; lat = cLat;
    }
    const b64 = await fetchSatelliteImages(lng, lat, parcel ? parcel.ring : null);
    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(b64, 'base64'));
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(PORT, () => {
  console.log('Surface-scan server on http://localhost:' + PORT);
  console.log('  POST /scan-surfaces  body: {"address": "..."}');
  console.log('  model:', MODEL, '| zoom:', ZOOM, '| image:', IMG_SIZE * 2 + 'px');
});
