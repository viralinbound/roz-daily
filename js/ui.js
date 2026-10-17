// Small DOM + formatting helpers shared by every view.

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  wallet: '<path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 6.5"/><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  note: '<path d="M14.5 3H6.5A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V8.5z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  trash: '<path d="M4 6.5h16M9.5 6.5V4.5h5v2M18.5 6.5l-.8 12.6a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9L5.5 6.5M10 11v6M14 11v6"/>',
  sliders: '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  pin: '<path d="M12 16.5V21M8 3.5h8M9 3.5v5.2L6.5 12v2.5h11V12L15 8.7V3.5"/>',
  share: '<path d="M4.5 12.5v6A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-6M16 7l-4-4-4 4M12 3v12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5L16 16"/>',
  drop: '<path d="M12 2.8s6.5 6.9 6.5 11.7a6.5 6.5 0 0 1-13 0C5.5 9.7 12 2.8 12 2.8z"/>',
  dropFill: '<path fill="currentColor" d="M12 2.8s6.5 6.9 6.5 11.7a6.5 6.5 0 0 1-13 0C5.5 9.7 12 2.8 12 2.8z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6a6 6 0 0 1 3.5 5.4"/>',
  bank: '<path d="M3 9.5L12 4l9 5.5M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20.5h18"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  cake: '<path d="M4 21h16M5 21v-7.5A2.5 2.5 0 0 1 7.5 11h9a2.5 2.5 0 0 1 2.5 2.5V21M5 16c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0 1.6-.6 2-.6M12 11V8M12 3c1 1.2 1 2.4 0 3-1-.6-1-1.8 0-3z"/>',
  ruler: '<path d="M3 16.5L16.5 3 21 7.5 7.5 21zM7 12.5l2 2M10 9.5l2 2M13 6.5l2 2"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2.5M9.5 2.5h5M19.5 6l-1.5-1.5"/>',
  hash: '<path d="M5 9h14M5 15h14M10 3.5L8.5 20.5M15.5 3.5L14 20.5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4.5 16.5v2A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-2"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4.5 16.5v2A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5v-2"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  play: '<path fill="currentColor" stroke="none" d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14" stroke-width="3"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>',
  chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
};

export function icon(name, size = 22) {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.9');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = ICONS[name] || '';
  return s;
}

const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'type']);

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROPS.has(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, kids);
  return el;
}

function append(el, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else el.append(k instanceof Node ? k : String(k));
  }
}

/* ---------- formatting ---------- */

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const money = (n) => (n < 0 ? '−₹' : '₹') + inr.format(Math.abs(Math.round(n * 100) / 100));
export const money0 = (n) => (n < 0 ? '−₹' : '₹') + inr0.format(Math.abs(Math.round(n)));
export const num = (n, d = 2) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: d }).format(n);
export const toNum = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/* ---------- dates (local time, stored as YYYY-MM-DD) ---------- */

const pad = (n) => String(n).padStart(2, '0');
export const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const daysBetween = (a, b) => Math.round((parseKey(dkey(b)) - parseKey(dkey(a))) / 86400000);

export function dayLabel(k) {
  const diff = daysBetween(new Date(), parseKey(k));
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return parseKey(k).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ---------- small widgets ---------- */

export function seg(options, current, onPick, label) {
  return h('div', { class: 'seg', role: 'group', 'aria-label': label },
    options.map(([val, text]) => h('button', {
      type: 'button', 'aria-pressed': String(val === current), onclick: () => onPick(val),
    }, text)));
}

// Views keep a little local UI state (selected month, search text); this asks the app to redraw.
export const rerender = () => window.dispatchEvent(new Event('roz:render'));

// Go back inside the app; if this page was the first one opened (e.g. from a home-screen shortcut), go to `fallback`.
export function goBack(fallback) {
  if (history.state?.root) location.hash = fallback;
  else history.back();
}

export function viewHeader({ eyebrow, title, sub, right, back }) {
  return h('header', null,
    back && h('button', { class: 'back', type: 'button', onclick: () => goBack(back) }, icon('left', 20), 'Back'),
    h('div', { class: 'vh' },
      h('div', null,
        eyebrow && h('div', { class: 'eyebrow' }, eyebrow),
        h('h1', null, title),
        sub && h('p', { class: 'sub' }, sub)),
      right));
}

export function vibrate(ms = 10) {
  try { navigator.vibrate?.(ms); } catch {}
}

/* ---------- toast ---------- */

let toastTimer;
export function toast(msg, opts = {}) {
  const el = document.getElementById('toast');
  el.replaceChildren(h('span', null, msg));
  if (opts.action) {
    el.append(h('button', { type: 'button', onclick: () => { el.classList.remove('show'); opts.onAction(); } }, opts.action));
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), opts.ms || (opts.action ? 4500 : 2200));
}

/* ---------- bottom sheet ---------- */

// Open sheets share ONE history entry, so the phone's Back gesture closes the top sheet
// instead of leaving the page. It is re-armed while more sheets stay open.
const sheets = [];
let ignorePops = 0;

window.addEventListener('popstate', () => {
  if (ignorePops > 0) { ignorePops--; return; }
  const top = sheets[sheets.length - 1];
  if (!top) return;
  top.close(true);
  if (sheets.length) history.pushState({ sheet: true }, '');
});

export function openSheet({ title, body, tall = false, onClose }) {
  const root = document.getElementById('sheet-root');
  const overlay = h('div', { class: 'overlay' });
  let closed = false;

  const close = (fromHistory = false) => {
    if (closed) return;
    closed = true;
    sheets.splice(sheets.indexOf(api), 1);
    if (!fromHistory && sheets.length === 0) { ignorePops++; history.back(); }
    overlay.classList.remove('in');
    panel.classList.remove('in');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { overlay.remove(); panel.remove(); }, 300);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape' && sheets[sheets.length - 1] === api) close(); };

  const panel = h('div', { class: 'sheet' + (tall ? ' tall' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-handle' }),
    h('div', { class: 'sheet-head' },
      h('h2', null, title),
      h('button', { class: 'icon-btn ghost', type: 'button', 'aria-label': 'Close', onclick: () => close() }, icon('x'))),
    h('div', { class: 'sheet-body' }, typeof body === 'function' ? body(() => close()) : body));

  overlay.addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);
  root.append(overlay, panel);
  if (sheets.length === 0) history.pushState({ sheet: true }, '');
  const api = { close };
  sheets.push(api);
  panel.getBoundingClientRect(); // commit the start position so the slide-up animates
  overlay.classList.add('in');
  panel.classList.add('in');
  panel.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
  return api;
}

export function confirmSheet({ title, message, ok = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    let answered = false;
    openSheet({
      title,
      onClose: () => { if (!answered) resolve(false); },
      body: (close) => h('div', null,
        h('p', { class: 'msg' }, message),
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn', type: 'button', onclick: () => close() }, 'Cancel'),
          h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), type: 'button', onclick: () => { answered = true; resolve(true); close(); } }, ok))),
    });
  });
}

/* ---------- sharing ---------- */

export async function shareText(text, title = 'Roz') {
  if (navigator.share) {
    try { await navigator.share({ title, text }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied — paste it anywhere');
  } catch {
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
}
