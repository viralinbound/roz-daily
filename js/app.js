// Roz app shell: hash router, tab bar, theme, service worker.
import { store } from './store.js';
import { h, icon, dkey, toast } from './ui.js';
import { install } from './install.js';
import today from './views/today.js';
import money from './views/money.js';
import habits from './views/habits.js';
import notes from './views/notes.js';
import tools from './views/tools.js';
import settings from './views/settings.js';

const routes = { today, money, habits, notes, tools, settings };
const TABS = [
  ['today', 'Today', 'sun'],
  ['money', 'Money', 'wallet'],
  ['habits', 'Habits', 'flame'],
  ['notes', 'Notes', 'note'],
  ['tools', 'Tools', 'grid'],
];

const viewEl = document.getElementById('view');
const tabbar = document.getElementById('tabbar');

function parseRoute() {
  const [name, sub] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: routes[name] ? name : 'today', sub: sub || null };
}

function renderTabs(active) {
  const tabFor = active === 'settings' ? 'today' : active;
  tabbar.replaceChildren(...TABS.map(([id, label, ic]) =>
    h('a', { href: `#/${id}`, 'aria-current': id === tabFor ? 'page' : null },
      h('span', { class: 'pill' }, icon(ic, 22)),
      label)));
}

let lastRouteKey = '';

function render() {
  const route = parseRoute();
  const routeKey = route.name + '/' + (route.sub || '');
  const routeChanged = routeKey !== lastRouteKey;
  lastRouteKey = routeKey;

  // Keep focus on the same input across re-renders (e.g. after adding a task).
  const keep = document.activeElement?.dataset?.keep;
  viewEl.replaceChildren(routes[route.name].render(route));
  renderTabs(route.name);
  if (keep) viewEl.querySelector(`[data-keep="${keep}"]`)?.focus();
  if (routeChanged) {
    window.scrollTo(0, 0);
    routes[route.name].afterRoute?.(route);
  }
}

function applyTheme() {
  const t = store.state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    if (t === 'auto') m.setAttribute('content', m.media.includes('dark') ? '#14120F' : '#F7F3EC');
    else m.setAttribute('content', bg);
  });
}

// Done tasks from earlier days are cleared so each morning starts fresh.
function tidyOldData() {
  const today = dkey();
  const before = store.state.tasks.length;
  const tasks = store.state.tasks.filter((t) => !(t.done && t.doneDay && t.doneDay < today));
  if (tasks.length !== before) store.update((s) => { s.tasks = tasks; }, { silent: true });
}

let lastDay = dkey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dkey() !== lastDay) {
    lastDay = dkey();
    tidyOldData();
    render();
  }
});

window.addEventListener('hashchange', render);
window.addEventListener('roz:render', render);
store.subscribe(() => { applyTheme(); render(); });
install.subscribe(render);

tidyOldData();
applyTheme();
// Mark the first page so in-app "Back" knows there is nothing earlier to go back to.
history.replaceState({ root: true }, '', location.hash || '#/today');
render();

if (store.saveFailed) toast('Storage is full or blocked — changes may not be saved');

// On localhost the offline cache would hide edits, so it only runs there with ?sw in the URL.
const isDev = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !location.search.includes('sw');
if (isDev) navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
else if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('Roz was updated', { action: 'Reload', onAction: () => location.reload() });
  });
}
