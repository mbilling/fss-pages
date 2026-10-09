/* FSS site behaviour: simulated terminal, cluster demo, charts, TCO calculator, switch savings. No dependencies. */
(function () {
  'use strict';
  var D = window.FSS;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- simulated fss-mqtt terminal ---------- */
  var tick = 0;
  var motion = !reduced;
  var rnd = function (n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
  var hot = function (i) { return rnd(tick * 7 + i) > 0.55; };

  function renderTerm() {
    var kw = function (i) { return (2100 + rnd(tick + i) * 1400).toFixed(1); };
    var rows = [
      ['b', 1, 'nordvind', '', 0, true],
      ['b', 2, 'windfarm', '', 12, true],
      ['b', 3, 'wtg-01', '', 24, true],
      ['l', 4, 'power_kw', kw(4)],
      ['l', 5, 'rotor_rpm', (11 + rnd(tick + 5) * 5).toFixed(1)],
      ['l', 6, 'status', '{"state":"run"}'],
      ['b', 7, 'wtg-02', '3 topics', 24, false],
      ['b', 8, 'wtg-03', '3 topics', 24, false],
      ['b', 9, 'wtg-04', '3 topics', 24, false],
      ['b', 10, 'baltic-7', '', 0, true],
      ['b', 11, 'windfarm', '', 12, true],
      ['b', 12, 'wtg-01', '3 topics', 24, false],
      ['b', 13, 'wtg-02', '3 topics', 24, false]
    ];
    $('term-tree').innerHTML = rows.map(function (r) {
      var isHot = hot(r[1]);
      if (r[0] === 'l') {
        return '<div class="trow"><span class="m" style="color:var(--accent)">' + (isHot ? '•' : '') + '</span>' +
          '<span style="padding-left:36px;color:' + (isHot ? 'var(--text)' : 'var(--muted)') + '">' + esc(r[2]) + '</span>' +
          '<span class="v">' + esc(r[3]) + '</span></div>';
      }
      return '<div class="trow"><span class="m" style="color:' + (isHot ? 'var(--accent)' : 'var(--faint)') + '">' + (r[5] ? '▾' : '▸') + '</span>' +
        '<span style="padding-left:' + r[4] + 'px;color:var(--text-2)">' + esc(r[2]) + '</span>' +
        '<span class="v">' + esc(r[3]) + '</span></div>';
    }).join('');
    $('pitch').textContent = (2 + rnd(tick + 30) * 3).toFixed(1);
    $('msgrate').textContent = Math.round(380 + rnd(tick + 40) * 70);
  }
  renderTerm();
  setInterval(function () { if (motion && !document.hidden) { tick++; renderTerm(); } }, 650);

  /* ---------- suite cards ---------- */
  $('suite-cards').innerHTML = D.suite.map(function (t) {
    return '<a class="tool" href="' + esc(t.href) + '">' +
      '<div class="tool-top"><span class="tool-phase">' + esc(t.phase) + '</span>' +
      '<span class="badge ' + (t.status === 'available' ? 'available' : '') + '">' + esc(t.status) + '</span></div>' +
      '<div class="tool-name">' + esc(t.name) + '</div>' +
      '<div class="tool-desc">' + esc(t.desc) + '</div></a>';
  }).join('');

  /* ---------- cluster failover demo ---------- */
  var killed = false;
  function renderNodes() {
    var nodes = [
      { n: 'node-1', t: killed ? 'leader · +7,012 sessions' : 'leader · 14,020 sessions' },
      { n: 'node-2', t: killed ? 'SIGKILL · sessions moved' : 'follower · 14,021 sessions', dead: killed },
      { n: 'node-3', t: killed ? 'follower · +7,009 sessions' : 'follower · 13,959 sessions' }
    ];
    $('nodes').innerHTML = nodes.map(function (x) {
      return '<div class="node' + (x.dead ? ' dead' : '') + '"><span class="d"></span><div><span class="n">' + x.n + '</span><span class="t">' + x.t + '</span></div></div>';
    }).join('');
    $('live-nodes').textContent = (killed ? 2 : 3) + ' / 3';
    $('rehomed').textContent = killed ? '14,021' : '0';
    $('cluster-state').textContent = killed ? 'Degraded, serving' : 'Healthy';
    var b = $('kill-btn');
    b.textContent = killed ? 'Restart node-2' : 'Kill node-2';
    b.classList.toggle('is-off', killed);
    b.setAttribute('aria-pressed', String(killed));
  }
  $('kill-btn').addEventListener('click', function () { killed = !killed; renderNodes(); });
  renderNodes();

  function applyMotion() {
    document.body.classList.toggle('paused', !motion);
    $('motion-btn').textContent = motion ? 'Pause motion' : 'Resume motion';
  }
  $('motion-btn').addEventListener('click', function () { motion = !motion; applyMotion(); });
  applyMotion();

  /* ---------- benchmark bars ---------- */
  var maxB = Math.max.apply(null, D.bench.map(function (b) { return b.val; }));
  $('bench').innerHTML = D.bench.map(function (b, i) {
    return '<div class="brow"><div class="nm">' + esc(b.name) + ' <small>' + esc(b.ver) + '</small></div>' +
      '<div class="track"><div class="fill' + (b.ours ? ' ours' : '') + '" style="width:' + (b.val / maxB * 100) + '%;transition-delay:' + (i * 0.15) + 's"></div></div>' +
      '<div class="val">' + b.val.toLocaleString('en-US') + '</div></div>';
  }).join('');
  $('lat').innerHTML = D.latency.map(function (l) {
    return '<div class="lrow"><div class="lt"><span>' + esc(l.name) + '</span><span class="mono">' + l.pct + '%</span></div>' +
      '<div class="track"><div class="fill' + (l.ours ? ' ours' : '') + '" style="width:' + l.pct + '%"></div></div></div>';
  }).join('');

  // animate bars and curves when they scroll into view
  var targets = [$('bench'), $('lat'), document.querySelector('.chart')];
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in-view'); });
  }

  /* ---------- TCO calculator ---------- */
  var T = D.tco;
  var state = { rateIdx: 50, price: T.defaultPrice, wl: 'q0' };
  var eur = function (x) { return '€' + Math.round(x).toLocaleString('en-US'); };
  var fmtRate = function (r) { return r >= 1e6 ? (r / 1e6).toFixed(2).replace(/0$/, '') + 'M' : Math.round(r / 1000) + 'k'; };
  var nodesFor = function (r, per) { return Math.max(T.minNodes, Math.ceil(r / per)); };

  // mqttd capacity from the measured scale curve: linear between measured points, the
  // least-squares slope past the last one. One point means no proven scale-out: no extrapolation.
  var slopeOf = function (c) {
    if (c.length < 2) return 0;
    var mx = 0, my = 0, sxy = 0, sxx = 0;
    c.forEach(function (q) { mx += q[0] / c.length; my += q[1] / c.length; });
    c.forEach(function (q) { sxy += (q[0] - mx) * (q[1] - my); sxx += (q[0] - mx) * (q[0] - mx); });
    return sxy / sxx;
  };
  var capAt = function (c, n) {
    var last = c[c.length - 1];
    if (n <= c[0][0]) return c[0][1];
    if (n >= last[0]) return c.length < 2 ? last[1] : last[1] + slopeOf(c) * (n - last[0]);
    for (var i = 1; i < c.length; i++) {
      if (n <= c[i][0]) return c[i - 1][1] + (c[i][1] - c[i - 1][1]) * (n - c[i - 1][0]) / (c[i][0] - c[i - 1][0]);
    }
  };
  // -> { n, extra } (extra: beyond the largest measured cluster), or null when not proven
  var mqttdFor = function (r, c) {
    var last = c[c.length - 1];
    if (c.length < 2 && r > last[1]) return null;
    for (var n = T.minNodes; n < 1000; n++) if (capAt(c, n) >= r) return { n: n, extra: n > last[0] };
    return null;
  };

  $('workloads').innerHTML = Object.keys(T.workloads).map(function (id) {
    return '<button type="button" class="wl" data-wl="' + id + '" aria-pressed="' + (id === state.wl) + '">' + esc(T.workloads[id].label) + '</button>';
  }).join('');
  $('workloads').addEventListener('click', function (e) {
    var b = e.target.closest('[data-wl]');
    if (!b) return;
    state.wl = b.getAttribute('data-wl');
    renderTco();
  });
  $('rate').addEventListener('input', function (e) { state.rateIdx = +e.target.value; renderTco(); });
  $('price').addEventListener('input', function (e) { state.price = +e.target.value; renderTco(); });

  function renderTco() {
    var raw = 10000 * Math.pow(120, state.rateIdx / 100);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
    var rate = Math.round(raw / mag) * mag;
    var w = T.workloads[state.wl];
    var p = state.price;
    var mq = mqttdFor(rate, w.curve);
    var mqN = mq ? mq.n : 0;
    var slope = slopeOf(w.curve);
    var lastPt = w.curve[w.curve.length - 1];

    $('rate-label').textContent = fmtRate(rate) + ' msg/s';
    $('price-label').textContent = '€' + p + '/mo';
    $('mq-nodes').textContent = mq ? mqN : '—';
    $('mq-cost').textContent = mq ? eur(mqN * p) : '—';
    $('marginal').textContent = slope ? '€' + (p / (slope / 1000)).toFixed(2) : '—';
    document.querySelectorAll('.wl').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-wl') === state.wl)); });

    var mqNote = (slope
      ? 'Measured scale curve, ' + w.curve.map(function (q) { return q[0]; }).join('/') + ' nodes; ~' + fmtRate(slope) + ' msg/s per added node.' +
        (mq && mq.extra ? ' Extrapolated past the largest measured cluster (' + lastPt[0] + ' nodes, ' + fmtRate(lastPt[1]) + ').' : '')
      : 'Measured ' + fmtRate(lastPt[1]) + ' msg/s on ' + lastPt[0] + ' nodes. Durable scale-out is not proven yet, so nothing is extrapolated.') +
      ' Apache-2.0, clustering free.';
    var rows = [{ name: 'mqttd', note: mqNote, ours: true }].concat(w.others).map(function (d) {
      if (d.ours) return mq ? { d: d, label: mqN + ' nodes', cost: mqN * p, text: eur(mqN * p) + '/mo' } : { d: d, label: 'not measured at this load', cost: 0, text: '—' };
      if (!d.per) return { d: d, label: 'n/a', cost: 0, text: '—' };
      if (d.single) return rate <= d.per ? { d: d, label: '1 node, no HA', cost: p, text: eur(p) + '/mo' } : { d: d, label: 'cannot carry this load', cost: 0, text: '—' };
      var n = nodesFor(rate, d.per);
      return { d: d, label: n + ' nodes', cost: n * p, text: eur(n * p) + '/mo' };
    });
    var max = Math.max.apply(null, rows.map(function (r) { return r.cost; })) || 1;
    $('alts').innerHTML = rows.map(function (r) {
      var pct = r.cost ? Math.max(r.cost / max * 100, 2) : 0;
      return '<div class="alt"><div class="at"><span><b>' + esc(r.d.name) + '</b> <small>· ' + esc(r.label) + '</small></span><span class="mono">' + r.text + '</span></div>' +
        '<div class="track"><div class="fill ' + (r.d.ours ? 'ours' : 'amber') + '" style="width:' + pct + '%"></div></div>' +
        '<div class="nt">' + esc(r.d.note) + '</div></div>';
    }).join('');
    renderSwitch(rate, w, p);
  }

  /* ---------- switch from EMQX / HiveMQ (driven by the TCO state) ---------- */
  var S = D.switchFrom;
  var sw = 'emqx';
  $('sw-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sw]');
    if (!b) return;
    sw = b.getAttribute('data-sw');
    renderTco();
  });

  function renderSwitch(rate, w, p) {
    var c = S[sw];
    document.querySelectorAll('[data-sw]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sw') === sw)); });
    document.querySelectorAll('.sw-from').forEach(function (e) { e.textContent = c.label; });
    $('sw-lic').textContent = c.lic;

    // Headline: best node saving at the largest measured mqttd cluster, per workload with data for this competitor.
    var find = function (wl) { return wl.others.filter(function (o) { return o.per && (o.name === c.tcoName || o.name === c.durName); })[0]; };
    var best = { pct: 0 };
    Object.keys(T.workloads).forEach(function (k) {
      var wk = T.workloads[k], o = find(wk), pt = wk.curve[wk.curve.length - 1];
      if (!o) return;
      var tn = nodesFor(pt[1], o.per), v = Math.round((1 - pt[0] / tn) * 100);
      if (v > best.pct) best = { pct: v, wl: wk, o: o, pt: pt, tn: tn };
    });
    $('sw-upto').textContent = best.pct + '%';
    $('sw-upto-note').textContent = '"Up to ' + best.pct + '%" is the node saving at the largest measured mqttd cluster for ' + best.wl.label + ': ' +
      fmtRate(best.pt[1]) + ' msg/s on ' + best.pt[0] + ' mqttd nodes vs ' + best.tn + ' ' + best.o.name + ' nodes. ' + best.o.note +
      ' Infrastructure only; at small loads both sit at the three-node HA minimum.';
    $('sw-them-l').textContent = c.label.toUpperCase() + ' NODES';

    // Prefer the selected workload; fall back to QoS 0 if it has no data for this competitor.
    var wl = w, them = find(w);
    if (!them) { wl = T.workloads.q0; them = find(wl); }
    var us = mqttdFor(rate, wl.curve), themN = nodesFor(rate, them.per);
    var pre = wl !== w ? w.label + ' has no published ' + c.label + ' figure, so this uses ' + wl.label + '. ' : '';
    $('sw-them').textContent = themN;
    $('sw-us').textContent = us ? us.n : '—';
    $('sw-year').textContent = us ? eur((themN - us.n) * p * 12) : '—';
    if (!us) {
      var lp = wl.curve[wl.curve.length - 1];
      $('sw-note').textContent = pre + 'mqttd ' + wl.label + ' is measured to ' + fmtRate(lp[1]) + ' msg/s on ' + lp[0] + ' nodes and its scale-out is not proven yet, so there is no mqttd figure at ' +
        fmtRate(rate) + ' msg/s. Lower the rate in the calculator to compare.';
    } else {
      var pct = Math.round((1 - us.n / themN) * 100);
      $('sw-note').textContent = pre + 'At ' + fmtRate(rate) + ' msg/s ' + wl.label + ' and €' + p + ' per node: ' + eur(themN * p) + '/mo on ' + them.name + ' vs ' + eur(us.n * p) + '/mo on mqttd' +
        (pct > 0 ? ' (' + pct + '% fewer nodes).' : ', both at the three-node HA minimum. Savings grow with load.') +
        (us.extra ? ' The mqttd figure is extrapolated past the largest measured cluster.' : '') +
        ' Infrastructure only; ' + c.label + ' licence and support fees would come on top. Same caveats as the calculator.';
    }
    $('sw-facts').innerHTML = c.facts.map(function (f) {
      return '<div class="stat"><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span><span class="nt">' + esc(f[2]) + '</span></div>';
    }).join('');
    $('sw-steps').innerHTML = c.steps.map(function (s) {
      return '<li><b>' + esc(s[0]) + '</b> ' + esc(s[1]) + '</li>';
    }).join('');
    $('sw-keep').textContent = c.keep;
  }
  renderTco();
})();
