// "Add to Home Screen" support. Android/Chrome gives us a real install prompt;
// iPhone/iPad Safari needs the user to use Share → Add to Home Screen, so we show the steps.

const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

export const install = {
  deferred: null,
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  get isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  },
  get canPrompt() {
    return !!this.deferred;
  },
  subscribe(fn) {
    listeners.add(fn);
  },
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  install.deferred = e;
  notify();
});

window.addEventListener('appinstalled', () => {
  install.deferred = null;
  notify();
});

export async function promptInstall() {
  const e = install.deferred;
  if (!e) return false;
  e.prompt();
  const choice = await e.userChoice.catch(() => null);
  install.deferred = null;
  notify();
  return choice?.outcome === 'accepted';
}
