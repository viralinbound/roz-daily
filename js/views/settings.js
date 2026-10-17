// Settings: name, theme, goals, backup/restore to a file, install help, erase.
import { store } from '../store.js';
import { h, icon, dkey, toNum, seg, viewHeader, confirmSheet, toast } from '../ui.js';
import { install, promptInstall } from '../install.js';

async function exportBackup() {
  const name = `roz-backup-${dkey()}.json`;
  const file = new File([JSON.stringify(store.state)], name, { type: 'application/json' });
  // On phones, the share sheet lets people save straight to Drive, iCloud Files or WhatsApp.
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Roz backup' }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Backup saved as ' + name);
}

async function importBackup(file) {
  if (!file) return;
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('That file is not a Roz backup'); return; }
  if (!store.isValidBackup(data)) { toast('That file is not a Roz backup'); return; }
  const count = (k) => (Array.isArray(data[k]) ? data[k].length : 0);
  const ok = await confirmSheet({
    title: 'Restore this backup?',
    message: `It has ${count('tasks')} tasks, ${count('txns')} money entries, ${count('habits')} habits and ${count('notes')} notes. Everything currently in Roz on this phone will be replaced.`,
    ok: 'Restore',
    danger: false,
  });
  if (!ok) return;
  store.replaceAll(data);
  toast('Backup restored');
}

function installSection() {
  if (install.isStandalone) {
    return h('div', { class: 'card' }, h('b', null, 'Installed ✓'), h('p', { class: 'small muted' }, 'Roz is on your home screen and works without internet.'));
  }
  return h('div', { class: 'card' },
    install.canPrompt && h('button', { class: 'btn primary block', type: 'button', style: { marginBottom: '14px' }, onclick: () => promptInstall() }, icon('download', 18), 'Install Roz on this device'),
    h('b', null, 'Android (Chrome)'),
    h('ol', { class: 'ios-steps', style: { marginBottom: '12px' } },
      h('li', null, 'Tap the ⋮ menu at the top right'),
      h('li', null, 'Choose “Install app” or “Add to Home screen”')),
    h('b', null, 'iPhone / iPad (Safari)'),
    h('ol', { class: 'ios-steps' },
      h('li', null, 'Tap the Share button ', icon('share', 15)),
      h('li', null, 'Choose “Add to Home Screen”, then “Add”')),
    h('p', { class: 'small muted', style: { marginTop: '10px' } }, 'No Play Store or App Store needed. After installing, Roz opens full-screen and works offline.'));
}

export default {
  render() {
    const st = store.state.settings;
    const total = store.state.tasks.length + store.state.txns.length + store.state.udhaar.length + store.state.habits.length + store.state.notes.length;
    const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'sr-only', onchange: (e) => { importBackup(e.target.files[0]); e.target.value = ''; } });

    return h('div', null,
      viewHeader({ back: '#/today', eyebrow: 'Settings', title: 'You & your data' }),

      h('div', { class: 'card privacy' },
        icon('shield', 26),
        h('div', null,
          h('b', null, 'Everything stays on this phone'),
          h('p', null, 'No account, no server, no database. Roz works offline and nobody else can see your data. Take a backup before you change phones.'))),

      h('div', { class: 'section-label' }, 'Profile'),
      h('div', { class: 'card' },
        h('label', { class: 'field', style: { marginBottom: 0 } }, h('span', null, 'Your name (for the greeting)'),
          h('input', {
            class: 'input', type: 'text', value: st.name, placeholder: 'e.g. Priya', autocomplete: 'given-name', 'data-keep': 'name',
            oninput: (e) => store.update((s) => { s.settings.name = e.target.value; }, { silent: true }),
          }))),

      h('div', { class: 'section-label' }, 'Preferences'),
      h('div', { class: 'set-list' },
        h('div', { class: 'set-row' },
          h('div', { class: 'l' }, h('b', null, 'Theme')),
          seg([['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], st.theme, (v) => store.update((s) => { s.settings.theme = v; }), 'Theme')),
        h('div', { class: 'set-row' },
          h('div', { class: 'l' }, h('b', null, 'Water goal'), h('span', null, 'Glasses per day')),
          (() => {
            let v = st.waterGoal;
            const out = h('output', { class: 'num' }, String(v));
            const set = (n) => { v = Math.max(4, Math.min(16, n)); out.textContent = String(v); store.update((s) => { s.settings.waterGoal = v; }, { silent: true }); };
            return h('div', { class: 'stepper' }, h('button', { type: 'button', 'aria-label': 'Fewer glasses', onclick: () => set(v - 1) }, '−'), out, h('button', { type: 'button', 'aria-label': 'More glasses', onclick: () => set(v + 1) }, '+'));
          })()),
        h('div', { class: 'set-row' },
          h('div', { class: 'l' }, h('b', null, 'Monthly budget'), h('span', null, 'Leave empty for none')),
          h('div', { class: 'affix', style: { width: '140px' } },
            h('input', {
              class: 'input has-pre', type: 'text', inputmode: 'numeric', placeholder: 'None', value: st.budget ? String(st.budget) : '', 'aria-label': 'Monthly budget',
              onchange: (e) => { store.update((s) => { s.settings.budget = Math.max(0, toNum(e.target.value)); }, { silent: true }); toast('Budget saved'); },
            }),
            h('span', { class: 'pre' }, '₹')))),

      h('div', { class: 'section-label' }, 'Backup'),
      h('div', { class: 'set-list' },
        h('button', { class: 'set-row', type: 'button', onclick: exportBackup },
          icon('download', 22),
          h('div', { class: 'l' }, h('b', null, 'Save a backup file'), h('span', null, 'Keep it in Google Drive, iCloud or WhatsApp to yourself'))),
        h('label', { class: 'set-row', style: { cursor: 'pointer' } },
          icon('upload', 22),
          h('div', { class: 'l' }, h('b', null, 'Restore from a backup'), h('span', null, 'Pick a roz-backup .json file')),
          fileInput)),

      h('div', { class: 'section-label' }, 'Install on your phone'),
      installSection(),

      h('div', { class: 'section-label' }, 'Danger zone'),
      h('button', {
        class: 'btn danger block', type: 'button', onclick: async () => {
          const ok = await confirmSheet({ title: 'Erase everything?', message: `This deletes all ${total} items (tasks, money, habits, notes) and settings from this phone. Save a backup first if you might need them.`, ok: 'Erase all' });
          if (ok) { store.eraseAll(); toast('All data erased'); }
        },
      }, icon('trash', 18), 'Erase all data'),

      h('p', { class: 'small muted', style: { textAlign: 'center', marginTop: '22px' } }, 'Roz 1.0 · works offline · made for everyday India'));
  },
};
