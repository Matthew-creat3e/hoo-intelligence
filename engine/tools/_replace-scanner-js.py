import re, sys

PATH = r"c:/Users/Matth/hoo-workspace/demos/pressure-washing-demo-v11.html"

NEW_JS = """  // ═══ QUOTE BUILDER ═══
  var qbState = {
    step: 1,
    home: null,      // {val, roof, siding}
    drive: null,     // {val, sqft}
    services: new Set(['driveway']),
    condition: { val: 'medium', mult: 1.15 }
  };
  var MIN_JOB = 150;
  var LABELS = { driveway:'Driveway & Concrete Wash', house:'House Siding Soft Wash', roof:'Roof Soft Wash', patio:'Patio / Deck' };

  function qbShowStep(n) {
    document.querySelectorAll('.qb-step').forEach(function(s){ s.classList.remove('active'); });
    var target = document.querySelector('.qb-step[data-step="'+n+'"]');
    if (target) target.classList.add('active');
    qbState.step = n;
    var totalSteps = 4;
    var pct = Math.min(100, (n / totalSteps) * 100);
    document.getElementById('qbProgFill').style.width = pct + '%';
    var dots = document.querySelectorAll('.qb-prog-dot');
    dots.forEach(function(d, i){
      d.classList.remove('active','done');
      if (i < n - 1) d.classList.add('done');
      else if (i === n - 1) d.classList.add('active');
    });
    if (n === 3) qbRecalcPrices();
    // Smooth-scroll the qb section into view
    var qbEl = document.getElementById('qb');
    if (qbEl) qbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.qbNext = function() { qbShowStep(qbState.step + 1); };
  window.qbPrev = function() { qbShowStep(qbState.step - 1); };

  window.qbRestart = function() {
    qbState = { step: 1, home: null, drive: null, services: new Set(['driveway']), condition: { val:'medium', mult:1.15 } };
    document.querySelectorAll('.qb-opt').forEach(function(o){ o.classList.remove('on'); });
    document.querySelectorAll('.qb-svc').forEach(function(s){ s.classList.remove('on'); });
    document.querySelector('.qb-svc[data-val="driveway"]').classList.add('on');
    document.querySelectorAll('.qb-step[data-step="4"] .qb-opt').forEach(function(o){
      if (o.dataset.val === 'medium') o.classList.add('on');
    });
    document.getElementById('qbNext1').disabled = true;
    document.getElementById('qbNext2').disabled = true;
    qbShowStep(1);
  };

  // Option bindings (single-select cards)
  function qbBindOptions(stepN, onSelect, nextBtnId) {
    var step = document.querySelector('.qb-step[data-step="'+stepN+'"]');
    if (!step) return;
    step.querySelectorAll('.qb-opt').forEach(function(opt){
      opt.addEventListener('click', function(){
        step.querySelectorAll('.qb-opt').forEach(function(o){ o.classList.remove('on'); });
        opt.classList.add('on');
        onSelect(opt);
        if (nextBtnId) document.getElementById(nextBtnId).disabled = false;
      });
    });
  }

  qbBindOptions(1, function(opt){
    qbState.home = { val: opt.dataset.val, roof: +opt.dataset.roof, siding: +opt.dataset.siding };
  }, 'qbNext1');

  qbBindOptions(2, function(opt){
    qbState.drive = { val: opt.dataset.val, sqft: +opt.dataset.sqft };
  }, 'qbNext2');

  qbBindOptions(4, function(opt){
    qbState.condition = { val: opt.dataset.val, mult: +opt.dataset.mult };
  });

  // Services (multi-select with bundle logic)
  document.querySelectorAll('#qbServices .qb-svc').forEach(function(svc){
    svc.addEventListener('click', function(){
      var v = svc.dataset.val;
      if (v === 'bundle') {
        if (qbState.services.has('bundle')) {
          qbState.services.delete('bundle');
          svc.classList.remove('on');
        } else {
          qbState.services.clear();
          qbState.services.add('bundle');
          document.querySelectorAll('#qbServices .qb-svc').forEach(function(s){ s.classList.remove('on'); });
          svc.classList.add('on');
        }
      } else {
        if (qbState.services.has('bundle')) {
          qbState.services.delete('bundle');
          document.querySelector('.qb-svc[data-val="bundle"]').classList.remove('on');
        }
        if (qbState.services.has(v)) {
          qbState.services.delete(v);
          svc.classList.remove('on');
        } else {
          qbState.services.add(v);
          svc.classList.add('on');
        }
      }
    });
  });

  function qbPrice(val) {
    if (!qbState.home || !qbState.drive) return 0;
    var m = qbState.condition.mult;
    if (val === 'driveway') return Math.round(qbState.drive.sqft * 0.30 * m);
    if (val === 'house')    return Math.round(qbState.home.siding * 0.35 * m);
    if (val === 'roof')     return Math.round(qbState.home.roof * 0.20 * m);
    if (val === 'patio')    return Math.round(250 * 0.40 * m);
    return 0;
  }

  function qbRecalcPrices() {
    ['driveway','house','roof','patio'].forEach(function(v){
      var el = document.getElementById('qbP' + v.charAt(0).toUpperCase() + v.slice(1));
      if (el) el.textContent = '$' + qbPrice(v);
    });
    var bundle = qbPrice('driveway') + qbPrice('house') + qbPrice('roof') + qbPrice('patio');
    var discounted = Math.round(bundle * 0.85);
    var bEl = document.getElementById('qbPBundle');
    if (bEl) bEl.innerHTML = '<span style="text-decoration:line-through;color:rgba(255,255,255,.2);font-size:.7em;margin-right:6px;font-weight:400">$' + bundle + '</span>$' + discounted;
  }

  window.qbBuildQuote = function() {
    var lines = [];
    var subtotal = 0;
    if (qbState.services.has('bundle')) {
      var dw = qbPrice('driveway'), ho = qbPrice('house'), ro = qbPrice('roof'), pa = qbPrice('patio');
      var raw = dw + ho + ro + pa;
      var disc = Math.round(raw * 0.85);
      lines.push({ name:'Driveway & Concrete Wash', sqft: qbState.drive.sqft, price: dw });
      lines.push({ name:'House Siding Soft Wash', sqft: qbState.home.siding, price: ho });
      lines.push({ name:'Roof Soft Wash', sqft: qbState.home.roof, price: ro });
      lines.push({ name:'Patio / Deck', sqft: 250, price: pa });
      lines.push({ name:'Bundle Discount (15%)', sqft: null, price: -(raw - disc), discount: true });
      subtotal = disc;
    } else {
      if (qbState.services.has('driveway')) { var p = qbPrice('driveway'); subtotal += p; lines.push({ name: LABELS.driveway, sqft: qbState.drive.sqft, price: p }); }
      if (qbState.services.has('house'))    { var p2 = qbPrice('house');    subtotal += p2; lines.push({ name: LABELS.house, sqft: qbState.home.siding, price: p2 }); }
      if (qbState.services.has('roof'))     { var p3 = qbPrice('roof');     subtotal += p3; lines.push({ name: LABELS.roof, sqft: qbState.home.roof, price: p3 }); }
      if (qbState.services.has('patio'))    { var p4 = qbPrice('patio');    subtotal += p4; lines.push({ name: LABELS.patio, sqft: 250, price: p4 }); }
    }
    var total = subtotal;
    if (total > 0 && total < MIN_JOB) {
      lines.push({ name: 'Service Minimum Adjustment', sqft: null, price: MIN_JOB - total });
      total = MIN_JOB;
    }
    // Render
    document.getElementById('qbTotalPrice').textContent = total.toLocaleString();
    var linesDiv = document.getElementById('qbLines');
    linesDiv.innerHTML = '';
    lines.forEach(function(l, i){
      var div = document.createElement('div');
      div.className = 'qb-line' + (l.discount ? ' discount' : '');
      div.style.animationDelay = (i * 0.08) + 's';
      var sqftStr = l.sqft ? '<span class="qb-line-sq">· ' + l.sqft.toLocaleString() + ' sqft</span>' : '';
      var priceStr = l.price < 0 ? '−$' + Math.abs(l.price).toLocaleString() : '$' + l.price.toLocaleString();
      div.innerHTML = '<div class="qb-line-n">' + l.name + sqftStr + '</div><div class="qb-line-v">' + priceStr + '</div>';
      linesDiv.appendChild(div);
    });
    qbShowStep(5);
  };

  window.qbSubmit = function() {
    var name = document.getElementById('qbName').value.trim();
    var phone = document.getElementById('qbPhone').value.trim();
    if (!name || !phone) { alert('Please add your name and phone so we can reserve this price.'); return; }
    alert('Reserved! A technician will reach ' + name + ' at ' + phone + ' within 30 minutes to schedule.');
  };

"""

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start marker and the closing })();
start_marker = "  // Enter key on address input\n"
end_marker = "})();\n"

start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERR: start marker not found"); sys.exit(1)

end_idx = content.rfind(end_marker)
if end_idx == -1:
    print("ERR: end marker not found"); sys.exit(1)

new_content = content[:start_idx] + NEW_JS + end_marker + content[end_idx + len(end_marker):]

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"OK. Replaced {end_idx - start_idx} chars of scanner JS with {len(NEW_JS)} chars of quote-builder JS.")
