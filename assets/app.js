/* FSS site behaviour: theme toggle, simulated terminal, cluster demo, charts, TCO calculator, switch savings. No dependencies. */
(function () {
  'use strict';
  var D = window.FSS;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ---------- light / dark theme (initial choice is set inline in <head>) ---------- */
  var root = document.documentElement;
  var sysLight = window.matchMedia('(prefers-color-scheme: light)');
  var themeNow = function () { return root.getAttribute('data-theme') || (sysLight.matches ? 'light' : 'dark'); };
  function syncTheme() {
    var t = themeNow();
    root.setAttribute('data-theme-now', t);
    $('theme-btn').setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme');
  }
  $('theme-btn').addEventListener('click', function () {
    var next = themeNow() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('fss-theme', next); } catch (e) { /* storage blocked: theme still applies for this visit */ }
    syncTheme();
  });
  if (sysLight.addEventListener) sysLight.addEventListener('change', syncTheme);
  syncTheme();

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

  /* ---------- latency as load rises (SVG, log-scale ack p99) ---------- */
  (function () {
    var L = D.loadLatency, W = 600, H = 330, x0 = 64, x1 = 580, y0 = 280, y1 = 24;
    var xMax = 480000, lo = Math.log10(0.5), hi = Math.log10(10000);
    var X = function (r) { return (x0 + r / xMax * (x1 - x0)).toFixed(1); };
    var Y = function (ms) { return (y0 - (Math.log10(ms) - lo) / (hi - lo) * (y0 - y1)).toFixed(1); };
    var ms = function (v) { return v >= 1000 ? +(v / 1000).toFixed(2) + ' s' : v + ' ms'; };
    var g = [];
    [1, 10, 100, 1000, 10000].forEach(function (t) {
      g.push('<line x1="' + x0 + '" y1="' + Y(t) + '" x2="' + x1 + '" y2="' + Y(t) + '" style="stroke:var(--line-2)"/>' +
        '<text x="' + (x0 - 8) + '" y="' + (+Y(t) + 4) + '" text-anchor="end" fill="currentColor">' + ms(t) + '</text>');
    });
    [0, 100000, 200000, 300000, 400000].forEach(function (r) {
      g.push('<text x="' + X(r) + '" y="' + (y0 + 20) + '" text-anchor="middle" fill="currentColor">' + (r ? r / 1000 + 'k' : '0') + '</text>');
    });
    g.push('<text x="' + ((x0 + x1) / 2) + '" y="' + (y0 + 40) + '" text-anchor="middle" fill="currentColor">offered msg/s</text>');
    var c = L.competitor;
    g.push('<line x1="' + X(c.rate) + '" y1="' + y1 + '" x2="' + X(c.rate) + '" y2="' + y0 + '" style="stroke:var(--amber)" stroke-width="2" stroke-dasharray="5 5"/>' +
      '<text x="' + (+X(c.rate) - 8) + '" y="' + (y1 + 14) + '" text-anchor="end" style="fill:var(--amber)">' + esc(c.name) + ' published peak, ' + c.rate / 1000 + 'k</text>');
    g.push('<polyline class="draw" fill="none" style="stroke:var(--accent)" stroke-width="3" stroke-linejoin="round" points="' +
      L.carried.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '"/>');
    L.carried.forEach(function (p, i) {
      var gap = X(c.rate) - X(p[0]), last = i === L.carried.length - 1 || (gap > 0 && gap < 75); // keep labels off the marker
      g.push('<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="5.5" style="fill:var(--accent)"/>' +
        '<text x="' + (+X(p[0]) + (last ? -12 : 10)) + '" y="' + (+Y(p[1]) + (last ? 4 : 18)) + '" text-anchor="' + (last ? 'end' : 'start') + '" style="fill:var(--text)">' + ms(p[1]) + '</text>');
    });
    L.throttled.forEach(function (p) {
      g.push('<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="5" fill="none" style="stroke:var(--dim)" stroke-width="2"/>');
    });
    var top = L.carried[L.carried.length - 1];
    $('lat-chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" font-family="JetBrains Mono, monospace" font-size="12" aria-label="Ack p99 latency by offered load, durable QoS 1 on ' + esc(L.title) +
      ': ' + L.carried.map(function (p) { return p[0].toLocaleString('en-US') + ' msg/s at ' + ms(p[1]); }).join(', ') + ', every step with no message lost. Above ' + top[0].toLocaleString('en-US') +
      ' the brokers slowed publishers and still lost nothing.">' + g.join('') + '</svg>';
  })();

  /* ---------- benchmark bars ---------- */
  function bars(el, rows) {
    var max = Math.max.apply(null, rows.map(function (b) { return b.val; }));
    el.innerHTML = rows.map(function (b, i) {
      return '<div class="brow"><div class="nm">' + esc(b.name) + ' <small>' + esc(b.ver) + '</small></div>' +
        '<div class="track"><div class="fill' + (b.ours ? ' ours' : '') + '" style="width:' + (b.val / max * 100) + '%;transition-delay:' + (i * 0.15) + 's"></div></div>' +
        '<div class="val">' + b.val.toLocaleString('en-US') + '</div></div>';
    }).join('');
  }
  bars($('pervcpu'), D.perVcpu);
  bars($('bench'), D.bench);
  $('lat').innerHTML = D.latency.map(function (l) {
    return '<div class="lrow"><div class="lt"><span>' + esc(l.name) + '</span><span class="mono">' + l.pct + '%</span></div>' +
      '<div class="track"><div class="fill' + (l.ours ? ' ours' : '') + '" style="width:' + l.pct + '%"></div></div></div>';
  }).join('');

  // animate bars and curves when they scroll into view
  var targets = [$('pervcpu'), $('bench'), $('lat')].concat([].slice.call(document.querySelectorAll('.chart')));
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
  var RATE_MIN = 10000, RATE_SPAN = 200; // slider covers 10k .. 2M msg/s, log scale
  var state = { rateIdx: 62, price: T.defaultPrice, wl: T.defaultWl };
  var usd = function (x) { return '$' + Math.round(x).toLocaleString('en-US'); };
  var fmtRate = function (r) { return r >= 1e6 ? +(r / 1e6).toFixed(2) + 'M' : Math.round(r / 1000) + 'k'; };
  var fmtVcpu = function (v) { return (v < 100 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + ' vCPU'; };

  // mqttd capacity from a measured curve: linear between measured points, the
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
  // -> { n, how: 'measured' | 'interpolated' | 'extrapolated' }, or null when not proven
  var mqttdFor = function (r, c, noExtra) {
    var last = c[c.length - 1];
    if ((c.length < 2 || noExtra) && r > last[1]) return null;
    for (var n = T.minNodes; n < 1000; n++) {
      if (capAt(c, n) >= r) {
        var hit = c.some(function (q) { return q[0] === n; });
        return { n: n, how: n > last[0] ? 'extrapolated' : hit || n === c[0][0] ? 'measured' : 'interpolated' };
      }
    }
    return null;
  };
  // A competitor priced per vCPU through its published point, with the same 3-node HA floor.
  var theirVcpu = function (r, o, w) { return Math.max(T.minNodes * w.vcpu, r / o.perVcpu); };

  $('workloads').innerHTML = Object.keys(T.workloads).map(function (id) {
    return '<button type="button" class="wl" data-wl="' + id + '" aria-pressed="' + (id === state.wl) + '">' + esc(T.workloads[id].label) + '</button>';
  }).join('');
  $('workloads').addEventListener('click', function (e) {
    var b = e.target.closest('[data-wl]');
    if (!b) return;
    state.wl = b.getAttribute('data-wl');
    renderTco();
  });
  $('rate').value = state.rateIdx;
  $('price').value = state.price;
  $('rate').addEventListener('input', function (e) { state.rateIdx = +e.target.value; renderTco(); });
  $('price').addEventListener('input', function (e) { state.price = +e.target.value; renderTco(); });

  function renderTco() {
    var raw = RATE_MIN * Math.pow(RATE_SPAN, state.rateIdx / 100);
    var mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
    var rate = Math.round(raw / mag) * mag;
    var w = T.workloads[state.wl];
    var p = state.price, nodeP = p * w.vcpu;
    var mq = mqttdFor(rate, w.curve, w.extrapolate === false);
    var slope = slopeOf(w.curve);
    var lastPt = w.curve[w.curve.length - 1];

    $('rate-label').textContent = fmtRate(rate) + ' msg/s';
    $('price-label').textContent = '$' + p.toFixed(2) + '/vCPU·mo';
    $('wl-desc').textContent = w.desc;
    $('mq-nodes-l').textContent = 'MQTTD NODES · ' + w.vcpu + ' VCPU';
    $('mq-nodes').textContent = mq ? mq.n : '—';
    $('mq-cost').textContent = mq ? usd(mq.n * nodeP) : '—';
    $('marginal').textContent = slope ? '$' + (nodeP / (slope / 1000)).toFixed(2) : '—';
    document.querySelectorAll('.wl[data-wl]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-wl') === state.wl)); });

    var pts = w.curve.map(function (q) { return q[0] + ' → ' + fmtRate(q[1]); }).join(', ');
    var how = { interpolated: ' Interpolated between measured clusters.', extrapolated: ' Extrapolated past the largest measured cluster on ~' + fmtRate(slope) + ' msg/s per added node.' };
    var mqNote = 'Measured on ' + w.node + ': ' + pts + ' msg/s.' + ((mq && how[mq.how]) || '') + ' Apache-2.0, clustering free.';
    var rows = [{ name: 'mqttd', note: mqNote, ours: true }].concat(w.others).map(function (d) {
      if (d.ours) return mq ? { d: d, label: mq.n + ' × ' + w.vcpu + ' vCPU', cost: mq.n * nodeP } : { d: d, label: 'beyond the largest measured cluster', cost: 0 };
      var v = theirVcpu(rate, d, w);
      return { d: d, label: fmtVcpu(v), cost: v * p };
    });
    var max = Math.max.apply(null, rows.map(function (r) { return r.cost; })) || 1;
    $('alts').innerHTML = rows.map(function (r) {
      var pct = r.cost ? Math.max(r.cost / max * 100, 2) : 0;
      return '<div class="alt"><div class="at"><span><b>' + esc(r.d.name) + '</b> <small>· ' + esc(r.label) + '</small></span><span class="mono">' + (r.cost ? usd(r.cost) + '/mo' : '—') + '</span></div>' +
        '<div class="track"><div class="fill ' + (r.d.ours ? 'ours' : 'amber') + '" style="width:' + pct + '%"></div></div>' +
        '<div class="nt">' + esc(r.d.note) + '</div></div>';
    }).join('') + (w.others.length ? '' : '<p class="note">No competitor has published a like-for-like figure for this workload, so none is drawn.</p>');
    renderSwitch(rate, w, p);
  }

  /* ---------- switch from HiveMQ / EMQX (driven by the TCO state) ---------- */
  var S = D.switchFrom;
  var sw = Object.keys(S)[0];
  $('sw-tabs').innerHTML = Object.keys(S).map(function (k) {
    return '<button type="button" class="wl" data-sw="' + k + '" aria-pressed="' + (k === sw) + '">From ' + esc(S[k].label) + '</button>';
  }).join('');
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
    $('sw-facts').innerHTML = c.facts.map(function (f) {
      return '<div class="stat"><b>' + esc(f[0]) + '</b><span>' + esc(f[1]) + '</span><span class="nt">' + esc(f[2]) + '</span></div>';
    }).join('');
    $('sw-steps').innerHTML = c.steps.map(function (s) {
      return '<li><b>' + esc(s[0]) + '</b> ' + esc(s[1]) + '</li>';
    }).join('');
    $('sw-keep').textContent = c.keep;

    $('sw-save').innerHTML = c.headline;
    $('sw-sub').textContent = c.sub;
    $('sw-upto-note').textContent = c.headlineNote;

    var find = function (wk) { return wk.others.filter(function (o) { return o.name === c.cmp; })[0]; };
    var withData = Object.keys(T.workloads).map(function (k) { return T.workloads[k]; }).filter(find);
    $('sw-live').hidden = !withData.length;
    if (!withData.length) return;

    // Live comparison at the calculator's load; fall back to a workload with data.
    var wl = find(w) ? w : withData[0], them = find(wl);
    var us = mqttdFor(rate, wl.curve, wl.extrapolate === false), tv = theirVcpu(rate, them, wl);
    var pre = wl !== w ? w.label + ' has no published ' + c.label + ' figure, so this uses ' + wl.label + '. ' : '';
    $('sw-them-l').textContent = c.label.toUpperCase() + ' · VCPU';
    $('sw-them').textContent = Math.round(tv);
    $('sw-us').textContent = us ? us.n * wl.vcpu : '—';
    $('sw-year').textContent = us ? usd(Math.max(0, tv * p - us.n * wl.vcpu * p) * 12) : '—';
    if (!us) {
      var lp = wl.curve[wl.curve.length - 1];
      $('sw-note').textContent = pre + 'mqttd ' + wl.label + ' is measured up to ' + fmtRate(lp[1]) + ' msg/s on ' + lp[0] + ' nodes, and its per-node rate falls with size, so there is no mqttd figure at ' +
        fmtRate(rate) + ' msg/s. Lower the rate in the calculator, or see the site-bridge shape, measured to 2M.';
    } else {
      var ours = us.n * wl.vcpu;
      $('sw-note').textContent = pre + 'At ' + fmtRate(rate) + ' msg/s ' + wl.label + ' and $' + p.toFixed(2) + ' per vCPU-month: ' + usd(tv * p) + '/mo on ' + them.name +
        ' vs ' + usd(ours * p) + '/mo on ' + us.n + ' mqttd nodes' + (tv > ours ? ' (' + (tv / ours).toFixed(1) + '× less hardware).' : ', both at the three-node HA minimum.') +
        (us.how === 'measured' ? '' : ' The mqttd node count is ' + us.how + ' from measured clusters.') +
        ' Licence and support fees come on top for ' + c.label + '. Same caveats as the calculator.';
    }
  }
  renderTco();
})();
