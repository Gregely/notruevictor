# Mind Atlas

A handmade-feeling notebook where each chapter you write becomes a little drawing on a map of your mind.
Everything stays in your browser (localStorage). There's no server and no account.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
cd mind-atlas
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

Other commands:

| command           | what it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run build`   | type-checks and builds a static site into `dist/` |
| `npm run preview` | serves the built `dist/` folder locally          |
| `npm run lint`    | checks the code for common mistakes              |

The built `dist/` folder is plain static files, so you can host it anywhere (GitHub Pages, Netlify, a USB stick).

## Using it

- **write**: title, date, a mood, a drawing for the map (island, star, spiral, cloud, moon), tags, and the text.
  Press Enter or a comma to add a tag. An unsaved new chapter is kept as a draft if you close the tab.
- **map**: drag to wander, scroll or pinch to zoom, ⤢ to fit everything. Chapters sharing tags are joined by
  dotted lines and drift together. Click a drawing to read it. Click a tag chip to light up just those chapters.
- **themes**: your most-used tags (bubbles), most-used words (crayon bars) and moods.
- **read back**: chapters in date order. Use the ← → buttons or arrow keys, or click a drawing in the strip at the top.
  Add notes in the margin.
- **🎒 backpack**: export everything as a `.json` file, or import one (merge with what's here, or replace it).
- **☀ / ☾**: day paper or night paper.

Browser storage can be cleared by the browser or by you, so export a copy now and then.

## Finding your way around the code

```
src/
  main.tsx              starts React
  App.tsx               header, tabs, and which page to show
  index.css             all the styles: colours at the top, animations at the bottom
  types.ts              the Chapter shape, plus the mood emoji and drawing choices
  lib/
    store.tsx           chapters in memory + auto-save (useAtlas() hook)
    storage.ts          localStorage, export and import (with validation)
    router.ts           tiny #/hash router
    layout.ts           where chapters sit on the map (a small force simulation)
    usePanZoom.ts       drag / scroll / pinch handling for the map
    words.ts            counting tags, words and moods for the Themes page
    utils.ts            dates, ids, tag cleanup, tag colours
  components/
    GlyphArt.tsx        the hand-drawn SVG pictures
    TagInput.tsx        the tag chips box
    InkBurst.tsx        the splash when you add a chapter
    ChapterModal.tsx    the card that opens when you click a drawing
    Backpack.tsx        export / import panel
    ThemeToggle.tsx     day / night switch
  pages/
    WritePage.tsx  MapPage.tsx  ThemesPage.tsx  ReadPage.tsx
```

Easy things to change:

- **Mood emoji**: `MOODS` in `src/types.ts`.
- **Colours and fonts**: the variables at the top of `src/index.css` (fonts are loaded in `index.html`).
- **Tag colours**: `INKS` in `src/lib/utils.ts`.
- **Map spacing and clustering**: the tuning numbers in `src/lib/layout.ts`.
- **Words hidden from Themes**: `STOP_WORDS` in `src/lib/words.ts`.
- **A new drawing**: add its id to `Glyph` and `GLYPHS` in `src/types.ts`, then add a `case` in `src/components/GlyphArt.tsx`.

## Your data

It's saved under the localStorage key `mind-atlas:v1` as `{ "app": "mind-atlas", "version": 1, "chapters": [...] }`.
An export file has the same shape. Import also accepts a bare array of chapters, and skips anything it can't read.
