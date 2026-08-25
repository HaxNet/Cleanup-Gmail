/* ------------------------------------------------------------------
   defaults.js — shared settings schema
   Loaded by BOTH the content script and the popup so the two can never
   drift out of sync. Add a feature here once and it shows up in the
   popup automatically; just add the matching CSS rule in gmail.css.
   ------------------------------------------------------------------ */

// Every boolean toggle. `key` doubles as the CSS class name: gs-<key>
const GS_TOGGLES = [
  // --- Chrome / layout ------------------------------------------------
  { key: 'hide-header',        group: 'Chrome',   label: 'Hide Gmail top bar',          hint: 'Removes the logo + app bar row',           on: true  },
  { key: 'slim-search',        group: 'Chrome',   label: 'Slim search bar',             hint: 'Borderless, quieter search field',         on: true  },
  { key: 'hide-apps',          group: 'Chrome',   label: 'Hide apps / support icons',   hint: 'Google apps grid, Support, Settings gear', on: true  },
  { key: 'hide-sidepanel',     group: 'Chrome',   label: 'Hide right side panel',       hint: 'Calendar, Keep, Tasks, Contacts rail',     on: true  },
  { key: 'autohide-nav',       group: 'Chrome',   label: 'Auto-hide left sidebar',      hint: 'Collapses; slides out on hover',           on: false },
  { key: 'hide-chat',          group: 'Chrome',   label: 'Hide Chat / Meet / Spaces',   hint: 'Removes them from the left rail',          on: true  },
  { key: 'quick-filters',      group: 'Chrome',   label: 'Quick filters in sidebar',    hint: 'Today / Yesterday / Last month / Unread',   on: true  },
  { key: 'hide-tabs',          group: 'Chrome',   label: 'Hide inbox category tabs',    hint: 'Primary / Promotions / Social strip',      on: true  },
  { key: 'hide-footer',        group: 'Chrome',   label: 'Hide footer',                 hint: 'Storage usage, Terms, Privacy',            on: true  },

  // --- Message list ---------------------------------------------------
  { key: 'narrow-list',        group: 'List',     label: 'Narrow, centered list',       hint: 'Caps list width and centers it',           on: true  },
  { key: 'date-headers',       group: 'List',     label: 'Date headers',                hint: 'TODAY / YESTERDAY / LAST MONTH dividers',  on: true  },
  { key: 'row-colors',         group: 'List',     label: 'Distinct unread rows',        hint: 'Stops unread blending into the canvas',    on: true  },
  { key: 'dividers',           group: 'List',     label: 'Lines between emails',        hint: 'Color and thickness set below',            on: true  },
  { key: 'unread-bar',         group: 'List',     label: 'Accent bar on unread',        hint: 'Thin accent stripe down the left edge',    on: true  },
  { key: 'hide-ads',           group: 'List',     label: 'Hide ads',                    hint: 'Sponsored rows in Promotions / Social',    on: true  },
  { key: 'borderless-list',    group: 'List',     label: 'Borderless list',             hint: 'Drops dividers, shadows, boxed edges',     on: true  },
  { key: 'hide-avatars',       group: 'List',     label: 'Hide sender avatars',         hint: 'Profile pictures in the list',             on: false },
  { key: 'hide-hover-actions', group: 'List',     label: 'Hide hover buttons',          hint: 'Archive / delete icons on row hover',      on: false },
  { key: 'hide-checkboxes',    group: 'List',     label: 'Checkboxes on hover only',    hint: 'Hides the select column until hover',      on: true  },
  { key: 'hide-cat-icons',     group: 'List',     label: 'Hide category chips',         hint: 'Promotions / Social / Updates labels',     on: false },
  { key: 'hide-importance',    group: 'List',     label: 'Hide importance markers',     hint: 'Yellow arrow priority markers',            on: false },

  // --- Reading ---------------------------------------------------------
  { key: 'newest-first',       group: 'Reading',  label: 'Newest message on top',       hint: 'Reverses the chain so the latest reply is first', on: true },
  { key: 'card-pane',          group: 'Reading',  label: 'Float messages as cards',      hint: 'Rounded card per message on a tinted canvas', on: true },
  { key: 'center-pane',        group: 'Reading',  label: 'Center reading pane',         hint: 'Caps line length, centers the message',    on: true  },
  { key: 'reply-top',          group: 'Reading',  label: 'Reply box at top',            hint: 'Moves Reply / Reply all / Forward above the thread', on: true },
  { key: 'reply-match-card',   group: 'Reading',  label: 'Reply bar matches card width', hint: 'Off = use the reply width slider',        on: true  },
  { key: 'reply-sticky',       group: 'Reading',  label: 'Keep reply bar pinned',       hint: 'Stays visible while you scroll the thread', on: false },
  { key: 'simple-reply',       group: 'Reading',  label: 'Simplify reply bar',          hint: 'Quieter Reply / Forward controls',         on: true  },
  { key: 'blend-addons',       group: 'Reading',  label: 'Blend add-on toolbars',       hint: 'Boomerang, Mailtrack, Streak — experimental', on: false },
  { key: 'hide-print-popout',  group: 'Reading',  label: 'Hide print / pop-out icons',  hint: 'Top-right of an open message',             on: false },

  // --- Look ------------------------------------------------------------
  { key: 'accent-buttons',     group: 'Look',     label: 'Accent color on buttons',     hint: 'Compose, unread dots, links, hover tint',  on: true  },
  { key: 'custom-font',        group: 'Look',     label: 'Use custom font',             hint: 'Applies the font chosen below',            on: false },
  { key: 'oled-dark',          group: 'Look',     label: 'Deep black background',       hint: 'Only bites when Gmail dark theme is on',   on: false },
  { key: 'rounded',            group: 'Look',     label: 'Rounded corners',             hint: 'Uses the radius slider below',             on: true  }
];

// Non-boolean settings
const GS_FONTS = [
  { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", label: 'System UI' },
  { value: "'Inter', 'Helvetica Neue', Arial, sans-serif",                      label: 'Inter / Helvetica' },
  { value: "Georgia, 'Times New Roman', serif",                                 label: 'Georgia (serif)' },
  { value: "'IBM Plex Mono', 'SF Mono', Consolas, monospace",                   label: 'Mono' },
  { value: "'Segoe UI', Tahoma, sans-serif",                                    label: 'Segoe UI' },
  { value: "Verdana, Geneva, sans-serif",                                       label: 'Verdana (wide)' }
];

const GS_ACCENTS = ['#1a73e8', '#0b5cff', '#111111', '#d93025', '#188038', '#8430ce', '#e37400', '#00897b'];

const GS_CARD_STYLES = [
  { value: 'flat',   label: 'Flat' },
  { value: 'soft',   label: 'Soft' },
  { value: 'raised', label: 'Raised' }
];

const GS_DEFAULTS = (() => {
  const d = {
    enabled: true,
    accent: '#111111',
    font: GS_FONTS[0].value,
    fontSize: 14,        // px
    density: 'cozy',     // comfortable | cozy | compact
    paneWidth: 900,      // px, reading pane max width
    listWidth: 1000,     // px, inbox list max width
    replyWidth: 900,     // px, used when reply-match-card is OFF
    rowUnread: '#ffffff',// unread row background (light themes)
    rowRead: '#eef1f6',  // read row background (light themes)
    divider: '#dfe3e8',  // line between rows
    dividerSize: 1,      // px; 0 = no line
    radius: 12,          // px
    cardGap: 12,         // px between message cards
    cardStyle: 'raised', // flat | soft | raised
    shadowDepth: 55,     // 0-100, scales the card shadow
    canvas: '#f1f3f4',   // page tint behind the cards (light mode)
    customCss: ''
  };
  GS_TOGGLES.forEach(t => { d[t.key] = t.on; });
  return d;
})();

// Node/CommonJS export purely so the verification script can lint this file.
if (typeof module !== 'undefined') {
  module.exports = { GS_TOGGLES, GS_FONTS, GS_ACCENTS, GS_CARD_STYLES, GS_DEFAULTS };
}
