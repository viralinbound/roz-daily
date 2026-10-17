// Tools: everyday calculators, a focus timer and a tap counter. All offline.
import { store } from '../store.js';
import { h, icon, money, money0, num, toNum, dkey, parseKey, addDays, seg, viewHeader, toast, shareText, vibrate, confirmSheet } from '../ui.js';

/* ---------- shared bits ---------- */

const row = (k, v) => h('div', { class: 'rrow' }, h('span', null, k), h('b', null, v));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function numField({ label, value = '', pre, suf, onInput }) {
  const input = h('input', {
    class: 'input' + (pre ? ' has-pre' : '') + (suf ? ' has-suf' : ''), type: 'text', inputmode: 'decimal', placeholder: '0',
    autocomplete: 'off', value: String(value),
    oninput: (e) => onInput(e.target.value),
    onfocus: (e) => e.target.select(),
  });
  return h('label', { class: 'field' }, h('span', null, label),
    h('div', { class: 'affix' }, input, pre && h('span', { class: 'pre' }, pre), suf && h('span', { class: 'suf' }, suf)));
}

function dateField(label, value, onInput) {
  return h('label', { class: 'field' }, h('span', null, label),
    h('input', { class: 'input', type: 'date', value, oninput: (e) => onInput(e.target.value), onchange: (e) => onInput(e.target.value) }));
}

function stepper(value, min, max, onChange, label) {
  let v = value;
  const out = h('output', { class: 'num' }, String(v));
  const set = (n) => { v = Math.max(min, Math.min(max, n)); out.textContent = String(v); onChange(v); };
  return h('div', { class: 'stepper', role: 'group', 'aria-label': label },
    h('button', { type: 'button', 'aria-label': 'Decrease', onclick: () => set(v - 1) }, '−'),
    out,
    h('button', { type: 'button', 'aria-label': 'Increase', onclick: () => set(v + 1) }, '+'));
}

function chipPick(options, current, onPick, label) {
  const box = h('div', { class: 'chips', role: 'group', 'aria-label': label, style: { marginBottom: '14px' } });
  const draw = () => box.replaceChildren(...options.map(([v, l]) =>
    h('button', { class: 'chip', type: 'button', 'aria-pressed': String(v === current), onclick: () => { current = v; draw(); onPick(v); } }, l)));
  draw();
  return box;
}

function segSelf(options, current, onPick, label) {
  const box = h('div');
  const draw = () => box.replaceChildren(seg(options, current, (v) => { current = v; draw(); onPick(v); }, label));
  draw();
  return box;
}

function splitBar(parts) {
  const total = parts.reduce((a, p) => a + p[1], 0) || 1;
  return [
    h('div', { class: 'split-bar' }, parts.map(([, v, c]) => h('i', { style: { width: (v / total) * 100 + '%', background: c } }))),
    h('div', { class: 'legend' }, parts.map(([l, v, c]) => h('span', null, h('i', { style: { background: c } }), `${l} ${Math.round((v / total) * 100)}%`))),
  ];
}

/* ---------- split the bill ---------- */

function splitTool() {
  let bill = '', people = 2, tip = 0;
  const out = h('div', { class: 'result', 'aria-live': 'polite' });
  const calc = () => {
    const b = toNum(bill);
    const total = b * (1 + tip / 100);
    const each = total / people;
    out.replaceChildren(
      h('div', { class: 'lbl' }, 'Each person pays'),
      h('div', { class: 'big num' }, money(each)),
      h('div', { class: 'rows' },
        row('Bill', money(b)),
        tip > 0 && row(`Tip ${tip}%`, money(total - b)),
        row('Total', money(total)),
        row('Rounded up', `${money0(Math.ceil(each))} each`)),
      b > 0 && h('button', { class: 'btn sm', type: 'button', style: { marginTop: '12px' }, onclick: () => shareText(`Bill ${money(total)} split ${people} ways = ${money(each)} each.`, 'Bill split') }, icon('share', 16), 'Share'));
  };
  calc();
  return h('div', null,
    numField({ label: 'Bill amount', pre: '₹', onInput: (v) => { bill = v; calc(); } }),
    h('div', { class: 'field' }, h('span', null, 'People'), stepper(people, 1, 50, (v) => { people = v; calc(); }, 'People')),
    h('div', { class: 'field' }, h('span', null, 'Tip'), chipPick([[0, 'No tip'], [5, '5%'], [10, '10%'], [15, '15%']], tip, (v) => { tip = v; calc(); }, 'Tip')),
    out);
}

/* ---------- EMI ---------- */

function emiTool() {
  let P = '500000', rate = '9', term = '5', unit = 'y';
  const out = h('div', { class: 'result', 'aria-live': 'polite' });
  const calc = () => {
    const p = toNum(P), n = Math.round(toNum(term) * (unit === 'y' ? 12 : 1)), r = toNum(rate) / 12 / 100;
    if (p <= 0 || n <= 0) { out.replaceChildren(h('div', { class: 'lbl' }, 'Enter loan amount and tenure')); return; }
    const emi = r === 0 ? p / n : (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    const total = emi * n;
    out.replaceChildren(
      h('div', { class: 'lbl' }, 'Monthly EMI'),
      h('div', { class: 'big num' }, money0(emi)),
      h('div', { class: 'rows' },
        row('Loan amount', money0(p)),
        row('Total interest', money0(total - p)),
        row(`Total paid in ${n} months`, money0(total))),
      splitBar([['Principal', p, 'var(--water)'], ['Interest', total - p, 'var(--accent)']]));
  };
  calc();
  return h('div', null,
    numField({ label: 'Loan amount', pre: '₹', value: P, onInput: (v) => { P = v; calc(); } }),
    numField({ label: 'Interest rate', suf: '% / yr', value: rate, onInput: (v) => { rate = v; calc(); } }),
    h('div', { class: 'grid2' },
      numField({ label: 'Tenure', value: term, onInput: (v) => { term = v; calc(); } }),
      h('div', { class: 'field' }, h('span', null, 'In'), segSelf([['y', 'Years'], ['m', 'Months']], unit, (v) => { unit = v; calc(); }, 'Tenure unit'))),
    out);
}

/* ---------- GST ---------- */

function gstTool() {
  let amt = '1000', rate = 18, custom = '', mode = 'add';
  const out = h('div', { class: 'result', 'aria-live': 'polite' });
  const calc = () => {
    const a = toNum(amt);
    const r = custom !== '' ? toNum(custom) : rate;
    const base = mode === 'add' ? a : (a * 100) / (100 + r);
    const tax = mode === 'add' ? (a * r) / 100 : a - base;
    out.replaceChildren(
      h('div', { class: 'lbl' }, mode === 'add' ? `Price with ${num(r)}% GST` : 'Price before GST'),
      h('div', { class: 'big num' }, money(mode === 'add' ? base + tax : base)),
      h('div', { class: 'rows' },
        row('Base price', money(base)),
        row(`CGST ${num(r / 2)}%`, money(tax / 2)),
        row(`SGST ${num(r / 2)}%`, money(tax / 2)),
        row('Total GST', money(tax)),
        row('Final price', money(base + tax))));
  };
  calc();
  const customField = numField({ label: 'Other rate (optional)', suf: '%', onInput: (v) => { custom = v.trim(); calc(); } });
  return h('div', null,
    segSelf([['add', 'Add GST'], ['remove', 'Remove GST']], mode, (v) => { mode = v; calc(); }, 'Mode'),
    numField({ label: 'Amount', pre: '₹', value: amt, onInput: (v) => { amt = v; calc(); } }),
    h('div', { class: 'field' }, h('span', null, 'GST rate'),
      chipPick([[3, '3%'], [5, '5%'], [18, '18%'], [40, '40%']], rate, (v) => {
        rate = v; custom = '';
        customField.querySelector('input').value = '';
        calc();
      }, 'GST rate')),
    customField,
    out,
    h('p', { class: 'disclaimer' }, 'For sales to another state, IGST = CGST + SGST. Check the exact rate for your item.'));
}

/* ---------- discount & percent ---------- */

function percentTool() {
  let price = '', off = '';
  const r1 = h('div', { class: 'result', 'aria-live': 'polite' });
  const c1 = () => {
    const p = toNum(price), d = Math.min(100, toNum(off));
    r1.replaceChildren(h('div', { class: 'lbl' }, 'You pay'), h('div', { class: 'big num' }, money(p * (1 - d / 100))),
      h('div', { class: 'rows' }, row('You save', money((p * d) / 100))));
  };
  let x = '', y = '';
  const r2 = h('div', { class: 'result', 'aria-live': 'polite' });
  const c2 = () => {
    r2.replaceChildren(h('div', { class: 'lbl' }, `${x || 0}% of ${y || 0}`), h('div', { class: 'big num' }, num((toNum(x) * toNum(y)) / 100)),
      toNum(y) !== 0 && h('div', { class: 'rows' }, row(`${x || 0} is what % of ${y}`, num((toNum(x) / toNum(y)) * 100) + '%')));
  };
  let a = '', b = '';
  const r3 = h('div', { class: 'result', 'aria-live': 'polite' });
  const c3 = () => {
    const A = toNum(a), B = toNum(b);
    const ch = A === 0 ? 0 : ((B - A) / Math.abs(A)) * 100;
    r3.replaceChildren(h('div', { class: 'lbl' }, ch >= 0 ? 'Increase' : 'Decrease'), h('div', { class: 'big num' }, (ch > 0 ? '+' : '') + num(ch) + '%'),
      h('div', { class: 'rows' }, row('Difference', num(B - A))));
  };
  c1(); c2(); c3();
  return h('div', null,
    h('div', { class: 'section-label', style: { marginTop: 0 } }, 'Sale price'),
    h('div', { class: 'grid2' },
      numField({ label: 'Price', pre: '₹', onInput: (v) => { price = v; c1(); } }),
      numField({ label: 'Discount', suf: '%', onInput: (v) => { off = v; c1(); } })),
    r1,
    h('div', { class: 'section-label' }, 'Percentage of'),
    h('div', { class: 'grid2' },
      numField({ label: 'Percent', suf: '%', onInput: (v) => { x = v; c2(); } }),
      numField({ label: 'Of number', onInput: (v) => { y = v; c2(); } })),
    r2,
    h('div', { class: 'section-label' }, 'Change between two numbers'),
    h('div', { class: 'grid2' },
      numField({ label: 'From', onInput: (v) => { a = v; c3(); } }),
      numField({ label: 'To', onInput: (v) => { b = v; c3(); } })),
    r3);
}

/* ---------- SIP ---------- */

function sipTool() {
  let P = '5000', rate = '12', years = '10';
  const out = h('div', { class: 'result', 'aria-live': 'polite' });
  const calc = () => {
    const p = toNum(P), n = Math.round(toNum(years) * 12), i = toNum(rate) / 12 / 100;
    const fv = i === 0 ? p * n : p * (((1 + i) ** n - 1) / i) * (1 + i);
    const invested = p * n;
    out.replaceChildren(
      h('div', { class: 'lbl' }, `Estimated value after ${num(toNum(years))} years`),
      h('div', { class: 'big num' }, money0(fv)),
      h('div', { class: 'rows' }, row('You invest', money0(invested)), row('Estimated gains', money0(fv - invested))),
      invested > 0 && splitBar([['Invested', invested, 'var(--water)'], ['Gains', Math.max(0, fv - invested), 'var(--good)']]));
  };
  calc();
  return h('div', null,
    numField({ label: 'Monthly investment', pre: '₹', value: P, onInput: (v) => { P = v; calc(); } }),
    h('div', { class: 'grid2' },
      numField({ label: 'Expected return', suf: '% / yr', value: rate, onInput: (v) => { rate = v; calc(); } }),
      numField({ label: 'Time', suf: 'years', value: years, onInput: (v) => { years = v; calc(); } })),
    out,
    h('p', { class: 'disclaimer' }, 'An estimate using a fixed yearly return. Real market returns go up and down and are not guaranteed.'));
}

/* ---------- age & dates ---------- */

function ageTool() {
  let dob = '';
  const r1 = h('div', { class: 'result', 'aria-live': 'polite' });
  const c1 = () => {
    if (!dob) { r1.replaceChildren(h('div', { class: 'lbl' }, 'Pick a date of birth')); return; }
    const b = parseKey(dob), t = parseKey(dkey());
    if (b > t) { r1.replaceChildren(h('div', { class: 'lbl' }, 'That date is in the future')); return; }
    let y = t.getFullYear() - b.getFullYear(), m = t.getMonth() - b.getMonth(), d = t.getDate() - b.getDate();
    if (d < 0) { m--; d += new Date(t.getFullYear(), t.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const lived = Math.round((t - b) / 86400000);
    let next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (next < t) next = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate());
    const until = Math.round((next - t) / 86400000);
    r1.replaceChildren(
      h('div', { class: 'lbl' }, 'Age'),
      h('div', { class: 'big num' }, `${y} yrs`),
      h('div', { class: 'rows' },
        row('Exactly', `${plural(y, 'year')}, ${plural(m, 'month')}, ${plural(d, 'day')}`),
        row('Days lived', num(lived, 0)),
        row('Next birthday', until === 0 ? 'Today! Happy birthday 🎂' : `in ${until} days · ${next.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`)));
  };
  let from = dkey(), to = dkey(addDays(new Date(), 30));
  const r2 = h('div', { class: 'result', 'aria-live': 'polite' });
  const c2 = () => {
    if (!from || !to) { r2.replaceChildren(h('div', { class: 'lbl' }, 'Pick both dates')); return; }
    const days = Math.round((parseKey(to) - parseKey(from)) / 86400000);
    const ad = Math.abs(days);
    r2.replaceChildren(
      h('div', { class: 'lbl' }, days < 0 ? 'Days (end is before start)' : 'Days between'),
      h('div', { class: 'big num' }, `${num(ad, 0)} days`),
      h('div', { class: 'rows' }, row('In weeks', `${Math.floor(ad / 7)} weeks ${ad % 7} days`), row('Counting both days', `${num(ad + 1, 0)} days`)));
  };
  c1(); c2();
  return h('div', null,
    dateField('Date of birth', dob, (v) => { dob = v; c1(); }),
    r1,
    h('div', { class: 'section-label' }, 'Days between two dates'),
    h('div', { class: 'grid2' }, dateField('From', from, (v) => { from = v; c2(); }), dateField('To', to, (v) => { to = v; c2(); })),
    r2);
}

/* ---------- unit converter ---------- */

const UNITS = {
  length: ['Length', [['mm', 'Millimetre', 0.001], ['cm', 'Centimetre', 0.01], ['m', 'Metre', 1], ['km', 'Kilometre', 1000], ['in', 'Inch', 0.0254], ['ft', 'Foot', 0.3048], ['yd', 'Yard', 0.9144], ['mi', 'Mile', 1609.344]]],
  weight: ['Weight', [['mg', 'Milligram', 1e-6], ['g', 'Gram', 0.001], ['kg', 'Kilogram', 1], ['tola', 'Tola', 0.0116638038], ['q', 'Quintal', 100], ['t', 'Tonne', 1000], ['oz', 'Ounce', 0.028349523125], ['lb', 'Pound', 0.45359237]]],
  area: ['Area', [['sqft', 'Square foot', 0.09290304], ['sqm', 'Square metre', 1], ['gaj', 'Square yard (gaj)', 0.83612736], ['cent', 'Cent', 40.468564224], ['acre', 'Acre', 4046.8564224], ['ha', 'Hectare', 10000], ['sqkm', 'Square km', 1e6]]],
  volume: ['Volume', [['ml', 'Millilitre', 0.001], ['l', 'Litre', 1], ['tsp', 'Teaspoon', 0.00492892], ['tbsp', 'Tablespoon', 0.0147868], ['cup', 'Cup (US)', 0.236588], ['gal', 'Gallon (US)', 3.78541]]],
  temp: ['Temperature', [['c', 'Celsius'], ['f', 'Fahrenheit'], ['k', 'Kelvin']]],
};
const toC = { c: (v) => v, f: (v) => ((v - 32) * 5) / 9, k: (v) => v - 273.15 };
const fromC = { c: (v) => v, f: (v) => (v * 9) / 5 + 32, k: (v) => v + 273.15 };
const sig = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 7 });

function unitsTool() {
  let cat = 'length', from = 'ft', val = '1';
  const listBox = h('ul', { class: 'conv', 'aria-live': 'polite' });
  const selBox = h('div');
  const calc = () => {
    const [, units] = UNITS[cat];
    const v = toNum(val);
    listBox.replaceChildren(...units.filter((u) => u[0] !== from).map((u) => {
      let r;
      if (cat === 'temp') r = fromC[u[0]](toC[from](v));
      else r = (v * units.find((x) => x[0] === from)[2]) / u[2];
      return h('li', null, h('span', null, u[1]), h('b', null, `${sig.format(r)} ${u[0] === 'c' ? '°C' : u[0] === 'f' ? '°F' : u[0] === 'k' ? 'K' : u[0]}`));
    }));
  };
  const drawSelect = () => {
    const [, units] = UNITS[cat];
    const sel = h('select', { class: 'select', 'aria-label': 'From unit', onchange: (e) => { from = e.target.value; calc(); } },
      units.map((u) => h('option', { value: u[0], selected: u[0] === from }, u[1])));
    selBox.replaceChildren(h('label', { class: 'field' }, h('span', null, 'Unit'), sel));
  };
  const defaults = { length: 'ft', weight: 'kg', area: 'sqft', volume: 'l', temp: 'c' };
  drawSelect();
  calc();
  const catChips = chipPick(Object.entries(UNITS).map(([k, [l]]) => [k, l]), cat, (v) => {
    cat = v; from = defaults[v]; drawSelect(); calc();
  }, 'Category');
  catChips.classList.add('scroll');
  return h('div', null,
    catChips,
    h('div', { class: 'grid2' }, numField({ label: 'Value', value: val, onInput: (v) => { val = v; calc(); } }), selBox),
    h('section', { class: 'card', style: { paddingTop: '6px', paddingBottom: '6px' } }, listBox));
}

/* ---------- focus timer ---------- */

const T = { preset: 'focus', total: 0, remaining: 0, endAt: 0, running: false, interval: null, wake: null, audio: null };
const RING = 2 * Math.PI * 54;

function presetMins(p) {
  return p === 'focus' ? store.state.timer.focus : p === 'short' ? 5 : 15;
}
function resetTimer(p = T.preset) {
  pauseTimer();
  T.preset = p;
  T.total = T.remaining = presetMins(p) * 60;
}
function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}
function paintTimer() {
  const t = document.getElementById('timer-time');
  if (!t) return;
  t.textContent = fmt(T.remaining);
  document.getElementById('timer-ring')?.setAttribute('stroke-dashoffset', String(RING * (1 - T.remaining / T.total)));
  document.getElementById('timer-go')?.replaceChildren(...goContent());
}
function goContent() {
  return [icon(T.running ? 'pause' : 'play', 20), T.running ? 'Pause' : T.remaining < T.total ? 'Resume' : 'Start'];
}
function tick() {
  T.remaining = Math.max(0, Math.round((T.endAt - Date.now()) / 1000));
  paintTimer();
  if (T.remaining === 0) finishTimer();
}
function beep() {
  try {
    const ctx = T.audio;
    if (!ctx) return;
    [0, 0.35, 0.7].forEach((at) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + 0.3);
    });
  } catch {}
}
function startTimer() {
  if (T.remaining === 0) T.remaining = T.total;
  try {
    T.audio ||= new (window.AudioContext || window.webkitAudioContext)();
    T.audio.resume?.();
  } catch {}
  T.endAt = Date.now() + T.remaining * 1000;
  T.running = true;
  clearInterval(T.interval);
  T.interval = setInterval(tick, 500);
  navigator.wakeLock?.request('screen').then((l) => { T.wake = l; }).catch(() => {});
  paintTimer();
}
function pauseTimer() {
  T.running = false;
  clearInterval(T.interval);
  T.wake?.release?.().catch?.(() => {});
  T.wake = null;
  paintTimer();
}
function finishTimer() {
  pauseTimer();
  beep();
  vibrate([200, 100, 200, 100, 300]);
  toast(T.preset === 'focus' ? 'Focus session done — take a short break' : 'Break over — back to it', { ms: 5000 });
  T.remaining = T.total;
  paintTimer();
}
document.addEventListener('visibilitychange', () => { if (T.running && document.visibilityState === 'visible') tick(); });

function timerTool() {
  if (!T.total) resetTimer('focus');
  const ring = h('div', { class: 'ring-wrap' });
  ring.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-bg" cx="60" cy="60" r="54" fill="none" stroke-width="9"/><circle id="timer-ring" class="ring-fg" cx="60" cy="60" r="54" fill="none" stroke-width="9" stroke-linecap="round" stroke-dasharray="${RING}" stroke-dashoffset="${RING * (1 - T.remaining / T.total)}"/></svg>`;
  ring.append(h('div', { class: 't' }, h('b', { id: 'timer-time', role: 'timer' }, fmt(T.remaining)), h('span', null, T.preset === 'focus' ? 'Focus' : 'Break')));
  const label = ring.querySelector('.t span');
  return h('div', null,
    chipPick([['focus', `Focus ${store.state.timer.focus}m`], ['short', 'Short break 5m'], ['long', 'Long break 15m']], T.preset, (p) => {
      resetTimer(p);
      label.textContent = p === 'focus' ? 'Focus' : 'Break';
      paintTimer();
    }, 'Timer preset'),
    ring,
    h('div', { class: 'row-actions', style: { marginTop: 0 } },
      h('button', { class: 'btn', type: 'button', onclick: () => { resetTimer(); paintTimer(); } }, icon('reset', 18), 'Reset'),
      h('button', { class: 'btn primary', id: 'timer-go', type: 'button', onclick: () => (T.running ? pauseTimer() : startTimer()) }, goContent())),
    h('div', { class: 'set-list', style: { marginTop: '18px' } },
      h('div', { class: 'set-row' },
        h('div', { class: 'l' }, h('b', null, 'Focus length'), h('span', null, 'Minutes per focus session')),
        stepper(store.state.timer.focus, 5, 90, (v) => {
          store.update((s) => { s.timer.focus = v; }, { silent: true });
          if (T.preset === 'focus' && !T.running) { resetTimer('focus'); paintTimer(); }
        }, 'Focus minutes'))),
    h('p', { class: 'disclaimer' }, 'Keep Roz open — the screen stays awake while the timer runs. It rings and vibrates when time is up.'));
}

/* ---------- tap counter ---------- */

function counterTool() {
  const c = () => store.state.counter;
  const countEl = h('b', { class: 'num' }, String(c().n));
  const roundEl = h('span');
  const bar = h('i');
  const barWrap = h('div', { class: 'bar', style: { margin: '0 auto 18px', maxWidth: '300px' } }, bar);
  const paint = () => {
    const { n, target } = c();
    countEl.textContent = String(n);
    if (target) {
      roundEl.textContent = `Round ${Math.floor(n / target) + 1} · ${n % target}/${target}`;
      bar.style.width = ((n % target) / target) * 100 + '%';
      barWrap.style.display = '';
    } else {
      roundEl.textContent = c().label || 'Tap to count';
      barWrap.style.display = 'none';
    }
  };
  const setN = (n) => store.update((s) => { s.counter.n = Math.max(0, n); }, { silent: true });
  const tap = h('button', {
    class: 'tap', type: 'button', 'aria-label': 'Add one',
    onclick: () => {
      setN(c().n + 1);
      const { n, target } = c();
      if (target && n % target === 0) { vibrate([120, 60, 120]); toast(`${target} done · round ${n / target} complete`); } else vibrate(8);
      paint();
    },
  }, countEl, roundEl);
  paint();
  const labelInput = h('input', { class: 'input', type: 'text', value: c().label, placeholder: 'e.g. Gayatri mantra, push-ups', autocomplete: 'off', oninput: (e) => { store.update((s) => { s.counter.label = e.target.value; }, { silent: true }); paint(); } });
  return h('div', null,
    tap,
    barWrap,
    h('div', { class: 'row-actions', style: { marginTop: 0 } },
      h('button', { class: 'btn', type: 'button', onclick: () => { setN(c().n - 1); paint(); } }, icon('minus', 18), '1'),
      h('button', {
        class: 'btn', type: 'button', onclick: async () => {
          if (c().n > 10 && !(await confirmSheet({ title: 'Reset the counter?', message: `You are at ${c().n}.`, ok: 'Reset' }))) return;
          setN(0); paint();
        },
      }, icon('reset', 18), 'Reset')),
    h('div', { class: 'section-label' }, 'Target (mala / sets)'),
    chipPick([[0, 'None'], [11, '11'], [21, '21'], [108, '108']], c().target, (v) => { store.update((s) => { s.counter.target = v; }, { silent: true }); paint(); }, 'Target'),
    h('label', { class: 'field' }, h('span', null, 'Label'), labelInput));
}

/* ---------- registry + views ---------- */

const TOOLS = [
  { id: 'split', name: 'Split the bill', desc: 'Per-person share, with tip', ic: 'users', tint: 'accent', render: splitTool },
  { id: 'emi', name: 'Loan EMI', desc: 'Monthly EMI and total interest', ic: 'bank', tint: 'water', render: emiTool },
  { id: 'gst', name: 'GST', desc: 'Add or remove GST, CGST/SGST', ic: 'receipt', tint: 'good', render: gstTool },
  { id: 'percent', name: 'Discount & %', desc: 'Sale price, % of, % change', ic: 'tag', tint: 'bad', render: percentTool },
  { id: 'sip', name: 'SIP growth', desc: 'What monthly saving can become', ic: 'trend', tint: 'good', render: sipTool },
  { id: 'age', name: 'Age & dates', desc: 'Exact age, days between dates', ic: 'cake', tint: 'accent', render: ageTool },
  { id: 'units', name: 'Unit converter', desc: 'Feet, gaj, tola, °F and more', ic: 'ruler', tint: 'water', render: unitsTool },
  { id: 'timer', name: 'Focus timer', desc: 'Work in calm 25-minute blocks', ic: 'timer', tint: 'bad', render: timerTool },
  { id: 'counter', name: 'Tap counter', desc: 'Jaap, reps, people, anything', ic: 'hash', tint: 'accent', render: counterTool },
];
const TINT = {
  accent: ['var(--accent-soft)', 'var(--accent-ink)'],
  water: ['var(--water-soft)', 'var(--water)'],
  good: ['var(--good-soft)', 'var(--good)'],
  bad: ['var(--bad-soft)', 'var(--bad)'],
};

export default {
  render(route) {
    const tool = TOOLS.find((t) => t.id === route.sub);
    if (tool) {
      return h('div', null,
        viewHeader({ back: '#/tools', eyebrow: 'Tools', title: tool.name }),
        tool.render());
    }
    return h('div', null,
      viewHeader({ eyebrow: 'Tools', title: 'Tools', sub: 'Quick answers for everyday sums.' }),
      h('div', { class: 'tools' }, TOOLS.map((t) => {
        const [bg, fg] = TINT[t.tint];
        const live = t.id === 'timer' && T.running;
        return h('a', { class: 'tool', href: `#/tools/${t.id}` },
          h('span', { class: 'ic', style: { background: bg, color: fg } }, icon(t.ic, 22)),
          h('span', null, h('b', null, t.name), h('span', null, live ? `Running · ${fmt(T.remaining)} left` : t.desc)));
      })));
  },
};
