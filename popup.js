/* ------------------------------------------------------------------
   popup.js — builds the control panel from GS_TOGGLES and persists to
   chrome.storage.sync. Every change writes immediately; the content
   script picks it up live via storage.onChanged (no Gmail reload).
   ------------------------------------------------------------------ */

(() => {
  'use strict';

  let S = { ...GS_DEFAULTS };
  const $ = id => document.getElementById(id);

  /* ---------- never fail silently --------------------------------
     A throw inside a click handler used to leave the panel blank with
     no clue why. Surface it in the UI instead so it can be read and
     reported, and so the rest of the panel keeps working.          */

  function showError(what, err) {
    try {
      let bar = document.getElementById('gs-error');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'gs-error';
        document.body.insertBefore(bar, document.body.firstChild);
      }
      bar.textContent = what + ': ' + (err && (err.message || err));
      bar.style.display = 'block';
    } catch (e) { /* last resort: don't cascade */ }
    console.error('[Cleanup Gmail]', what, err);
  }

  window.addEventListener('error', e => showError('Error', e.error || e.message));
  window.addEventListener('unhandledrejection', e => showError('Promise', e.reason));

  // Wrap a handler so one bad click can't take the panel down.
  const guard = (label, fn) => function (...args) {
    try { return fn.apply(this, args); }
    catch (err) { showError(label, err); }
  };
  let flashTimer, writeTimer, retryTimer;

  /* ---------- persistence -----------------------------------------
     chrome.storage.sync allows ~120 writes/minute. A range slider or
     color picker fires `input` dozens of times per second, so writing
     on every event blows the quota within one drag.

     So: update S and repaint immediately (the UI stays responsive),
     but coalesce the actual write behind a debounce. Discrete controls
     (toggles, swatches) settle fast; continuous ones wait longer.     */

  const WRITE_DELAY = { discrete: 120, continuous: 400 };

  function flash(msg) {
    const el = $('saved');
    el.textContent = msg || 'Saved';
    el.classList.add('show');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove('show'), 900);
  }

  function commit() {
    // Always pass a callback: without one this returns a promise whose
    // rejection is unhandled, which is what surfaced the quota error as
    // "Uncaught (in promise)".
    chrome.storage.sync.set({ settings: S }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        // Quota hit — back off and retry once the window rolls over.
        // Nothing is lost: S is the source of truth and gets rewritten.
        flash('Saving…');
        clearTimeout(retryTimer);
        retryTimer = setTimeout(commit, 1500);
        return;
      }
      flash('Saved');
    });
  }

  function save(kind) {
    clearTimeout(writeTimer);
    writeTimer = setTimeout(commit, WRITE_DELAY[kind] || WRITE_DELAY.discrete);
  }

  /* Push the new state straight to any open Gmail tab so the preview is
     instant, while the storage write stays debounced. Without this the
     UI would visibly lag behind the slider by the debounce interval.
     Messaging has no quota; storage does.                             */
  let previewQueued = false;
  function preview() {
    if (previewQueued) return;
    previewQueued = true;
    requestAnimationFrame(() => {
      previewQueued = false;
      // the url filter is allowed by host_permissions — no "tabs" perm needed
      chrome.tabs.query({ url: 'https://mail.google.com/*' }, tabs => {
        if (chrome.runtime.lastError || !tabs) return;
        tabs.forEach(t => {
          chrome.tabs.sendMessage(t.id, { type: 'gs-preview', settings: S },
            () => void chrome.runtime.lastError); // tab may not have the script yet
        });
      });
    });
  }

  function set(key, value, kind) {
    S[key] = value;
    try { paintChrome(); } catch (e) { showError('paint', e); }
    try { preview(); }    catch (e) { showError('preview', e); }
    try { save(kind); }   catch (e) { showError('save', e); }
  }

  /* ---------- build the toggle groups ---------------------------- */

  function buildGroups() {
    const wrap = $('groups');
    wrap.innerHTML = '';
    const order = [...new Set(GS_TOGGLES.map(t => t.group))];

    order.forEach(group => {
      const card = document.createElement('section');
      card.className = 'card';
      const h = document.createElement('h2');
      h.textContent = group;
      card.appendChild(h);

      GS_TOGGLES.filter(t => t.group === group).forEach(t => {
        const row = document.createElement('label');
        row.className = 'toggle';
        row.innerHTML =
          '<span class="txt"><span class="lbl"></span><span class="hint"></span></span>' +
          '<input type="checkbox"><span class="track"><span class="thumb"></span></span>';
        row.querySelector('.lbl').textContent = t.label;
        row.querySelector('.hint').textContent = t.hint;

        const cb = row.querySelector('input');
        cb.checked = !!S[t.key];
        cb.addEventListener('change', () => set(t.key, cb.checked));
        // keep in sync when Reset runs
        cb.dataset.key = t.key;

        card.appendChild(row);
      });
      wrap.appendChild(card);
    });
  }

  function buildSwatches() {
    const wrap = $('swatches');
    wrap.innerHTML = '';
    GS_ACCENTS.forEach(c => {
      const b = document.createElement('button');
      b.style.background = c;
      b.title = c;
      b.setAttribute('aria-pressed', String(S.accent.toLowerCase() === c.toLowerCase()));
      b.addEventListener('click', () => {
        S.accent = c;
        $('accent').value = c;
        buildSwatches();
        paintChrome();
        preview();
        save('discrete');
      });
      wrap.appendChild(b);
    });
  }

  function buildFonts() {
    const sel = $('font');
    sel.innerHTML = '';
    GS_FONTS.forEach(f => {
      const o = document.createElement('option');
      o.value = f.value;
      o.textContent = f.label;
      o.style.fontFamily = f.value;
      sel.appendChild(o);
    });
    sel.value = S.font;
  }

  /* ---------- reflect state into the popup's own chrome ---------- */

  function paintChrome() {
    // An invalid custom property poisons every rule that reads it —
    // e.g. a segmented button would keep color:#fff but lose its
    // background, rendering white-on-white. Fall back instead.
    const accent = /^#[0-9a-fA-F]{6}$/.test(String(S.accent))
      ? S.accent : GS_DEFAULTS.accent;
    document.documentElement.style.setProperty('--accent', accent);
    document.body.classList.toggle('off', !S.enabled);
    $('status').textContent = S.enabled
      ? 'Active on mail.google.com'
      : 'Paused — Gmail is stock';

    $('fontSizeOut').textContent  = S.fontSize + 'px';
    $('paneWidthOut').textContent = S.paneWidth + 'px';
    $('radiusOut').textContent    = S.radius + 'px';
    $('cardGapOut').textContent   = S.cardGap + 'px';
    $('listWidthOut').textContent  = S.listWidth + 'px';
    $('replyWidthOut').textContent  = S.replyWidth + 'px';
    $('dividerSizeOut').textContent = S.dividerSize + 'px';
    $('shadowDepthOut').textContent = S.shadowDepth + '%';

    // every segmented control declares which setting it drives
    document.querySelectorAll('.seg[data-key]').forEach(seg => {
      const key = seg.dataset.key;
      seg.querySelectorAll('button').forEach(b =>
        b.setAttribute('aria-pressed', String(b.dataset.v === S[key])));
    });
  }

  function paintAll() {
    $('enabled').checked   = !!S.enabled;
    $('accent').value      = S.accent;
    $('canvas').value      = S.canvas;
    $('fontSize').value    = S.fontSize;
    $('paneWidth').value   = S.paneWidth;
    $('radius').value      = S.radius;
    $('cardGap').value     = S.cardGap;
    $('listWidth').value   = S.listWidth;
    $('replyWidth').value  = S.replyWidth;
    $('rowUnread').value   = S.rowUnread;
    $('rowRead').value     = S.rowRead;
    $('divider').value     = S.divider;
    $('dividerSize').value = S.dividerSize;
    $('shadowDepth').value = S.shadowDepth;
    $('customCss').value   = S.customCss || '';
    buildFonts();
    buildSwatches();
    buildGroups();
    paintChrome();
  }

  /* ---------- wire the fixed controls ---------------------------- */

  function wire() {
    $('enabled').addEventListener('change', e => set('enabled', e.target.checked));
    // color inputs stream events while dragging → continuous
    $('accent').addEventListener('input', e => {
      S.accent = e.target.value;
      paintChrome();
      buildSwatches();
      preview();
      save('continuous');
    });
    $('canvas').addEventListener('input', e => set('canvas', e.target.value, 'continuous'));
    $('rowUnread').addEventListener('input', e => set('rowUnread', e.target.value, 'continuous'));
    $('rowRead').addEventListener('input', e => set('rowRead', e.target.value, 'continuous'));
    $('divider').addEventListener('input', e => set('divider', e.target.value, 'continuous'));
    $('font').addEventListener('change', e => set('font', e.target.value, 'discrete'));

    // sliders: the big offenders
    ['fontSize', 'paneWidth', 'radius', 'cardGap', 'listWidth', 'replyWidth',
     'dividerSize', 'shadowDepth'].forEach(key => {
      $(key).addEventListener('input', e => set(key, Number(e.target.value), 'continuous'));
    });

    document.querySelectorAll('.seg[data-key]').forEach(seg => {
      seg.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => set(seg.dataset.key, b.dataset.v));
      });
    });

    // typing is continuous by nature; the debounce in save() covers it
    $('customCss').addEventListener('input', e => {
      S.customCss = e.target.value;
      preview();
      save('continuous');
    });

    $('reset').addEventListener('click', () => {
      S = { ...GS_DEFAULTS };
      paintAll();
      preview();
      save('discrete');
    });
  }

  /* ---------- export / import -------------------------------------
     chrome.storage.sync only syncs within one browser's own account
     (Chrome↔Chrome). Edge, Brave, Arc and Opera each keep separate
     storage, so moving a setup between them needs a portable file.  */

  const HEX = /^#[0-9a-fA-F]{6}$/;

  function payload() {
    return JSON.stringify({ app: 'cleanup-gmail', version: 1, settings: S }, null, 2);
  }

  // Never trust pasted JSON: whitelist against the known schema, match
  // types, clamp numbers to each slider's own min/max, and require
  // colors to be #rrggbb (an <input type=color> silently rejects
  // anything else, which would look like the import failed).
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const src = (raw.settings && typeof raw.settings === 'object') ? raw.settings : raw;
    if (!Object.keys(GS_DEFAULTS).some(k => k in src)) return null;   // not our format

    const out = { ...GS_DEFAULTS };
    let taken = 0;

    Object.keys(GS_DEFAULTS).forEach(key => {
      if (!(key in src)) return;
      const def = GS_DEFAULTS[key];
      const val = src[key];

      if (typeof def === 'boolean') {
        if (typeof val === 'boolean') { out[key] = val; taken++; }

      } else if (typeof def === 'number') {
        const n = Number(val);
        if (!Number.isFinite(n)) return;
        const input = document.getElementById(key);
        const lo = input && input.min !== '' ? Number(input.min) : -Infinity;
        const hi = input && input.max !== '' ? Number(input.max) : Infinity;
        out[key] = Math.min(hi, Math.max(lo, n));
        taken++;

      } else if (typeof def === 'string') {
        if (typeof val !== 'string') return;
        // color-valued keys must be #rrggbb; free-text keys pass through
        if (HEX.test(def) && !HEX.test(val)) return;
        out[key] = val;
        taken++;
      }
    });

    return taken ? out : null;
  }

  function io(msg, kind) {
    const el = $('ioMsg');
    el.textContent = msg;
    el.className = 'note' + (kind ? ' ' + kind : '');
    if (kind === 'ok') setTimeout(() => { el.textContent = ''; el.className = 'note'; }, 2500);
  }

  function wireIO() {
    $('copyBtn').addEventListener('click', async () => {
      const text = payload();
      try {
        await navigator.clipboard.writeText(text);
        io('Copied to clipboard', 'ok');
      } catch (e) {
        // clipboard API can be blocked; fall back to a selectable box
        $('importBox').value = text;
        $('importBox').select();
        io('Copy manually from the box (Ctrl+C)', 'err');
      }
    });

    $('fileBtn').addEventListener('click', () => {
      const blob = new Blob([payload()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleanup-gmail-settings.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      io('Downloaded', 'ok');
    });

    // shared by paste, drag-drop and file picker
    function applyJson(text, source) {
      let parsed;
      try { parsed = JSON.parse(text); }
      catch (e) { io('Not valid JSON', 'err'); return false; }

      const clean = sanitize(parsed);
      if (!clean) { io('No recognisable settings in that file', 'err'); return false; }

      S = clean;
      paintAll();
      preview();
      save('discrete');
      $('importBox').value = '';
      io('Imported' + (source ? ' from ' + source : ''), 'ok');
      return true;
    }

    function readFile(file) {
      if (!file) return;
      if (file.size > 1024 * 512) { io('That file is too large to be settings', 'err'); return; }
      const r = new FileReader();
      r.onload = () => applyJson(String(r.result), file.name);
      r.onerror = () => io('Could not read that file', 'err');
      r.readAsText(file);
    }

    $('importBtn').addEventListener('click', () => {
      const text = $('importBox').value.trim();
      if (!text) { io('Drop a file or paste JSON first', 'err'); return; }
      applyJson(text);
    });

    // --- file picker ------------------------------------------------
    $('pickBtn').addEventListener('click', () => $('fileInput').click());
    $('fileInput').addEventListener('change', e => {
      readFile(e.target.files && e.target.files[0]);
      e.target.value = '';           // allow re-picking the same file
    });

    // --- drag and drop ----------------------------------------------
    // The reliable path: no native dialog, so the popup never loses
    // focus and can't be dismissed mid-import.
    const zone = $('dropZone');
    const stop = e => { e.preventDefault(); e.stopPropagation(); };

    ['dragenter', 'dragover'].forEach(ev =>
      zone.addEventListener(ev, e => { stop(e); zone.classList.add('drag'); }));
    ['dragleave', 'dragend'].forEach(ev =>
      zone.addEventListener(ev, e => { stop(e); zone.classList.remove('drag'); }));

    zone.addEventListener('drop', e => {
      stop(e);
      zone.classList.remove('drag');
      const dt = e.dataTransfer;
      if (dt.files && dt.files.length) { readFile(dt.files[0]); return; }
      const text = dt.getData('text');           // dragged raw JSON text
      if (text) applyJson(text);
    });

    // Dropping anywhere else in the popup would otherwise make Chrome
    // navigate to the file, blanking the panel.
    ['dragover', 'drop'].forEach(ev =>
      document.addEventListener(ev, e => { if (!zone.contains(e.target)) stop(e); }));

    // --- open in a tab ----------------------------------------------
    $('openTab').addEventListener('click', e => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?tab=1') });
      window.close();
    });
  }

  /* ---------- boot ------------------------------------------------ */

  // Rendered wider when opened as a full tab (see the Choose file note).
  if (new URLSearchParams(location.search).has('tab')) {
    document.body.classList.add('in-tab');
  }

  chrome.storage.sync.get('settings', res => {
    S = { ...GS_DEFAULTS, ...(res && res.settings ? res.settings : {}) };
    paintAll();
    wire();
    wireIO();
  });
})();
