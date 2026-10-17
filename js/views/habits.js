// Habits: daily check-ins, streaks and a 7-day strip.
import { store, uid } from '../store.js';
import { h, icon, dkey, addDays, viewHeader, openSheet, confirmSheet, toast, vibrate } from '../ui.js';

const EMOJIS = ['🚶', '🏃', '🧘', '📖', '💧', '🥗', '🛏️', '🙏', '💪', '🦷', '🍎', '☀️', '🚭', '📵', '✍️', '🎯', '🧹', '💊', '🎵', '🌱', '🚴', '🙂', '🧠', '💰'];
const SUGGEST = [
  ['Morning walk', '🚶'], ['Read 10 pages', '📖'], ['Meditate 5 min', '🧘'], ['No sugar', '🍎'],
  ['Sleep by 11', '🛏️'], ['Gratitude / prayer', '🙏'], ['Exercise', '💪'], ['Save ₹100', '💰'],
];

function streak(hb) {
  let d = new Date();
  if (!hb.log[dkey(d)]) d = addDays(d, -1); // not done yet today — the streak is still alive
  let n = 0;
  while (hb.log[dkey(d)]) { n++; d = addDays(d, -1); }
  return n;
}

function bestStreak(hb) {
  const keys = Object.keys(hb.log).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    run = prev && dkey(addDays(new Date(prev + 'T00:00'), 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

function toggle(id, key) {
  vibrate();
  store.update((s) => {
    const x = s.habits.find((y) => y.id === id);
    if (x.log[key]) delete x.log[key];
    else x.log[key] = 1;
  });
}

function addHabit(name, emoji) {
  store.update((s) => { s.habits.push({ id: uid(), name, emoji, created: dkey(), log: {} }); });
}

function habitSheet(existing) {
  let emoji = existing?.emoji || '🎯';
  openSheet({
    title: existing ? 'Edit habit' : 'New habit',
    body: (close) => {
      const name = h('input', { class: 'input', type: 'text', placeholder: 'e.g. Morning walk', value: existing?.name || '', autocomplete: 'off', 'data-autofocus': true, maxlength: 40 });
      const grid = h('div', { class: 'emoji-grid' });
      const drawGrid = () => grid.replaceChildren(...EMOJIS.map((e) =>
        h('button', { type: 'button', 'aria-pressed': String(e === emoji), 'aria-label': 'Icon ' + e, onclick: () => { emoji = e; drawGrid(); } }, e)));
      drawGrid();

      const save = () => {
        const n = name.value.trim();
        if (!n) { toast('Give your habit a name'); name.focus(); return; }
        if (existing) store.update((s) => { Object.assign(s.habits.find((x) => x.id === existing.id), { name: n, emoji }); });
        else addHabit(n, emoji);
        close();
      };
      name.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });

      return h('div', null,
        h('label', { class: 'field' }, h('span', null, 'Habit'), name),
        !existing && h('div', { class: 'chips', style: { marginBottom: '16px' } },
          SUGGEST.map(([n, e]) => h('button', { class: 'chip sm', type: 'button', onclick: () => { name.value = n; emoji = e; drawGrid(); } }, e + ' ' + n))),
        h('div', { class: 'field' }, h('span', null, 'Icon'), grid),
        h('div', { class: 'row-actions' },
          existing && h('button', {
            class: 'btn danger', type: 'button', onclick: async () => {
              const ok = await confirmSheet({ title: `Delete “${existing.name}”?`, message: 'Its streak history will be removed too.' });
              if (!ok) return;
              close();
              store.update((s) => { s.habits = s.habits.filter((x) => x.id !== existing.id); });
            },
          }, icon('trash', 18), 'Delete'),
          h('button', { class: 'btn primary', type: 'button', onclick: save }, existing ? 'Save' : 'Add habit')));
    },
  });
}

function habitCard(hb, days, today) {
  const st = streak(hb);
  const best = bestStreak(hb);
  const doneToday = !!hb.log[today];
  return h('article', { class: 'habit' },
    h('div', { class: 'habit-top' },
      h('span', { class: 'em', 'aria-hidden': 'true' }, hb.emoji),
      h('button', { class: 'info', type: 'button', onclick: () => habitSheet(hb), 'aria-label': `Edit ${hb.name}` },
        h('b', null, hb.name),
        st > 0
          ? h('span', { class: 'hot' }, `🔥 ${st}-day streak` + (best > st ? ` · best ${best}` : ''))
          : h('span', null, best > 0 ? `Best streak ${best} · start again today` : 'Start today')),
      h('button', {
        class: 'big-check', type: 'button', role: 'checkbox', 'aria-checked': String(doneToday),
        'aria-label': `${hb.name} done today`, onclick: () => toggle(hb.id, today),
      }, icon('check', 24))),
    h('div', { class: 'week' },
      days.map((d) => {
        const k = dkey(d);
        const on = !!hb.log[k];
        return h('button', {
          class: 'day' + (on ? ' on' : '') + (k === today ? ' today' : ''), type: 'button',
          'aria-label': `${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}: ${on ? 'done' : 'not done'}`,
          onclick: () => toggle(hb.id, k),
        }, d.toLocaleDateString('en-IN', { weekday: 'narrow' }), h('i', null, icon('check', 14)));
      })));
}

export default {
  render() {
    const s = store.state;
    const today = dkey();
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
    const weekKeys = days.map((d) => dkey(d));
    const checks = s.habits.reduce((a, hb) => a + weekKeys.filter((k) => hb.log[k]).length, 0);

    return h('div', null,
      viewHeader({
        eyebrow: s.habits.length ? `Last 7 days · ${checks}/${s.habits.length * 7} check-ins` : 'Habits',
        title: 'Habits',
        sub: 'Small things, done daily, change everything.',
      }),
      s.habits.length === 0
        ? h('section', { class: 'card' },
          h('div', { class: 'empty', style: { paddingTop: '6px' } }, h('strong', null, 'Pick one to start'), 'Tap a habit to add it. One is enough — keep the streak alive.'),
          h('div', { class: 'habit-chips', style: { justifyContent: 'center', marginTop: '8px' } },
            SUGGEST.map(([n, e]) => h('button', { class: 'chip', type: 'button', onclick: () => { addHabit(n, e); toast(`Added “${n}”`); } }, e + ' ' + n))))
        : s.habits.map((hb) => habitCard(hb, days, today)),
      h('button', { class: 'fab', type: 'button', onclick: () => habitSheet() }, icon('plus', 22), 'New habit'));
  },
};
