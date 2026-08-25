/* ------------------------------------------------------------------
   report-addon-dom.js — diagnostic for third-party compose toolbars

   Run this when an add-on (Boomerang, Mailtrack, Streak, Grammarly …)
   renders a toolbar in the Gmail compose window that doesn't sit
   properly inside Cleanup Gmail's card.

   HOW TO RUN
     1. Open Gmail and click Compose (or Reply) so the add-on's row
        is visible on screen.
     2. Press F12 to open DevTools, choose the Console tab.
     3. Paste this whole file, press Enter.
     4. The report is printed AND copied to your clipboard — paste it
        into the GitHub issue.

   WHAT IT COLLECTS
     Element structure only: tag names, CSS classes, sizes, positions
     and computed background/border. It does not read recipients,
     subject lines, or message text.
   ------------------------------------------------------------------ */

(() => {
  const out = [];
  const say = (s) => out.push(s);

  const desc = (el) => {
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return [
      el.tagName.toLowerCase() + '.' + String(el.className || '').trim().replace(/\s+/g, '.').slice(0, 60),
      'L' + Math.round(r.left) + ' R' + Math.round(r.right) + ' w' + Math.round(r.width) + ' h' + Math.round(r.height),
      'bg=' + c.backgroundColor,
      'border=' + c.borderTopWidth + '/' + c.borderLeftWidth,
      'radius=' + c.borderRadius,
      'position=' + c.position
    ].join('  ');
  };

  // The compose editor is the reliable anchor — Gmail keeps this
  // accessible name stable across releases.
  const editor = [...document.querySelectorAll('[role="textbox"][aria-label], div.Am[contenteditable="true"]')]
    .find(e => /message body/i.test(e.getAttribute('aria-label') || '') && e.getClientRects().length);

  if (!editor) {
    console.log('Open a compose or reply window first, then run this again.');
    return;
  }

  // Climb to the outermost compose container.
  let box = editor;
  for (let i = 0; i < 14 && box.parentElement; i++) {
    const p = box.parentElement;
    if (p === document.body) break;
    box = p;
  }

  say('=== Cleanup Gmail — add-on DOM report ===');
  say('gmail layout : ' + (document.documentElement.className || '(none)').slice(0, 120));
  say('compose root : ' + desc(box));
  say('');
  say('--- direct children of the compose root ---');
  [...box.children].forEach((c, i) => {
    if (c.getBoundingClientRect().height < 4) return;
    say('[' + i + '] ' + desc(c));
  });

  say('');
  say('--- rows that look like add-on toolbars ---');
  const boxRect = box.getBoundingClientRect();
  [...box.querySelectorAll('div,table,section')].forEach(el => {
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    if (r.width < 250 || r.height < 24 || r.height > 140) return;
    const paints = c.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                   parseFloat(c.borderTopWidth) > 0 ||
                   c.boxShadow !== 'none';
    const overhangs = r.left < boxRect.left - 1 || r.right > boxRect.right + 1;
    // Gmail's own furniture uses short obfuscated class names; add-ons
    // usually ship longer, wordier ones. Not exact — just a hint.
    const looksThirdParty = /[a-z]{6,}/.test(String(el.className || ''));
    if (paints && (overhangs || looksThirdParty)) {
      say((overhangs ? 'OVERHANGS ' : '          ') + desc(el));
    }
  });

  const text = out.join('\n');
  console.log(text);
  try {
    navigator.clipboard.writeText(text);
    console.log('\n^ copied to clipboard — paste it into the issue.');
  } catch (e) {
    console.log('\n^ select the text above and copy it manually.');
  }
})();
