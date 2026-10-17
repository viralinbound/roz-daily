// Today: greeting, quick stats, tasks, water and today's habits.
import { store, uid } from '../store.js';
import { h, icon, dkey, addDays, dayLabel, money0, viewHeader, toast, vibrate } from '../ui.js';
import { install, promptInstall } from '../install.js';

let addWhen = 'today';

// Old proverbs and public-domain sayings, one per day.
const SAYINGS = [
  ['Kal kare so aaj kar, aaj kare so ab — do tomorrow’s work today, and today’s work now.', 'Kabir'],
  ['Boond boond se ghada bharta hai — drop by drop, the pot fills.', 'Hindi saying'],
  ['Well begun is half done.', 'Proverb'],
  ['Slow and steady wins the race.', 'Aesop'],
  ['A journey of a thousand miles begins with a single step.', 'Lao Tzu'],
  ['Jitni chadar ho, utne hi pair phailao — stretch your legs only as far as your sheet.', 'Hindi saying'],
  ['A rupee saved is a rupee earned.', 'Proverb'],
  ['Dheere dheere re mana, dheere sab kuchh hoye — slowly, O mind, everything happens in its time.', 'Kabir'],
  ['Health is wealth.', 'Proverb'],
  ['Early to bed and early to rise makes a man healthy, wealthy and wise.', 'Benjamin Franklin'],
  ['Rome wasn’t built in a day.', 'Proverb'],
  ['Practice makes perfect.', 'Proverb'],
  ['Little by little, a little becomes a lot.', 'Tanzanian proverb'],
  ['An ounce of prevention is worth a pound of cure.', 'Benjamin Franklin'],
  ['Jaisa ann, waisa mann — as the food, so the mind.', 'Hindi saying'],
  ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
  ['Where there’s a will, there’s a way.', 'Proverb'],
  ['Tomorrow is often the busiest day of the week.', 'Spanish proverb'],
  ['Drink your water, eat on time, sleep early. The old rules still work.', 'Grandma’s advice'],
  ['Rest is not idleness.', 'John Lubbock'],
  ['Cut your coat according to your cloth.', 'Proverb'],
];

function dayOfYear(d = new Date()) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

function taskDay(when) {
  if (when === 'today') return dkey();
  if (when === 'tomorrow') return dkey(addDays(new Date(), 1));
  return null;
}

function addTask(input) {
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  store.update((s) => { s.tasks.push({ id: uid(), text, day: taskDay(addWhen), done: false, doneDay: null }); });
  document.querySelector('[data-keep="task-input"]')?.focus();
}

function toggleTask(id) {
  vibrate();
  store.update((s) => {
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.doneDay = t.done ? dkey() : null;
    // Finishing an undated or overdue task counts it as today's.
    if (t.done && (!t.day || t.day < dkey())) t.day = dkey();
  });
}

function deleteTask(id) {
  const idx = store.state.tasks.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const removed = store.state.tasks[idx];
  store.update((s) => { s.tasks.splice(idx, 1); });
  toast('Task deleted', { action: 'Undo', onAction: () => store.update((s) => { s.tasks.splice(Math.min(idx, s.tasks.length), 0, removed); }) });
}

function taskItem(t, today) {
  const overdue = !t.done && t.day && t.day < today;
  return h('li', { class: 'titem' + (t.done ? ' done' : '') },
    h('button', {
      class: 'check', type: 'button', role: 'checkbox', 'aria-checked': String(t.done),
      'aria-label': (t.done ? 'Mark not done: ' : 'Mark done: ') + t.text, onclick: () => toggleTask(t.id),
    }, icon('check', 16)),
    h('span', { class: 'txt' }, t.text, overdue && h('span', { class: 'tag' }, 'from ' + dayLabel(t.day))),
    h('button', { class: 'icon-btn ghost', type: 'button', 'aria-label': 'Delete task: ' + t.text, onclick: () => deleteTask(t.id) }, icon('trash', 18)));
}

function tasksCard(s, today) {
  const tomorrow = dkey(addDays(new Date(), 1));
  const now = s.tasks.filter((t) => t.day && t.day <= today)
    .sort((a, b) => (a.done - b.done) || a.day.localeCompare(b.day));
  const tmr = s.tasks.filter((t) => t.day === tomorrow);
  const later = s.tasks.filter((t) => !t.day || t.day > tomorrow);
  const doneCount = now.filter((t) => t.done).length;

  const input = h('input', {
    class: 'input', type: 'text', placeholder: 'Add a task…', 'aria-label': 'New task', 'data-keep': 'task-input',
    enterkeyhint: 'done', autocomplete: 'off',
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); addTask(input); } },
  });

  const whenChips = h('div', { class: 'chips when', role: 'group', 'aria-label': 'When' });
  const drawWhen = () => whenChips.replaceChildren(...[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['someday', 'Someday']].map(([v, l]) =>
    h('button', { class: 'chip sm', type: 'button', 'aria-pressed': String(addWhen === v), onclick: () => { addWhen = v; drawWhen(); } }, l)));
  drawWhen();

  const group = (label, items) => items.length > 0 && [
    h('div', { class: 'tgroup' }, label),
    h('ul', { class: 'tlist' }, items.map((t) => taskItem(t, today))),
  ];

  const nothing = !now.length && !tmr.length && !later.length;

  return h('section', { class: 'card', 'aria-labelledby': 'tasks-h' },
    h('div', { class: 'card-head' },
      h('h2', { id: 'tasks-h' }, 'Tasks'),
      now.length > 0 && h('span', { class: 'meta' }, `${doneCount} of ${now.length} done`)),
    h('div', { class: 'add-row' },
      input,
      h('button', { class: 'btn primary', type: 'button', 'aria-label': 'Add task', onclick: () => addTask(input) }, icon('plus', 20))),
    whenChips,
    nothing
      ? h('div', { class: 'empty' }, h('strong', null, 'A clear list.'), 'Add what matters today — groceries, calls, bills.')
      : [
        now.length ? group('Today', now) : h('div', { class: 'empty small' }, 'Nothing left for today.'),
        group('Tomorrow', tmr),
        group('Someday', later),
      ],
    doneCount > 0 && h('div', { style: { textAlign: 'right', marginTop: '6px' } },
      h('button', { class: 'link', type: 'button', onclick: () => store.update((st) => { st.tasks = st.tasks.filter((t) => !t.done); }) }, 'Clear completed')));
}

function waterCard(s, today) {
  const goal = s.settings.waterGoal;
  const n = s.water[today] || 0;
  const setN = (v) => { vibrate(); store.update((st) => { st.water[today] = Math.max(0, Math.min(v, 30)); }); };
  const slots = Math.max(goal, n);

  return h('section', { class: 'card', 'aria-labelledby': 'water-h' },
    h('div', { class: 'card-head' },
      h('h2', { id: 'water-h' }, h('span', { style: { color: 'var(--water)', display: 'inline-flex' } }, icon('drop', 20)), 'Water'),
      h('span', { class: 'meta' }, n >= goal ? 'Goal reached — well done' : `${goal - n} to go`)),
    h('div', { class: 'glasses' },
      Array.from({ length: slots }, (_, i) => h('button', {
        class: 'glass' + (i < n ? ' full' : ''), type: 'button',
        'aria-label': `Set to ${i + 1 === n ? i : i + 1} glasses`,
        onclick: () => setN(i + 1 === n ? i : i + 1),
      }, icon(i < n ? 'dropFill' : 'drop', 28)))),
    h('div', { class: 'water-ctl' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove a glass', onclick: () => setN(n - 1), disabled: n === 0 }, icon('minus', 20)),
      h('div', { class: 'count' }, h('b', { class: 'num' }, n), ` / ${goal} glasses`),
      h('button', { class: 'btn primary sm', type: 'button', onclick: () => setN(n + 1) }, icon('plus', 18), 'Glass')));
}

function habitsCard(s, today) {
  if (!s.habits.length) {
    return h('a', { class: 'card', href: '#/habits', style: { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' } },
      h('span', { style: { color: 'var(--accent-ink)', display: 'inline-flex' } }, icon('flame', 24)),
      h('span', { style: { flex: '1' } }, h('b', null, 'Build a daily habit'), h('br'), h('span', { class: 'muted small' }, 'Walk, read, pray, save — keep a streak going.')),
      icon('right', 20));
  }
  const done = s.habits.filter((x) => x.log[today]).length;
  return h('section', { class: 'card', 'aria-labelledby': 'habits-h' },
    h('div', { class: 'card-head' },
      h('h2', { id: 'habits-h' }, 'Habits today'),
      h('a', { class: 'link', href: '#/habits' }, `${done}/${s.habits.length} · See all`)),
    h('div', { class: 'qhabits' },
      s.habits.map((hb) => h('button', {
        class: 'qh', type: 'button', role: 'checkbox', 'aria-checked': String(!!hb.log[today]),
        onclick: () => { vibrate(); store.update((st) => { const x = st.habits.find((y) => y.id === hb.id); if (x.log[today]) delete x.log[today]; else x.log[today] = 1; }); },
      }, h('span', null, hb.emoji), hb.name, hb.log[today] && icon('check', 16)))));
}

function installCard(s) {
  if (install.isStandalone || s.settings.installHintDismissed) return null;
  if (!install.canPrompt && !install.isIOS) return null;
  const dismiss = h('button', { class: 'x', type: 'button', 'aria-label': 'Hide install tip', onclick: () => store.update((st) => { st.settings.installHintDismissed = true; }) }, icon('x', 18));
  if (install.canPrompt) {
    return h('section', { class: 'card install' },
      h('img', { src: 'icons/icon-192.png', alt: '' }),
      h('div', { class: 'tx2' }, h('b', null, 'Install Roz'), 'Opens like an app, works offline.'),
      h('button', { class: 'btn', type: 'button', onclick: () => promptInstall() }, 'Install'),
      dismiss);
  }
  return h('section', { class: 'card install', style: { alignItems: 'flex-start' } },
    h('img', { src: 'icons/icon-192.png', alt: '' }),
    h('div', { class: 'tx2' },
      h('b', null, 'Add Roz to your Home Screen'),
      h('ol', { class: 'ios-steps' },
        h('li', null, 'Tap the Share button ', icon('share', 15), ' in Safari'),
        h('li', null, 'Choose “Add to Home Screen”'))),
    dismiss);
}

export default {
  render() {
    const s = store.state;
    const today = dkey();
    const hour = new Date().getHours();
    const greet = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const first = s.settings.name.trim().split(/\s+/)[0];
    const tasksLeft = s.tasks.filter((t) => !t.done && t.day && t.day <= today).length;
    const spent = s.txns.filter((t) => t.type === 'out' && t.date === today).reduce((a, t) => a + t.amt, 0);
    const water = s.water[today] || 0;
    const [quote, by] = SAYINGS[dayOfYear() % SAYINGS.length];

    return h('div', null,
      viewHeader({
        eyebrow: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
        title: first ? `${greet}, ${first}` : greet,
        right: h('a', { class: 'icon-btn', href: '#/settings', 'aria-label': 'Settings' }, icon('sliders', 20)),
      }),
      installCard(s),
      h('div', { class: 'stats' },
        h('button', { class: 'stat t-accent', type: 'button', onclick: () => document.querySelector('[data-keep="task-input"]')?.focus() },
          h('div', { class: 'k' }, 'Tasks left'), h('div', { class: 'v num' }, tasksLeft)),
        h('a', { class: 'stat t-good', href: '#/money', style: { textDecoration: 'none', color: 'inherit' } },
          h('div', { class: 'k' }, 'Spent today'), h('div', { class: 'v num' }, money0(spent))),
        h('button', { class: 'stat t-water', type: 'button', onclick: () => document.getElementById('water-h')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) },
          h('div', { class: 'k' }, 'Water'), h('div', { class: 'v num' }, water, h('small', null, ` /${s.settings.waterGoal}`)))),
      tasksCard(s, today),
      waterCard(s, today),
      habitsCard(s, today),
      h('blockquote', { class: 'quote' }, quote, h('span', null, '— ' + by)));
  },
};
