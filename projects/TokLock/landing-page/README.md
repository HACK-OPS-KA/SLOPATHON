# TokLock — Landing page

A single-file, self-contained marketing landing page for TokLock. It's played completely straight:
the app is presented as a wholesome wellness coach whose celebrated goal is to help you
*quadruple your screen time*. That deadpan framing is the joke.

## Stack

- One static **`index.html`** — inline CSS + vanilla JS. No build step, no dependencies, no network calls.
- **Light / dark theme** toggle (respects `prefers-color-scheme`, remembers your choice in `localStorage`).
- Fully responsive: two-column hero, live-ish countdown on the phone mock, fake 5-star reviews, escalation-as-"encouragement" section.

## Run it

Just open the file — there is nothing to install or build:

```bash
xdg-open index.html        # Linux
# open index.html          # macOS
# start index.html         # Windows
```

…or double-click `index.html` in a file manager. Any modern browser works.

Optional: serve it locally (only needed if a browser is fussy about `file://`):

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy

It's fully static — drop `index.html` on any static host:

- **GitHub Pages** — put the file in a Pages-enabled branch/folder.
- **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the file, no build command.
- **Any web server** — copy `index.html` into the web root.

## Notes

- The "Get it on Google Play" button is a placeholder — it opens a playful modal, not a store listing.
- Press logos and user reviews are **fictional** and part of the satire.
- The page is intentionally **not affiliated** with Google Play, Instagram, or TikTok.
