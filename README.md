# Thresholds — Jean Viratel Portfolio

A Creative Technology portfolio in three chambers.
Photography · Writing · Code

---

## Project structure

```
seuils/
├── public/
│   └── photos/
│       ├── espace/          ← Chamber I photos
│       ├── temps/           ← Chamber II photos
│       ├── autre/           ← Chamber III photos
│       └── auteur/          ← Author photo + book cover
├── src/
│   ├── data/
│   │   └── chambers.js      ← All photos + text fragments
│   ├── components/
│   │   ├── Cursor.jsx / .css
│   │   ├── Dissolve.jsx / .css
│   │   ├── Home.jsx / .css
│   │   └── Chamber.jsx / .css
│   ├── App.jsx / .css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 1 — Install

```bash
npm install
```

---

## 2 — Add your photos

Place photos in `/public/photos/` following the folder structure above.
The filenames must match what is declared in `src/data/chambers.js`.

Each photo entry looks like this:
```js
{
  src:      "/photos/espace/couple-escaliers.jpg",
  alt:      "Couple on stairs, aerial view",
  fragment: "His solitary silhouette dissolved into the ever-shifting urban architecture.",
}
```

Rename your files and update the `src` paths accordingly.

---

## 3 — Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 4 — Deploy on Vercel

### Option A — via Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your site will be live at `https://seuils.vercel.app` (or your custom domain).

### Option B — via GitHub
1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click Deploy

Every `git push` will trigger a new deployment automatically.

---

## 5 — Custom domain (optional)

In Vercel dashboard → Project → Settings → Domains
Add your domain (e.g. `jeanviratel.com`) and follow the DNS instructions.

---

## Customisation

| What | Where |
|------|-------|
| Site title, tagline, languages | `src/data/chambers.js` → `SITE` object |
| Photos & text fragments | `src/data/chambers.js` → `chambers` array |
| Background photos on home | `src/components/Home.jsx` → `BG_PHOTOS` array |
| Photo layout positions | `src/components/Chamber.jsx` → `LAYOUT` array |
| Colors & fonts | `src/App.css` → `:root` variables |
| Edge navigation delay | `src/components/Chamber.jsx` → `EDGE_DELAY` constant |

---

## Adding video backgrounds (future step)

To add your 15-second cinematic videos to the home screen:
1. Place `.mp4` files in `/public/videos/`
2. In `Home.jsx`, replace `<div className="home__bg">` with `<video>` elements
3. Add `autoPlay muted loop playsInline` attributes

---

*Built with React + Vite. Deployed on Vercel.*
