// All app data lives in one JSON blob in this phone's localStorage. No server, no database.

const KEY = 'roz:data:v1';

const defaults = () => ({
  v: 1,
  settings: { name: '', theme: 'auto', waterGoal: 8, budget: 0, installHintDismissed: false },
  tasks: [],      // { id, text, day: 'YYYY-MM-DD' | null, done, doneDay }
  water: {},      // { 'YYYY-MM-DD': glasses }
  txns: [],       // { id, type: 'out' | 'in', amt, cat, note, date }
  udhaar: [],     // { id, name, amt, dir: 'get' | 'give', note, date, settled }
  habits: [],     // { id, name, emoji, created, log: { 'YYYY-MM-DD': 1 } }
  notes: [],      // { id, title, body, pinned, updated }
  counter: { n: 0, label: 'Count', target: 0 },
  timer: { focus: 25 },
});

function merge(data) {
  const base = defaults();
  const out = { ...base, ...data };
  for (const k of ['settings', 'counter', 'timer']) out[k] = { ...base[k], ...(data[k] || {}) };
  for (const k of ['tasks', 'txns', 'udhaar', 'habits', 'notes']) if (!Array.isArray(out[k])) out[k] = [];
  if (!out.water || typeof out.water !== 'object') out.water = {};
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? merge(JSON.parse(raw)) : defaults();
  } catch {
    return defaults();
  }
}

const listeners = new Set();

export const store = {
  state: load(),
  saveFailed: false,

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
      this.saveFailed = false;
    } catch {
      this.saveFailed = true;
    }
  },

  // Change state, save, and re-render. Pass { silent: true } when the view updates its own DOM (typing).
  update(fn, opts = {}) {
    fn(this.state);
    this.save();
    if (!opts.silent) listeners.forEach((l) => l());
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  replaceAll(data) {
    this.state = merge(data);
    this.save();
    listeners.forEach((l) => l());
  },

  eraseAll() {
    this.state = defaults();
    this.save();
    listeners.forEach((l) => l());
  },

  isValidBackup(data) {
    return !!data && typeof data === 'object' && data.v === 1 && typeof data.settings === 'object';
  },
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Ask the browser not to evict our storage when space runs low (best effort).
navigator.storage?.persist?.().catch(() => {});
