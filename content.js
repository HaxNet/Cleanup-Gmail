/* ------------------------------------------------------------------
   content.js — runs at document_start on mail.google.com
   Two jobs:
     1. Mirror the user's settings onto <html> as gs-* classes + CSS vars
        so gmail.css can do all the visual work.
     2. Tag Gmail's obfuscated DOM with stable [data-gs] attributes,
        using aria-labels and roles (which Google keeps stable) instead
        of relying only on churn-prone class names like .aeN / .bkK.
   ------------------------------------------------------------------ */

(() => {
  'use strict';

  const root = document.documentElement;
  let settings = { ...GS_DEFAULTS };

  /* ---------- 1. apply settings ---------------------------------- */

  function apply(s) {
    settings = { ...GS_DEFAULTS, ...s };

    root.classList.toggle('gs-on', !!settings.enabled);

    GS_TOGGLES.forEach(t => {
      root.classList.toggle('gs-' + t.key, !!settings.enabled && !!settings[t.key]);
    });

    // density is a 3-way switch
    ['comfortable', 'cozy', 'compact'].forEach(d => {
      root.classList.toggle('gs-density-' + d, settings.enabled && settings.density === d);
    });

    // card shadow depth is a 3-way switch
    ['flat', 'soft', 'raised'].forEach(v => {
      root.classList.toggle('gs-card-' + v, settings.enabled && settings.cardStyle === v);
    });

    const st = root.style;
    st.setProperty('--gs-accent', settings.accent);
    st.setProperty('--gs-font', settings.font);
    st.setProperty('--gs-size', settings.fontSize + 'px');
    st.setProperty('--gs-pane', settings.paneWidth + 'px');
    st.setProperty('--gs-list', settings.listWidth + 'px');
    st.setProperty('--gs-reply', settings.replyWidth + 'px');
    st.setProperty('--gs-row-unread', settings.rowUnread);
    st.setProperty('--gs-row-read', settings.rowRead);
    st.setProperty('--gs-divider', settings.divider);
    st.setProperty('--gs-divider-w', settings.dividerSize + 'px');

    /* Card shadow.
       Computed here rather than as fixed CSS presets so the depth
       slider can scale it continuously. Two layers: a tight contact
       shadow that grounds the card, plus a wide soft one for depth —
       a single blur reads as fog rather than elevation.
       `flat` multiplies to 0, leaving the bordered look intact. */
    const depth = Math.max(0, Math.min(100, Number(settings.shadowDepth) || 0));
    const mult = settings.cardStyle === 'raised' ? 1.4
               : settings.cardStyle === 'soft'   ? 0.7
               : 0;
    const px = (n) => (depth * n * mult).toFixed(2) + 'px';
    const al = (n) => (depth * n * mult).toFixed(3);

    // Contact layer stays much lighter than the depth layer. A tight
    // blur at high alpha reads as a hard dark line under the card, not
    // as contact — the wide layer is what carries the sense of lift.
    st.setProperty('--gs-sh-y1', px(0.030));   // contact layer
    st.setProperty('--gs-sh-b1', px(0.090));
    st.setProperty('--gs-sh-a1', al(0.0012));
    st.setProperty('--gs-sh-y2', px(0.160));   // depth layer
    st.setProperty('--gs-sh-b2', px(0.520));
    st.setProperty('--gs-sh-a2', al(0.0034));
    st.setProperty('--gs-radius', (settings.rounded ? settings.radius : 0) + 'px');
    st.setProperty('--gs-gap', settings.cardGap + 'px');
    // Canvas resolution, in priority order:
    //   1. an explicit user pick  -> inline --gs-canvas, always wins
    //   2. untouched default      -> only --gs-canvas-light, so the
    //                                dark-theme rule in CSS can override
    // Inline styles outrank class rules, which is exactly the lever here:
    // previously the dark rule swallowed the user's chosen color and the
    // picker appeared to do nothing in a dark Gmail.
    st.setProperty('--gs-canvas-light', settings.canvas);
    const picked = (settings.canvas || '').toLowerCase();
    if (picked && picked !== String(GS_DEFAULTS.canvas).toLowerCase()) {
      st.setProperty('--gs-canvas', settings.canvas);
    } else {
      st.removeProperty('--gs-canvas');
    }

    injectCustomCss(settings.enabled ? settings.customCss : '');
    if (settings.enabled) { detectDark(true); scan(); }
  }

  /* ---------- dark-theme detection -------------------------------
     Card surfaces have to match whichever theme Gmail itself is using,
     otherwise a white card lands on a dark thread. Gmail exposes no
     theme flag, so sample the rendered background luminance instead.
     Throttled — getComputedStyle forces a style recalc.              */

  let lastProbe = 0;
  function detectDark(force) {
    const now = Date.now();
    if (!force && now - lastProbe < 2000) return;
    lastProbe = now;

    if (settings['oled-dark']) { root.classList.add('gs-dark'); return; }
    if (!document.body) return;

    const bg = getComputedStyle(document.body).backgroundColor || '';
    const m = bg.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return;
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    root.classList.toggle('gs-dark', lum < 0.5);
  }

  function injectCustomCss(css) {
    let el = document.getElementById('gs-custom-css');
    if (!css) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('style');
      el.id = 'gs-custom-css';
      (document.head || root).appendChild(el);
    }
    el.textContent = css;
  }

  /* ---------- 2. tag the DOM ------------------------------------- */

  // [ data-gs value , list of selectors that identify it ]
  const TAGS = [
    ['header',      ['header.gb_Kd', 'header[role="banner"]', '#gb']],
    ['search',      ['form#aso_search_form_anchor', '[role="search"]', '#gs_lc50']],
    ['apps',        ['[aria-label="Google apps"]', 'a[aria-label*="Google Account"]',
                     '[aria-label="Support"]', '[aria-label="Settings"]',
                     '[data-tooltip="Support"]', '[data-tooltip="Settings"]']],
    ['sidepanel',   ['[aria-label="Side panel"]', '.brC-brG', '.bAw', '.aTC']],
    ['nav',         ['[role="navigation"]', '.aeN', '.wT']],
    ['chat',        ['[data-tooltip="Chat"]', '[aria-label="Chat"]', '[aria-label="Spaces"]',
                     '[aria-label="Meet"]', '[data-tooltip="Meet"]', '.aBP', '.aeZ']],
    ['tabs',        ['.aKh', '[role="tablist"].aKk', '.aJi']],
    ['footer',      ['.xk', '.bhZ', '.aeJ .n3']],
    ['compose',     ['.T-I.T-I-KE.L3', '[gh="cm"]']],
    ['msg-actions', ['[aria-label="Print all"]', '[aria-label="In new window"]',
                     '[data-tooltip="Print all"]', '[data-tooltip="In new window"]']]
  ];

  function tag(name, selectors) {
    selectors.forEach(sel => {
      let nodes;
      try { nodes = document.querySelectorAll(sel); } catch (e) { return; }
      nodes.forEach(n => {
        if (n.dataset.gs !== name) n.dataset.gs = name;
      });
    });
  }

  // Ad rows: real threads carry a thread id, sponsored rows never do and
  // are labelled "Ad". Both conditions must hold before we touch a row.
  function tagAds() {
    document.querySelectorAll('tr.zA:not([data-gs-ad])').forEach(tr => {
      if (tr.querySelector('[data-legacy-thread-id], [data-thread-id]')) return;
      if (tr.hasAttribute('data-legacy-thread-id')) return;
      const marked = Array.from(tr.querySelectorAll('span, div')).some(el => {
        const t = (el.textContent || '').trim();
        return t === 'Ad' || t === 'Sponsored' || t === 'Anuncio';
      });
      if (marked) tr.setAttribute('data-gs-ad', '1');
    });
  }

  /* ---------- move the reply block above the thread ---------------
     Earlier this used flexbox `order`. That broke thread scrolling:
     the ancestor holding the messages is often the scroll container
     itself, and forcing display:flex on it collapses its overflow.

     So instead move the node — a real insertBefore within the SAME
     parent. Layout stays block, scrolling is untouched, and listeners
     survive a move. It's self-converging: once the block is first
     child the function no-ops, so the MutationObserver can't loop.   */

  let moving = false;

  // Verified against a live Gmail thread. The structure is:
  //   div.Tm.aeJ            <- scroll container (never restyle its layout)
  //     div.aeF
  //       …
  //         div.nH.a98.iY.aHo   <- holds subject + messages + reply
  //           [0] div.nH          subject header
  //           [1] div.nH          the message cards (.adn.ads)
  //           [2] div.nH…         the reply bar (.amn lives in here)
  //
  // Two selectors that looked right were wrong and are deliberately gone:
  //   .btb   — in this Gmail it is a class on INBOX LIST ROWS
  //            (tr.zA yO btb mt-list), so it matched an email row.
  //   .ip.iq — a 20px stub near the page bottom, not the reply bar.
  // The real bar is the .amn that has actual height.

  const REPLY_NAME = /^(reply all|reply to all|reply|forward)$/i;

  function findReplyBar() {
    const amn = Array.from(document.querySelectorAll('.amn'))
      .find(e => e.getBoundingClientRect().height > 10);
    if (amn) return amn;

    // fallback by accessible name; tr.zA guard keeps us out of the list
    const hits = Array.from(document.querySelectorAll('button, [role="button"], [aria-label]'))
      .filter(e => REPLY_NAME.test((e.getAttribute('aria-label') || e.textContent || '').trim()))
      .filter(e => e.getClientRects().length && !e.closest('tr.zA'));
    return hits.pop() || null;
  }

  function placeReplyTop() {
    const bar = findReplyBar();
    const card = document.querySelector('.adn.ads');
    if (!bar || !card) return;

    // nearest ancestor containing BOTH the reply bar and the messages
    let box = bar.parentElement, guard = 0;
    while (box && guard++ < 14 && !box.contains(card)) box = box.parentElement;
    if (!box) return;

    // that ancestor's direct child which wraps the reply bar
    let replyChild = bar;
    while (replyChild.parentElement && replyChild.parentElement !== box) {
      replyChild = replyChild.parentElement;
    }
    if (replyChild.parentElement !== box) return;

    // and the sibling that holds the messages
    const msgChild = Array.from(box.children)
      .find(c => c !== replyChild && c.contains(card));
    if (!msgChild) return;

    replyChild.dataset.gs = 'reply-block';

    // Sit directly above the messages but BELOW the subject header —
    // putting it above the subject reads as broken.
    if (replyChild.nextElementSibling === msgChild) return;   // converged

    moving = true;
    try { box.insertBefore(replyChild, msgChild); } catch (e) { /* ignore */ }
    // MutationObserver fires asynchronously, so the flag has to outlive
    // this tick or the observer would already see moving === false and
    // schedule a redundant scan for our own edit.
    setTimeout(() => { moving = false; }, 0);
  }

  /* ---------- TODAY / YESTERDAY / … date headers ------------------
     Gmail has no native date grouping, so these are injected.
     Each row exposes a full timestamp on the date cell:
       <span title="Mon, Aug 24, 2026, 6:29 PM" aria-label="…">
     which Date() parses directly.

     Rebuilds are gated on a signature of the label sequence, so a
     steady list produces zero DOM writes and the MutationObserver
     cannot feed itself.                                              */

  const DAY = 86400000;

  function rowDate(row) {
    const el = row.querySelector('td.xW span[title], span[title][aria-label]');
    const t = el && (el.getAttribute('title') || el.getAttribute('aria-label'));
    if (!t) return null;
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }

  function dateLabel(d) {
    const midnight = x => { const c = new Date(x); c.setHours(0, 0, 0, 0); return c.getTime(); };
    const days = Math.round((midnight(new Date()) - midnight(d)) / DAY);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return 'This week';
    if (days < 14) return 'Last week';
    if (days < 31) return 'This month';
    if (days < 62) return 'Last month';
    const now = new Date();
    return d.toLocaleDateString(undefined, {
      month: 'long',
      year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric'
    });
  }

  function dateHeaders() {
    const tbody = document.querySelector('table.F.cf.zt tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr.zA'));
    if (!rows.length) return;

    const wanted = [];
    let last = null;
    rows.forEach(r => {
      const d = rowDate(r);
      if (!d) return;
      const lab = dateLabel(d);
      if (lab !== last) { wanted.push({ row: r, lab }); last = lab; }
    });

    const existing = tbody.querySelectorAll('tr[data-gs-hdr]');
    const sig = wanted.map(w => w.lab).join('|');
    // converged: same labels AND our headers are still in the DOM
    if (tbody.dataset.gsHdrSig === sig && existing.length === wanted.length) return;

    moving = true;
    existing.forEach(e => e.remove());
    wanted.forEach(({ row, lab }) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-gs-hdr', '1');
      const td = document.createElement('td');
      td.setAttribute('colspan', '12');
      td.textContent = lab;
      tr.appendChild(td);
      try { row.parentElement.insertBefore(tr, row); } catch (e) { /* ignore */ }
    });
    tbody.dataset.gsHdrSig = sig;
    setTimeout(() => { moving = false; }, 0);
  }

  /* ---------- quick filters in the left sidebar -------------------
     Each entry is a real Gmail search, navigated via the #search/ hash,
     so Gmail does the filtering server-side and paging/counts all work.
     Nothing is filtered client-side.

     Gmail's date operators are calendar-day based and half-open:
     after:X is inclusive, before:Y is exclusive — so "Today" needs an
     explicit before:tomorrow, otherwise it would match everything from
     today onward.                                                    */

  const ymd = d => d.getFullYear() + '/' +
    String(d.getMonth() + 1).padStart(2, '0') + '/' +
    String(d.getDate()).padStart(2, '0');

  function quickDefs() {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const tomorrow  = new Date(t); tomorrow.setDate(t.getDate() + 1);
    const yesterday = new Date(t); yesterday.setDate(t.getDate() - 1);
    const thisMonth = new Date(t.getFullYear(), t.getMonth(), 1);
    const lastMonth = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    return [
      { label: 'Today',      q: 'in:inbox after:' + ymd(t) + ' before:' + ymd(tomorrow) },
      { label: 'Yesterday',  q: 'in:inbox after:' + ymd(yesterday) + ' before:' + ymd(t) },
      { label: 'Last month', q: 'in:inbox after:' + ymd(lastMonth) + ' before:' + ymd(thisMonth) },
      { label: 'Unread',     q: 'in:inbox is:unread' }
    ];
  }

  // The system-label group (Inbox, Starred, Sent…). div.TK is Gmail's
  // container for it; fall back to walking up from the Inbox link.
  function navGroup() {
    const tk = document.querySelector('div.TK');
    if (tk) return tk;
    const inbox = document.querySelector('a[href$="#inbox"], [data-tooltip="Inbox"]');
    if (!inbox) return null;
    let p = inbox;
    for (let i = 0; i < 5 && p.parentElement; i++) {
      p = p.parentElement;
      if (p.children.length > 2) return p;
    }
    return null;
  }

  const searchHash = q => '#search/' + encodeURIComponent(q).replace(/%20/g, '+');

  function goToSearch(q) {
    const target = searchHash(q);
    if (location.hash === target) {
      // Same hash = no hashchange event = Gmail never re-routes, so the
      // second click on an active filter would appear to do nothing.
      // Bounce through the inbox to force a real navigation.
      location.hash = '#inbox';
      setTimeout(() => { location.hash = target; }, 0);
    } else {
      location.hash = target;
    }
  }

  function markQuickActive(box) {
    // hash uses + for spaces; normalise before comparing
    const hash = decodeURIComponent(location.hash.replace(/\+/g, ' '));
    box.querySelectorAll('a[data-gs-q]').forEach(a => {
      a.classList.toggle('gs-qf-on', hash.indexOf(a.dataset.gsQ) !== -1);
    });
  }

  function quickFilters() {
    const anchor = navGroup();
    if (!anchor || !anchor.parentElement) return;

    const defs = quickDefs();
    const sig = defs.map(d => d.q).join('|');   // changes when the day rolls over
    const host = anchor.parentElement;
    const existing = host.querySelector('[data-gs-quick]');

    if (existing && existing.dataset.gsQuickSig === sig) {
      markQuickActive(existing);               // converged; just refresh highlight
      return;
    }

    moving = true;
    if (existing) existing.remove();

    const box = document.createElement('div');
    box.setAttribute('data-gs-quick', '1');
    box.dataset.gsQuickSig = sig;

    const head = document.createElement('div');
    head.className = 'gs-qf-head';
    head.textContent = 'Quick filters';
    box.appendChild(head);

    defs.forEach(d => {
      const a = document.createElement('a');
      a.className = 'gs-qf';
      a.href = searchHash(d.q);
      a.textContent = d.label;
      a.dataset.gsQ = d.q;
      box.appendChild(a);
    });

    /* Navigate programmatically instead of trusting the href.
       Gmail delegates clicks in the sidebar and calls preventDefault()
       on them, which swallows a plain anchor navigation — the link
       looks dead. Capture phase so we run before Gmail's own handlers,
       and we set location.hash ourselves so preventDefault upstream
       can't stop us. */
    box.addEventListener('click', ev => {
      const a = ev.target.closest && ev.target.closest('a[data-gs-q]');
      if (!a) return;
      ev.preventDefault();
      ev.stopPropagation();
      goToSearch(a.dataset.gsQ);
    }, true);

    try { host.insertBefore(box, anchor.nextSibling); } catch (e) { /* ignore */ }
    markQuickActive(box);
    setTimeout(() => { moving = false; }, 0);
  }

  let queued = false;
  function scan() {
    if (!settings.enabled) return;
    TAGS.forEach(([name, sels]) => tag(name, sels));
    if (settings['hide-ads']) tagAds();
    if (settings['reply-top']) placeReplyTop();
    if (settings['date-headers']) dateHeaders();
    if (settings['quick-filters']) quickFilters();
    detectDark(false);
  }

  function scheduleScan() {
    if (moving || queued) return;   // our own DOM move must not re-enter
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }

  /* ---------- 3. boot ------------------------------------------- */

  // Paint immediately from defaults to avoid a flash of stock Gmail,
  // then reconcile as soon as storage answers.
  apply(GS_DEFAULTS);

  chrome.storage.sync.get('settings', res => {
    if (chrome.runtime.lastError) { apply({}); return; }
    apply(res && res.settings ? res.settings : {});
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) apply(changes.settings.newValue || {});
  });

  // Live preview from the popup. Arrives ahead of the debounced storage
  // write so dragging a slider updates Gmail immediately; the later
  // storage event just re-applies the same state.
  chrome.runtime.onMessage.addListener(msg => {
    if (msg && msg.type === 'gs-preview' && msg.settings) apply(msg.settings);
  });

  // Gmail is a hash-router; update the quick-filter highlight on nav.
  window.addEventListener('hashchange', () => {
    const box = document.querySelector('[data-gs-quick]');
    if (box) markQuickActive(box);
  });

  function watch() {
    new MutationObserver(scheduleScan).observe(document.body, {
      childList: true, subtree: true
    });
    scan();
  }

  if (document.body) watch();
  else document.addEventListener('DOMContentLoaded', watch, { once: true });
})();
