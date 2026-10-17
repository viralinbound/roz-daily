# Roz — Daily Kit

One app for everyday life, for Android **and** iPhone, with **no app store, no server and no database**.
It is an installable web app (PWA): open the link once in the phone's browser, add it to the home screen,
and from then on it opens full-screen like a normal app and works **offline**. All data is saved on the
phone itself (localStorage); nothing is uploaded anywhere.

## What's inside

| Tab | Features |
| --- | --- |
| **Today** | Greeting, quick stats, tasks (today / tomorrow / someday, overdue carry-over, undo), water tracker, today's habits, daily proverb |
| **Money** | Spends & income by category, month view, monthly budget with "safe per-day" amount, category breakdown · **Lend / Borrow** (udhaar khata) with one-tap WhatsApp/Share reminder |
| **Habits** | Daily check-in, streaks, best streak, 7-day strip (tap any day) |
| **Notes** | Quick notes, search, pin, share, autosave |
| **Tools** | Bill split, Loan EMI, GST add/remove (CGST/SGST), Discount & %, SIP growth, Age & days between dates, Unit converter (incl. gaj, tola, cent), Focus timer, Tap counter (11/21/108 mala) |
| **Settings** | Name, theme (auto/light/dark), water goal, budget, **backup to a file / restore**, install help, erase all |

Home-screen shortcuts (Android long-press): Add expense, New note, Focus timer.

## Run locally

```bash
python serve.py 3048
```

Then open http://localhost:3048. On localhost the offline cache is switched off so edits show
immediately; add `?sw` to the URL to test offline mode.

## Put it on phones

It needs to be hosted once on any HTTPS static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages).
There is no build step — upload this folder as-is.

- **Android (Chrome):** open the link → tap **Install** in the app (or ⋮ menu → *Install app*).
- **iPhone / iPad (Safari):** open the link → Share → **Add to Home Screen**.

## Releasing an update

Change the files, then bump `VERSION` in `sw.js` (e.g. `roz-v2`). Phones pick up the new version the next
time the app is opened online and show "Roz was updated — Reload".

## Data & privacy

- Data lives only in that phone's browser storage. Uninstalling the app or clearing site data erases it —
  use **Settings → Save a backup file** before changing phones.
- On iPhone, the home-screen app and the Safari tab keep separate data.
