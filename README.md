# Cleanup Gmail — Minimal UI

A Chrome extension that strips Gmail down to a clean, focused interface — then hands you the controls.

Hide the clutter, float each message as a card, put the reply bar at the top, reverse threads so the newest message leads, and set your own accent color, fonts, density, and spacing. **33 toggles, 51 settings**, all live-updating with no page reload.

Works in Chrome, Edge, Brave, Arc, Opera, Vivaldi — anything Chromium.

<a href="https://buymeacoffee.com/tekniq"><img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-☕-FFDD00?style=for-the-badge" alt="Buy me a coffee"></a>

---

## Install

Not on the Chrome Web Store — load it directly. Takes about a minute.

1. **Download** this repo — green **Code** button → **Download ZIP** → unzip it
   (or `git clone https://github.com/haxnet/Cleanup-Gmail.git`)
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
icons/           16 / 32 / 48 / 128 px
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

Bug reports and pull requests welcome via [Issues](https://github.com/tekniq/Cleanup-Gmail/issues). For visual bugs, a screenshot plus the output of right-click → Inspect on the offending element saves a lot of guessing.

---

## License

MIT — see [LICENSE](LICENSE). Do what you like with it.

Not affiliated with, endorsed by, or connected to Google. Gmail is a trademark of Google LLC.
