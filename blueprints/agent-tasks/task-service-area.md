# Task: Build Service Area / About Section
**Read this file. Read industry config + photos. Build.**

## Choose Type (from industry config `area_type`)
- `map` = local business → Google Maps + city list
- `bio` = online business → trainer/owner bio + portrait

---

## Type: MAP (local business)
### Structure
White section. Two-column grid (text left, map right).

### Left Column
- Section tag, title ("Proudly Serving {city}"), subtitle
- Two-column city list (grouped by state/region from industry config `service_areas`)
- Each city: small accent dot bullet + city name
- CTA button linking to form

### Right Column
- Google Maps iframe: `https://maps.google.com/maps?q={city}+{state}&t=&z=10&ie=UTF8&iwloc=&output=embed`
- 480px height, 16px radius, shadow, border
- Mobile: 320px height

---

## Type: BIO (online business)
### Structure
Off-white section. Two-column grid (portrait left, bio right).

### Left Column
- Portrait image from photos file `about` slot
- Aspect-ratio 3/4, 16px radius, shadow
- Badge overlay at bottom-left: dark glass, key stat text

### Right Column
- Section tag, H2 name, bio paragraph (section-sub style)
- Certifications list (checkmark items from industry config `certifications`)
- Location line: "Based in {city}. {scope statement}."
- CTA button

---

## Mobile: single column for both types

## Output
`<section class="about">` or `<section class="map-section">` based on type.
