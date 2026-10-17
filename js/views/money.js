// Money: daily spends with a monthly budget, plus an udhaar (lend & borrow) khata.
import { store, uid } from '../store.js';
import { h, icon, money, money0, dkey, parseKey, dayLabel, toNum, seg, viewHeader, openSheet, confirmSheet, toast, shareText, rerender, vibrate } from '../ui.js';

const CATS = [
  { id: 'food', name: 'Food', e: '🍛', c: '#E07A1F' },
  { id: 'grocery', name: 'Grocery', e: '🥦', c: '#4E9A5B' },
  { id: 'travel', name: 'Travel', e: '🛺', c: '#3B7DD8' },
  { id: 'bills', name: 'Bills', e: '💡', c: '#C9A227' },
  { id: 'shopping', name: 'Shopping', e: '🛍️', c: '#C2457A' },
  { id: 'health', name: 'Health', e: '💊', c: '#2A9D8F' },
  { id: 'fun', name: 'Fun', e: '🎬', c: '#7B5EA7' },
  { id: 'home', name: 'Home', e: '🏠', c: '#8C6A4F' },
  { id: 'other', name: 'Other', e: '📦', c: '#7A7A7A' },
];
const INCOME = [
  { id: 'salary', name: 'Salary', e: '💼' },
  { id: 'business', name: 'Business', e: '🏪' },
  { id: 'gift', name: 'Gift', e: '🎁' },
  { id: 'refund', name: 'Refund', e: '↩️' },
  { id: 'other-in', name: 'Other', e: '💰' },
];
const catOf = (id) => [...CATS, ...INCOME].find((c) => c.id === id) || CATS[CATS.length - 1];

let tab = 'spend';
let ym = dkey().slice(0, 7);

const ymLabel = (v) => {
  const [y, m] = v.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
const shiftYm = (v, d) => {
  const [y, m] = v.split('-').map(Number);
  const x = new Date(y, m - 1 + d, 1);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
};
const sum = (arr) => arr.reduce((a, t) => a + t.amt, 0);

function amountField(value, autofocus) {
  const input = h('input', {
    class: 'input big-amount has-pre', type: 'text', inputmode: 'decimal', placeholder: '0', autocomplete: 'off',
    'aria-label': 'Amount', value: value ? String(value) : '', 'data-autofocus': autofocus || null,
  });
  return { input, el: h('div', { class: 'affix field' }, input, h('span', { class: 'pre' }, '₹')) };
}

/* ---------- spends ---------- */

function txnSheet(existing) {
  let type = existing?.type || 'out';
  let cat = existing?.cat || 'food';

  openSheet({
    title: existing ? 'Edit entry' : 'Add entry',
    body: (close) => {
      const amt = amountField(existing?.amt, !existing);
      const segBox = h('div');
      const catBox = h('div', { class: 'field' });
      const drawCats = () => {
        const list = type === 'out' ? CATS : INCOME;
        if (!list.some((c) => c.id === cat)) cat = list[0].id;
        catBox.replaceChildren(h('span', null, 'Category'), h('div', { class: 'cat-grid' }, list.map((c) =>
          h('button', { class: 'cat-pick', type: 'button', 'aria-pressed': String(c.id === cat), onclick: () => { cat = c.id; drawCats(); } },
            h('span', { class: 'e' }, c.e), c.name))));
      };
      const drawSeg = () => segBox.replaceChildren(seg([['out', 'Expense'], ['in', 'Income']], type, (v) => { type = v; drawSeg(); drawCats(); }, 'Entry type'));
      drawSeg();
      drawCats();

      const note = h('input', { class: 'input', type: 'text', placeholder: 'e.g. Chai with team', value: existing?.note || '', autocomplete: 'off' });
      const date = h('input', { class: 'input', type: 'date', value: existing?.date || dkey() });

      const save = () => {
        const a = toNum(amt.input.value);
        if (a <= 0) { toast('Enter an amount'); amt.input.focus(); return; }
        const entry = { type, amt: a, cat, note: note.value.trim(), date: date.value || dkey() };
        store.update((s) => {
          if (existing) Object.assign(s.txns.find((t) => t.id === existing.id), entry);
          else s.txns.push({ id: uid(), ...entry });
        });
        ym = entry.date.slice(0, 7);
        vibrate();
        close();
        toast(existing ? 'Saved' : `${type === 'out' ? 'Spend' : 'Income'} of ${money(a)} added`);
      };
      amt.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });

      return h('div', null,
        segBox,
        amt.el,
        catBox,
        h('label', { class: 'field' }, h('span', null, 'Note (optional)'), note),
        h('label', { class: 'field' }, h('span', null, 'Date'), date),
        h('div', { class: 'row-actions' },
          existing && h('button', {
            class: 'btn danger', type: 'button', onclick: () => {
              close();
              const idx = store.state.txns.findIndex((t) => t.id === existing.id);
              store.update((s) => { s.txns.splice(idx, 1); });
              toast('Entry deleted', { action: 'Undo', onAction: () => store.update((s) => { s.txns.splice(idx, 0, existing); }) });
            },
          }, icon('trash', 18), 'Delete'),
          h('button', { class: 'btn primary', type: 'button', onclick: save }, existing ? 'Save' : 'Add')));
    },
  });
}

function budgetSheet() {
  openSheet({
    title: 'Monthly budget',
    body: (close) => {
      const amt = amountField(store.state.settings.budget || '', true);
      const save = () => {
        const v = toNum(amt.input.value);
        store.update((s) => { s.settings.budget = Math.max(0, v); });
        close();
        toast(v > 0 ? `Budget set to ${money0(v)} a month` : 'Budget removed');
      };
      amt.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
      return h('div', null,
        h('p', { class: 'msg', style: { marginBottom: '14px' } }, 'How much do you want to spend in a month? Roz shows what is left and a safe amount per day.'),
        amt.el,
        h('div', { class: 'row-actions' },
          store.state.settings.budget > 0 && h('button', { class: 'btn', type: 'button', onclick: () => { amt.input.value = ''; save(); } }, 'Remove'),
          h('button', { class: 'btn primary', type: 'button', onclick: save }, 'Save')));
    },
  });
}

function spendView(s) {
  const nowYm = dkey().slice(0, 7);
  const list = s.txns.filter((t) => t.date.startsWith(ym));
  const outs = list.filter((t) => t.type === 'out');
  const out = sum(outs);
  const inc = sum(list.filter((t) => t.type === 'in'));
  const budget = s.settings.budget;

  let budgetEl;
  if (budget > 0) {
    const left = budget - out;
    const pct = Math.min(100, (out / budget) * 100);
    let perDay = null;
    if (ym === nowYm && left > 0) {
      const d = new Date();
      const daysLeft = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1;
      perDay = left / daysLeft;
    }
    budgetEl = h('div', { class: 'budget' },
      h('div', { class: 'lbl' },
        h('span', null, left >= 0 ? `${money0(left)} left` : `${money0(-left)} over budget`),
        h('button', { class: 'link', type: 'button', onclick: budgetSheet, style: { padding: 0 } }, `of ${money0(budget)}`)),
      h('div', { class: 'bar' + (left < 0 ? ' bad' : pct < 75 ? ' good' : '') }, h('i', { style: { width: pct + '%' } })),
      perDay && h('p', { class: 'small muted', style: { marginTop: '8px' } }, `About ${money0(perDay)} a day keeps you on budget this month.`));
  } else {
    budgetEl = h('button', { class: 'link', type: 'button', onclick: budgetSheet, style: { marginTop: '10px' } }, '+ Set a monthly budget');
  }

  // Category breakdown
  const byCat = {};
  for (const t of outs) byCat[t.cat] = (byCat[t.cat] || 0) + t.amt;
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  // Day groups
  const days = {};
  for (const t of list) (days[t.date] ||= []).push(t);
  const dayKeys = Object.keys(days).sort().reverse();

  return h('div', null,
    h('section', { class: 'card' },
      h('div', { class: 'month' },
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous month', onclick: () => { ym = shiftYm(ym, -1); rerender(); } }, icon('left', 20)),
        h('b', null, ymLabel(ym)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next month', disabled: ym >= nowYm, style: { opacity: ym >= nowYm ? 0.35 : 1 }, onclick: () => { ym = shiftYm(ym, 1); rerender(); } }, icon('right', 20))),
      h('div', { class: 'muted small', style: { fontWeight: 650 } }, 'Spent'),
      h('div', { class: 'spent-big num' }, money0(out)),
      h('div', { class: 'kv' },
        h('span', null, 'Income ', h('b', { class: 'num' }, money0(inc))),
        h('span', null, 'Balance ', h('b', { class: 'num' }, money0(inc - out)))),
      budgetEl),

    cats.length > 0 && h('section', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, 'Where it went')),
      cats.map(([id, amt]) => {
        const c = catOf(id);
        return h('div', { class: 'cat-row' },
          h('span', { class: 'e' }, c.e),
          h('div', null,
            h('div', { class: 'name' }, c.name, h('span', { class: 'muted small' }, `  ${Math.round((amt / out) * 100)}%`)),
            h('div', { class: 'bar' }, h('i', { style: { width: (amt / cats[0][1]) * 100 + '%', background: c.c } }))),
          h('span', { class: 'amt num' }, money0(amt)));
      })),

    dayKeys.length === 0
      ? h('div', { class: 'card empty' },
        h('strong', null, `Nothing noted in ${ymLabel(ym).split(' ')[0]} yet`),
        'Tap “Add” after every spend — chai, auto, recharge. It takes three seconds and adds up to real clarity.')
      : dayKeys.map((k) => {
        const spentDay = sum(days[k].filter((t) => t.type === 'out'));
        return [
          h('div', { class: 'day-head' }, h('span', null, dayLabel(k)), spentDay > 0 && h('span', { class: 'num' }, money0(spentDay))),
          days[k].slice().reverse().map((t) => {
            const c = catOf(t.cat);
            return h('button', { class: 'tx', type: 'button', onclick: () => txnSheet(t), 'aria-label': `${c.name} ${money(t.amt)}, edit` },
              h('span', { class: 'e' }, c.e),
              h('span', { class: 'mid' }, h('b', null, t.note || c.name), h('span', null, t.note ? c.name : (t.type === 'in' ? 'Income' : 'Expense'))),
              h('span', { class: 'amt' + (t.type === 'in' ? ' in' : '') }, (t.type === 'in' ? '+' : '−') + money(t.amt).replace('−', '')));
          }),
        ];
      }));
}

/* ---------- udhaar ---------- */

function udhaarSheet(existing) {
  let dir = existing?.dir || 'get';
  openSheet({
    title: existing ? 'Edit entry' : 'Lend or borrow',
    body: (close) => {
      const segBox = h('div');
      const drawSeg = () => segBox.replaceChildren(seg([['get', 'I gave money'], ['give', 'I took money']], dir, (v) => { dir = v; drawSeg(); }, 'Direction'));
      drawSeg();
      const name = h('input', { class: 'input', type: 'text', placeholder: 'e.g. Ravi', value: existing?.name || '', autocomplete: 'off', 'data-autofocus': existing ? null : true });
      const amt = amountField(existing?.amt);
      const note = h('input', { class: 'input', type: 'text', placeholder: 'e.g. Movie tickets', value: existing?.note || '', autocomplete: 'off' });
      const date = h('input', { class: 'input', type: 'date', value: existing?.date || dkey() });

      const save = () => {
        const a = toNum(amt.input.value);
        if (!name.value.trim()) { toast('Add a name'); name.focus(); return; }
        if (a <= 0) { toast('Enter an amount'); amt.input.focus(); return; }
        const entry = { name: name.value.trim(), amt: a, dir, note: note.value.trim(), date: date.value || dkey() };
        store.update((s) => {
          if (existing) Object.assign(s.udhaar.find((u) => u.id === existing.id), entry);
          else s.udhaar.push({ id: uid(), settled: false, ...entry });
        });
        close();
        toast('Saved');
      };

      return h('div', null,
        segBox,
        h('label', { class: 'field' }, h('span', null, 'Person'), name),
        amt.el,
        h('label', { class: 'field' }, h('span', null, 'What for (optional)'), note),
        h('label', { class: 'field' }, h('span', null, 'Date'), date),
        h('div', { class: 'row-actions' },
          existing && h('button', {
            class: 'btn danger', type: 'button', onclick: async () => {
              const ok = await confirmSheet({ title: 'Delete this entry?', message: `${existing.name} · ${money(existing.amt)}` });
              if (!ok) return;
              close();
              store.update((s) => { s.udhaar = s.udhaar.filter((u) => u.id !== existing.id); });
            },
          }, icon('trash', 18), 'Delete'),
          h('button', { class: 'btn primary', type: 'button', onclick: save }, existing ? 'Save' : 'Add')));
    },
  });
}

function setSettled(id, val) {
  vibrate();
  store.update((s) => { s.udhaar.find((u) => u.id === id).settled = val; });
  if (val) toast('Marked settled', { action: 'Undo', onAction: () => setSettled(id, false) });
}

function udCard(u) {
  const when = parseKey(u.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return h('div', { class: 'ud' + (u.settled ? ' settled' : '') },
    h('div', { class: 'ud-top' },
      h('b', null, u.name),
      h('span', { class: 'amt num ' + u.dir }, money(u.amt))),
    h('div', { class: 'meta' }, (u.dir === 'get' ? 'You gave' : 'You took') + ' · ' + when + (u.note ? ' · ' + u.note : '')),
    h('div', { class: 'acts' },
      !u.settled && u.dir === 'get' && h('button', {
        class: 'btn sm', type: 'button',
        onclick: () => shareText(`Hi ${u.name}, a gentle reminder about ${money(u.amt)}${u.note ? ' for ' + u.note : ''} from ${when}. Thanks!`, 'Reminder'),
      }, icon('chat', 16), 'Remind'),
      u.settled
        ? h('button', { class: 'btn sm', type: 'button', onclick: () => setSettled(u.id, false) }, 'Reopen')
        : h('button', { class: 'btn sm', type: 'button', onclick: () => setSettled(u.id, true) }, icon('check', 16), u.dir === 'get' ? 'Got it back' : 'Paid back'),
      h('button', { class: 'icon-btn ghost', type: 'button', 'aria-label': 'Edit ' + u.name, onclick: () => udhaarSheet(u), style: { marginLeft: 'auto' } }, icon('edit', 18))));
}

function udhaarView(s) {
  const open = s.udhaar.filter((u) => !u.settled).sort((a, b) => b.date.localeCompare(a.date));
  const settled = s.udhaar.filter((u) => u.settled).sort((a, b) => b.date.localeCompare(a.date));
  const get = sum(open.filter((u) => u.dir === 'get'));
  const give = sum(open.filter((u) => u.dir === 'give'));
  return h('div', null,
    h('div', { class: 'owe' },
      h('div', { class: 'stat get' }, h('div', { class: 'k' }, 'You’ll get back'), h('div', { class: 'v num' }, money0(get))),
      h('div', { class: 'stat give' }, h('div', { class: 'k' }, 'You owe'), h('div', { class: 'v num' }, money0(give)))),
    open.length === 0 && settled.length === 0
      ? h('div', { class: 'card empty' }, h('strong', null, 'Nobody owes anybody'), 'Lent ₹500 to a friend? Borrowed from family? Note it here so nobody forgets — and send a polite reminder in one tap.')
      : open.length === 0 ? h('div', { class: 'card empty' }, h('strong', null, 'All settled up'), 'Nice. Nothing pending right now.')
        : open.map(udCard),
    settled.length > 0 && [h('div', { class: 'section-label' }, `Settled (${settled.length})`), settled.slice(0, 20).map(udCard)]);
}

export default {
  render() {
    const s = store.state;
    return h('div', null,
      viewHeader({ eyebrow: 'Money', title: tab === 'spend' ? 'Spends' : 'Lend & Borrow', sub: tab === 'spend' ? 'Know where every rupee goes.' : 'Your udhaar khata — who owes whom.' }),
      seg([['spend', 'Spends'], ['udhaar', 'Lend / Borrow']], tab, (v) => { tab = v; rerender(); }, 'Money section'),
      tab === 'spend' ? spendView(s) : udhaarView(s),
      h('button', { class: 'fab', type: 'button', onclick: () => (tab === 'spend' ? txnSheet() : udhaarSheet()) }, icon('plus', 22), 'Add'));
  },
  afterRoute(route) {
    if (route.sub === 'add') {
      history.replaceState(history.state, '', '#/money');
      tab = 'spend';
      rerender();
      txnSheet();
    }
  },
};
