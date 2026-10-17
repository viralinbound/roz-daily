// Notes: quick notes with search, pin and share. Saves as you type.
import { store, uid } from '../store.js';
import { h, icon, ago, viewHeader, openSheet, confirmSheet, toast, shareText, rerender } from '../ui.js';

let query = '';

const sorted = (notes) => notes.slice().sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));

function splitNote(n) {
  if (n.title.trim()) return [n.title.trim(), n.body.trim()];
  const lines = n.body.trim().split('\n');
  return [lines[0] || 'Untitled', lines.slice(1).join('\n').trim()];
}

function noteCard(n) {
  const [title, preview] = splitNote(n);
  return h('button', { class: 'note' + (n.pinned ? ' pinned' : ''), type: 'button', onclick: () => editor(n.id) },
    h('b', null, title),
    preview && h('p', null, preview),
    h('span', { class: 'when2' }, n.pinned && icon('pin', 13), ago(n.updated)));
}

function listEl() {
  const q = query.trim().toLowerCase();
  const all = sorted(store.state.notes);
  const list = q ? all.filter((n) => (n.title + '\n' + n.body).toLowerCase().includes(q)) : all;
  if (!all.length) {
    return h('div', { class: 'card empty' }, h('strong', null, 'Your notebook is empty'), 'Shopping lists, ideas, a bank IFSC, the Wi-Fi name — jot it here. It never leaves your phone.');
  }
  if (!list.length) return h('div', { class: 'empty' }, `No notes match “${query.trim()}”.`);
  return h('div', { class: 'notes' }, list.map(noteCard));
}

function newNote() {
  const id = uid();
  store.update((s) => { s.notes.unshift({ id, title: '', body: '', pinned: false, updated: Date.now() }); }, { silent: true });
  editor(id, true);
}

function editor(id, isNew = false) {
  const find = () => store.state.notes.find((x) => x.id === id);
  const n = find();
  if (!n) return;
  const save = (patch) => store.update((s) => { Object.assign(s.notes.find((x) => x.id === id), patch, { updated: Date.now() }); }, { silent: true });

  openSheet({
    title: isNew ? 'New note' : 'Note',
    tall: true,
    onClose: () => {
      const x = find();
      if (x && !x.title.trim() && !x.body.trim()) store.update((s) => { s.notes = s.notes.filter((y) => y.id !== id); });
      else rerender();
    },
    body: (close) => {
      const title = h('input', { class: 'note-title', type: 'text', placeholder: 'Title', value: n.title, autocomplete: 'off', 'aria-label': 'Title', oninput: (e) => save({ title: e.target.value }) });
      const body = h('textarea', { class: 'note-body', placeholder: 'Start typing…', 'aria-label': 'Note', 'data-autofocus': isNew || null, oninput: (e) => save({ body: e.target.value }) });
      body.value = n.body;
      const pinBtn = h('button', { class: 'chip sm', type: 'button', 'aria-pressed': String(n.pinned) }, icon('pin', 15), 'Pin');
      pinBtn.addEventListener('click', () => {
        const v = !find().pinned;
        save({ pinned: v });
        pinBtn.setAttribute('aria-pressed', String(v));
      });

      return h('div', null,
        title,
        body,
        h('div', { class: 'note-bar' },
          h('div', { class: 'left' },
            pinBtn,
            h('button', {
              class: 'chip sm', type: 'button', onclick: () => {
                const x = find();
                const text = [x.title.trim(), x.body.trim()].filter(Boolean).join('\n\n');
                if (text) shareText(text, x.title || 'Note');
                else toast('Nothing to share yet');
              },
            }, icon('share', 15), 'Share')),
          h('button', {
            class: 'chip sm', type: 'button', style: { color: 'var(--bad)' }, onclick: async () => {
              const x = find();
              if (!x.title.trim() && !x.body.trim()) { close(); return; }
              const ok = await confirmSheet({ title: 'Delete this note?', message: splitNote(x)[0] });
              if (!ok) return;
              const idx = store.state.notes.findIndex((y) => y.id === id);
              const removed = store.state.notes[idx];
              close();
              store.update((s) => { s.notes.splice(idx, 1); });
              toast('Note deleted', { action: 'Undo', onAction: () => store.update((s) => { s.notes.splice(idx, 0, removed); }) });
            },
          }, icon('trash', 15), 'Delete')));
    },
  });
}

export default {
  render() {
    const listBox = h('div', null, listEl());
    const search = h('input', {
      class: 'input', type: 'search', placeholder: 'Search notes', 'aria-label': 'Search notes', value: query, 'data-keep': 'note-search', autocomplete: 'off',
      oninput: (e) => { query = e.target.value; listBox.replaceChildren(listEl()); },
    });
    return h('div', null,
      viewHeader({ eyebrow: 'Notes', title: 'Notes', sub: 'Lists, ideas, numbers — anything.' }),
      store.state.notes.length > 0 && h('div', { class: 'search' }, icon('search', 19), search),
      listBox,
      h('button', { class: 'fab', type: 'button', onclick: newNote }, icon('plus', 22), 'New note'));
  },
  afterRoute(route) {
    if (route.sub === 'new') {
      history.replaceState(history.state, '', '#/notes');
      rerender();
      newNote();
    }
  },
};
