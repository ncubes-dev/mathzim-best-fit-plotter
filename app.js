(() => {
  const $ = s => document.querySelector(s);
  const KEY = 'dataplotter:v1';
  let S = { xl: '', yl: '', rows: [['', ''], ['', ''], ['', '']], zero: true, prop: 'm' };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  let fit = null;

  // ---------- table ----------
  function renderRows() {
    $('#rows').innerHTML = S.rows.map((r, i) => `<tr>
      <td>${i + 1}</td>
      <td><input data-i="${i}" data-j="0" type="number" step="any" inputmode="decimal" value="${r[0]}" aria-label="x value ${i + 1}"></td>
      <td><input data-i="${i}" data-j="1" type="number" step="any" inputmode="decimal" value="${r[1]}" aria-label="y value ${i + 1}"></td>
      <td><button class="ghost del" data-del="${i}" aria-label="Delete row ${i + 1}">✕</button></td></tr>`).join('');
  }
  function renderHeads() {
    $('#xh').textContent = S.xl || 'x'; $('#yh').textContent = S.yl || 'y';
  }
  $('#rows').addEventListener('input', e => {
    const t = e.target; if (t.dataset.i === undefined) return;
    S.rows[+t.dataset.i][+t.dataset.j] = t.value; save();
  });
  $('#rows').addEventListener('click', e => {
    const d = e.target.closest('[data-del]'); if (!d) return;
    S.rows.splice(+d.dataset.del, 1); if (!S.rows.length) S.rows.push(['', '']);
    save(); renderRows();
  });
  $('#add').onclick = () => { S.rows.push(['', '']); save(); renderRows();
    const ins = document.querySelectorAll('#rows input'); ins[ins.length - 2].focus(); };
  $('#clear').onclick = () => { if (confirm('Delete all data?')) { S.rows = [['', ''], ['', ''], ['', '']]; save(); renderRows(); fit = null; $('#out').textContent = ''; draw(); } };
  $('#xl').oninput = e => { S.xl = e.target.value; save(); renderHeads(); };
  $('#yl').oninput = e => { S.yl = e.target.value; save(); renderHeads(); };
  $('#zero').onchange = e => { S.zero = e.target.checked; save(); if (fit) plot(); };
  $('#prop').onchange = e => { S.prop = e.target.value; save(); showResult(); };

  // ---------- maths ----------
  const points = () => S.rows.filter(r => r[0] !== '' && r[1] !== '' && isFinite(r[0]) && isFinite(r[1])).map(r => [+r[0], +r[1]]);
  function leastSquares(p) {
    const n = p.length; let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (const [x, y] of p) { sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y; }
    const den = n * sxx - sx * sx; if (den === 0) return null;
    const m = (n * sxy - sx * sy) / den, c = (sy - m * sx) / n;
    const ssTot = syy - sy * sy / n, ssRes = p.reduce((a, [x, y]) => a + (y - (m * x + c)) ** 2, 0);
    return { m, c, r2: ssTot === 0 ? 1 : 1 - ssRes / ssTot };
  }
  const fmt = v => String(parseFloat(v.toPrecision(4)));

  function niceScale(min, max) {
    if (min === max) { min -= 1; max += 1; }
    const raw = (max - min) / 6, mag = 10 ** Math.floor(Math.log10(raw)), f = raw / mag;
    const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
    return { lo: Math.floor(min / step + 1e-9) * step, hi: Math.ceil(max / step - 1e-9) * step, step };
  }

  // ---------- graph ----------
  const cv = $('#c'), ctx = cv.getContext('2d');
  function draw() {
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = Math.round(Math.min(W * 0.75, 520));
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const p = points(); if (!fit || p.length < 2) return;
    const L = 58, R = 14, T = 14, B = 48, pw = W - L - R, ph = H - T - B;
    let xs = p.map(a => a[0]), ys = p.map(a => a[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (S.zero) { x0 = Math.min(0, x0); y0 = Math.min(0, y0); x1 = Math.max(0, x1); y1 = Math.max(0, y1); }
    const X = niceScale(x0, x1), Y = niceScale(y0, y1);
    const px = x => L + (x - X.lo) / (X.hi - X.lo) * pw, py = y => T + ph - (y - Y.lo) / (Y.hi - Y.lo) * ph;
    ctx.font = '12px system-ui,sans-serif'; ctx.lineWidth = 1;
    ctx.strokeStyle = '#d9e4d9'; ctx.fillStyle = '#6b7680';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = X.lo; v <= X.hi + X.step / 2; v += X.step) { ctx.beginPath(); ctx.moveTo(px(v), T); ctx.lineTo(px(v), T + ph); ctx.stroke(); ctx.fillText(fmt(v), px(v), T + ph + 6); }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = Y.lo; v <= Y.hi + Y.step / 2; v += Y.step) { ctx.beginPath(); ctx.moveTo(L, py(v)); ctx.lineTo(L + pw, py(v)); ctx.stroke(); ctx.fillText(fmt(v), L - 6, py(v)); }
    ctx.strokeStyle = '#1f3a5f'; ctx.lineWidth = 2; ctx.strokeRect(L, T, pw, ph);
    ctx.fillStyle = '#1f3a5f'; ctx.font = '13px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(S.xl || 'x', L + pw / 2, H - 4);
    ctx.save(); ctx.translate(14, T + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'top'; ctx.fillText(S.yl || 'y', 0, -6); ctx.restore();
    // line of best fit (clipped to plot area)
    ctx.save(); ctx.beginPath(); ctx.rect(L, T, pw, ph); ctx.clip();
    ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px(X.lo), py(fit.m * X.lo + fit.c)); ctx.lineTo(px(X.hi), py(fit.m * X.hi + fit.c)); ctx.stroke(); ctx.restore();
    // data points as crosses
    ctx.strokeStyle = '#1f3a5f'; ctx.lineWidth = 2;
    for (const [x, y] of p) { const a = px(x), b = py(y); ctx.beginPath(); ctx.moveTo(a - 5, b - 5); ctx.lineTo(a + 5, b + 5); ctx.moveTo(a - 5, b + 5); ctx.lineTo(a + 5, b - 5); ctx.stroke(); }
  }
  function showResult() {
    if (!fit) { $('#out').textContent = ''; return; }
    const { m, c, r2 } = fit, sign = c < 0 ? '−' : '+';
    $('#out').textContent = { m: 'Gradient = ' + fmt(m), c: 'Intercept = ' + fmt(c), r2: 'R² = ' + fmt(r2),
      all: `y = ${fmt(m)}x ${sign} ${fmt(Math.abs(c))}` }[S.prop];
  }
  function plot() {
    const p = points();
    if (p.length < 2) { fit = null; draw(); showResult(); return; }
    fit = leastSquares(p);
    if (!fit) { draw(); showResult(); return; }
    draw(); showResult();
  }
  $('#plot').onclick = plot;
  $('#png').onclick = () => { if (!fit) return; const a = document.createElement('a'); a.download = 'graph.png'; a.href = cv.toDataURL('image/png'); a.click(); };
  window.addEventListener('resize', draw);

  // ---------- init + offline ----------
  $('#xl').value = S.xl; $('#yl').value = S.yl; $('#zero').checked = S.zero; $('#prop').value = S.prop;
  renderRows(); renderHeads();
  const net = () => { $('#net').textContent = navigator.onLine ? '' : 'Offline'; };
  addEventListener('online', net); addEventListener('offline', net); net();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
