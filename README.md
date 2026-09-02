<div align="center">

<img src="icons/logo.svg" alt="Cleanup Gmail logo" width="112" height="112">

# Cleanup Gmail — Minimal UI

**A Chrome extension that strips Gmail down to a clean, focused interface — then hands you the controls.**

<a href="https://buymeacoffee.com/tekniq"><img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-☕-FFDD00?style=for-the-badge" alt="Buy me a coffee"></a>
<img src="https://img.shields.io/badge/Manifest-V3-111111?style=for-the-badge" alt="Manifest V3">
<img src="https://img.shields.io/badge/License-MIT-111111?style=for-the-badge" alt="MIT License">

</div>

---

Hide the clutter, float each message as a card, put the reply bar at the top, reverse threads so the newest message leads, and set your own accent color, fonts, density, and spacing. **38 toggles, 60 settings**, all live-updating with no page reload — and `Alt + S` to switch the whole thing on or off without leaving Gmail.

Works in Chrome, Edge, Brave, Arc, Opera, Vivaldi — anything Chromium.

---

## Install

Not on the Chrome Web Store — load it directly. Takes about a minute.

1. **Download** this repo — green **Code** button → **Download ZIP** → unzip it
   (or `git clone https://github.com/HaxNet/Cleanup-Gmail.git`)
2. Go to `chrome://extensions`
3. Turn on **Developer mode** (top-right)
4. Click **Load unpacked** and select the folder
5. Open Gmail, pin the extension, click its icon

Keep the folder where it is — Chrome loads from that path every launch. Deleting it uninstalls the extension.

> **Why the `key` field in `manifest.json`?** For unpacked extensions Chrome normally derives the extension ID from the folder's absolute path, and `chrome.storage.sync` is keyed to that ID — so moving or renaming the folder silently wipes your settings. The pinned key fixes the ID, so the extension keeps its settings no matter where the folder lives, and gets the same ID on every machine.

> **Edge / Brave / Arc / Opera:** same steps. Edge uses `edge://extensions`, Brave `brave://extensions`.

---

## What it does

Everything is a toggle. The master switch at the top of the popup returns Gmail to 100% stock with nothing left behind.

### Interface

| Setting | What it does | Default |
|---|---|---|
| **Hide Gmail top bar** | Removes the logo + app bar row | On |
| **Slim search bar** | Borderless, quieter search field | On |
| **Hide apps / support icons** | Google apps grid, Support, Settings gear | On |
| **Hide right side panel** | Calendar, Keep, Tasks, Contacts rail | On |
| **Auto-hide left sidebar** | Collapses; slides out on hover | Off |
| **Hide Chat / Meet / Spaces** | Removes them from the left rail | On |
| **Quick filters in sidebar** | Today / Yesterday / Last month / Unread | On |
| **Hide inbox category tabs** | Primary / Promotions / Social strip | On |
| **Hide footer** | Storage usage, Terms, Privacy | On |

### Message list

| Setting | What it does | Default |
|---|---|---|
| **Narrow, centered list** | Caps list width and centers it | On |
| **Date headers** | TODAY / YESTERDAY / LAST MONTH dividers | On |
| **Distinct unread rows** | Stops unread blending into the background | On |
| **Lines between emails** | Your own color and thickness | On |
| **Accent bar on unread** | Thin accent stripe down the left edge | On |
| **Hide ads** | Sponsored rows in Promotions / Social | On |
| **Borderless list** | Drops dividers, shadows, boxed edges | On |
| **Checkboxes on hover only** | Hides the select column until hover | On |
| **Hide sender avatars** | Profile pictures in the list | Off |
| **Hide hover buttons** | Archive / delete icons on row hover | Off |
| **Hide category chips** | Promotions / Social / Updates labels | Off |
| **Hide importance markers** | Yellow arrow priority markers | Off |

### Reading a thread

| Setting | What it does | Default |
|---|---|---|
| **Newest message on top** | Reverses the chain so the latest reply leads | On |
| **Float messages as cards** | Rounded card per message on a tinted canvas | On |
| **Reply box at top** | Moves Reply / Reply all / Forward above the thread | On |
| **Reply bar matches card width** | Off = use the reply width slider | On |
| **Center reading pane** | Caps line length, centers the message | On |
| **Simplify reply bar** | Quieter Reply / Forward controls | On |
| **Keep reply bar pinned** | Stays visible while you scroll | Off |
| **Hide print / pop-out icons** | Top-right of an open message | Off |

### Appearance

| Setting | What it does | Default |
|---|---|---|
| **Accent color** | 8 presets + custom picker | `#111111` |
| **Accent color on buttons** | Applies it to Compose, unread, links, hover tint | On |
| **Rounded corners** | Master switch for the radius slider | On |
| **Use custom font** | Applies the font chosen below | Off |
| **Canvas** | Background behind the message cards | `#f1f3f4` |
| **Unread / read row colors** | Independent pickers for each | white / `#eef1f6` |
| **Divider color + thickness** | 0–3px, 0 for none | `#dfe3e8`, 1px |
| **Card depth + shadow depth** | Flat / Soft / Raised, plus a 0–100% scale | Raised, 55% |
| **Corner radius** | 0–20px | 12px |
| **Font + text size** | 6 font choices, 11–19px | System UI, 14px |
| **Row density** | Roomy / Cozy / Tight | Cozy |
| **List / card / reply widths** | Independent sliders | 1000 / 900 / 900px |
| **Deep black background** | Pairs with Gmail's own dark theme | Off |
| **Custom CSS** | Injected last — your escape hatch | — |

---

## Quick filters

Adds **Today · Yesterday · Last month · Unread** to the sidebar above your labels.

These run as real Gmail searches, not client-side filtering — so paging, counts, and search refinement all behave exactly as if you'd typed the query yourself. "Last month" means the previous calendar month.

---

## Moving your settings to another browser

`chrome.storage.sync` only syncs Chrome↔Chrome on the same Google account. Edge, Brave, Arc and Opera each keep separate storage, so use **Backup & transfer** in the popup:

1. Popup → **Download .json** (or **Copy settings** for the clipboard)
2. Install the extension in the other browser
3. Its popup → **drag the .json file onto the import box**

Dragging is the most reliable route. A native file dialog steals focus and Chrome dismisses the popup when that happens, so **Choose file…** may close the panel before it can read anything. If it does, use the *open this panel in a tab* link — in a tab the picker behaves normally. Pasting the JSON works too.

Imported JSON is validated before anything is written: unknown keys dropped, types checked, numbers clamped to each slider's range, colors required to be `#rrggbb`. A malformed paste reports an error rather than corrupting your setup.

---

## When Gmail breaks a rule

Gmail's CSS class names are machine-generated and Google reshuffles them a few times a year. This extension defends against that by targeting stable `aria-label` and `role` attributes first, keeping Gmail's class names only as fallbacks. When something still slips:

1. Right-click the stubborn element in Gmail → **Inspect**
2. Copy its `aria-label` (preferred — survives updates) or class
3. Popup → **Advanced** → paste:

```css
[aria-label="Whatever It Says"] { display: none !important; }
```

Custom CSS is injected after everything else, so it always wins.

---

## Privacy

- **No network requests.** None. The extension never phones home.
- **No email content is read**, stored, or transmitted.
- **Two permissions only:** `storage` for your settings, and access to `mail.google.com` to restyle the page.
- Settings live in `chrome.storage.sync`, which follows your Chrome profile.

Everything runs locally. The source is right here — it's short enough to read in one sitting.

---

## Project layout

```
manifest.json    MV3 manifest
defaults.js      settings schema — shared by content script and popup
content.js       applies settings, tags Gmail's DOM, injects quick filters + date headers
gmail.css        all visual rules, each gated behind a gs-* class
popup.html/css/js  the control panel
icons/           logo.svg (master) + logo-16.svg (pixel-tuned) → icon16/32/48/128.png
```

**Regenerating the icons:** `logo.svg` is the source of truth for 32 / 48 / 128; `logo-16.svg` is a separate pixel-grid-tuned variant that must be rendered natively at 16×16 — downsampling the master to that size turns the bars to mush.

```bash
python3 -c "
import cairosvg; from PIL import Image
cairosvg.svg2png(url='icons/logo.svg', write_to='/tmp/m.png', output_width=1024, output_height=1024)
m = Image.open('/tmp/m.png').convert('RGBA')
[m.resize((s,s), Image.LANCZOS).save(f'icons/icon{s}.png') for s in (128,48,32)]
cairosvg.svg2png(url='icons/logo-16.svg', write_to='icons/icon16.png', output_width=16, output_height=16)
"
```

**Adding a feature:** append an entry to `GS_TOGGLES` in `defaults.js`, then write `html.gs-<your-key> { … }` in `gmail.css`. The popup builds its own UI from that list — no popup code to touch.

### Notes for contributors

A few things learned the hard way, worth knowing before you edit:

- **`tr.zA` is `display:flex` with `flex-wrap:wrap`.** Any cell left at `flex-basis:auto` uses its full content width as its base size and wraps to a second line before it shrinks. Use `flex: 1 1 0%`.
- **Gmail elements are content-box.** A `max-width` you set gets padding added on top. Add `box-sizing: border-box` when widths must match.
- **Never force `display:flex` on a Gmail ancestor** without checking whether it's the scroll container — that collapses its overflow and kills scrolling.
- **Paint row backgrounds on the row, not the cells.** Square cell backgrounds paint over the row's rounded corners.
- **DOM edits must converge.** Everything injected checks whether it's already in place and no-ops if so, otherwise the MutationObserver feeds itself.
- **`chrome.storage.sync` allows ~120 writes/minute.** Slider input events blow that instantly, so writes are debounced and previews go through a direct message to the tab.

---

## Support

If this made your inbox nicer to look at, you can buy me a coffee:

**[buymeacoffee.com/tekniq](https://buymeacoffee.com/tekniq)**

Bug reports and pull requests welcome via [Issues](https://github.com/HaxNet/Cleanup-Gmail/issues). For visual bugs, a screenshot plus the output of right-click → Inspect on the offending element saves a lot of guessing.

---

## License

MIT — see [LICENSE](LICENSE). Do what you like with it.

Not affiliated with, endorsed by, or connected to Google. Gmail is a trademark of Google LLC.

---

## Changelog

### v1.4.0
- **Alt + S toggles the extension** — flips the master switch from inside Gmail, no popup, no page reload, with a brief on/off confirmation at the bottom of the page. The state is written to `chrome.storage.sync`, so the popup and every other Gmail tab follow.
- The shortcut is bound in the capture phase and stops propagation, so Gmail never sees the keystroke. It is deliberately gated on its own setting rather than on the master switch — otherwise the key that turns the extension off would be dead the moment it did.
- New **Keyboard** section in the popup turns the shortcut off if Alt+S collides with something else you use.

### v1.3.9
- Quick filters gain **Last week** (the previous calendar week, Sunday–Saturday, mirroring how Last month works) and **Last 2 weeks** (the trailing fortnight including today, via Gmail's native `newer_than:14d`).

### v1.3.8
- **Resizable compose windows** — drag the striped grip at the window's bottom-right corner. The grip is injected above the dialog because the native CSS resize handle is fully occluded by Gmail's compose surface and never receives the click. A resize observer keeps the body height in step with the window, since Gmail pins it at a fixed pixel height. Minimum size 480×480, below which the footer escapes containment.
- **Card-style compose window** — rounded corners, a thin border, and the card shadow on New Message. Assembled per edge (top corners on the dialog, bottom corners on the footer, border and shadow on the container) because clipping the dialog still cuts off Gmail's overflowing internals.
- **Compose corner radius slider** (0–24px) in the Reading pane section controls how rounded the compose card is, independent of the thread-card radius.
- **Compose edge line controls** — thickness slider (0–4px, 0 = none) and a color picker. The line is drawn as an overlay inside the dialog: a border is painted over by the clipped window, and an outline is erased by Gmail's own ancestor overflow clip, so an inner overlay is the only placement that survives.
- Fixed: the resize grip is parented to the dialog — positioned children of Gmail's window container never receive clicks (found empirically; z-index and pointer-events both ruled out).
- Fixed: the 480px minimum size no longer applies to the minimized strip, which it was inflating into a square box.

### v1.3.7
- **Open compose centered** — new compose windows open mid-screen instead of Gmail's bottom-right corner, and re-center when minimizing or restoring changes their size. Dragging a window turns auto-centering off for that window; double-clicking the title bar returns it to Gmail's corner. New toggle in Reading, on by default.
- **Settings search** — a search box at the top of the popup filters every section and toggle by name or description, so no more scrolling to find an option. Esc clears the search.

### v1.3.6
- **Movable compose windows** — drag any compose window, expanded or minimized, by its title bar. Double-click the title bar to snap it back to Gmail's corner. Each window drags independently. New toggle in Reading, on by default; positions reset on reload.

### v1.3.5
- Compose footer (Send + formatting toolbar) now sits inside its holder instead of ~93px too low — Gmail pins it with a hardcoded pixel offset that lands below the reserved space.
- Footer spans the full compose width, aligned with the From/To/Subject rows, instead of being centered 144px off.
- Reserved the scrollbar gutter on the compose body, so focusing To/From can no longer raise a scrollbar that shifts the whole layout 15px.

### v1.2.9
- Compose card rounds the top corners only. Gmail's footer overflows its own dialog, so rounding all four corners drew the card edge above the Send row.

### v1.2.5
- Card styling no longer leaks into the pop-out compose window. An unscoped rule padded the compose footer, which overflowed the body, raised a scrollbar and narrowed every row 15px — the To/From misalignment.

### v1.2.4
- Experimental **Blend add-on toolbars** toggle (Boomerang, Mailtrack, Streak), off by default.
- Added `tools/report-addon-dom.js`, a diagnostic users can run to report add-on layout issues. Collects element structure only, never message content.

### v1.2.2
- Compose box aligned to the card edge — neutralized Gmail's 8px scrollbar compensation on the body wrapper.
- Collapsed messages in a thread match the card width and follow the width slider.

### v1.0.0
- Initial release: 30+ toggles across Chrome, List, Reading and Look; floating message cards; reply at top; newest-first threads; quick filters; date headers; import/export; live preview.
