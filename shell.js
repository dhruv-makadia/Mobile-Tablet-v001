/* Device simulator: frames app.html at real phone and tablet sizes. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const SPECS = {
    phone: { name: 'Phone', bezel: 12, portrait: { w: 390, h: 844, sat: 47, sab: 34 }, landscape: { w: 844, h: 390, sat: 0, sab: 21 } },
    tablet: { name: 'Tablet', bezel: 20, portrait: { w: 834, h: 1194, sat: 24, sab: 20 }, landscape: { w: 1194, h: 834, sat: 24, sab: 20 } }
  };
  const GAP = 56, CAPTION = 34, PAD = 48;
  const store = {
    get(k, d) { try { const v = localStorage.getItem('trxSim.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('trxSim.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  const S = {
    mode: store.get('mode', window.innerWidth >= 1280 ? 'both' : 'phone'),
    orient: store.get('orient', { phone: 'portrait', tablet: 'landscape' }),
    zoom: store.get('zoom', 'fit'),
    notes: store.get('notes', window.innerWidth >= 1600),
    scenario: 'red', screen: 'list'
  };

  const SB_ICONS = '<svg viewBox="0 0 18 12" width="18"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>'
    + '<svg viewBox="0 0 16 12" width="16"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 008 .4 10.3 10.3 0 00.8 3.3L2 4.6a8.6 8.6 0 016-2.4zm0 3.5c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 008 3.9a7 7 0 00-4.8 1.9l1.2 1.3c1-.9 2.2-1.4 3.6-1.4zm0 3.4c-.6 0-1.1.2-1.4.6L8 11.6l1.4-1.9c-.3-.4-.8-.6-1.4-.6z"/></svg>'
    + '<svg viewBox="0 0 27 12" width="27"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="#111" opacity=".45"/><rect x="2" y="2" width="17" height="8" rx="1.6"/><path d="M24 4v4a2 2 0 000-4z" opacity=".45"/></svg>';

  function makeDevice(id) {
    const el = document.createElement('figure');
    el.className = 'device'; el.id = id;
    el.innerHTML = `<div class="frame"><span class="side s1"></span><span class="side s2"></span><span class="side s3"></span>
      <div class="screen"><iframe title="App preview" allow="clipboard-write"></iframe>
        <div class="statusbar"><span class="sb-time"></span><span class="sb-date"></span><span class="island"></span><span class="sb-icons">${SB_ICONS}</span></div>
        <div class="homebar"></div></div><span class="camera"></span></div><figcaption></figcaption>`;
    return el;
  }
  const devA = makeDevice('devA'), devB = makeDevice('devB');
  $('#devicesInner').append(devB, devA);

  const src = (kind, orient) => { const s = SPECS[kind][orient]; return `app.html?sat=${s.sat}&sab=${s.sab}&device=${kind}${S.scenario === 'green' ? '&scenario=green' : ''}#${S.screen === 'detail' ? '/opp/2' : '/list'}`; };
  function applyDevice(el, kind, orient) {
    const s = SPECS[kind][orient];
    const changed = el.dataset.kind !== kind || el.dataset.orient !== orient;
    el.dataset.kind = kind; el.dataset.orient = orient;
    el.style.setProperty('--w', s.w + 'px'); el.style.setProperty('--h', s.h + 'px'); el.style.setProperty('--sat', s.sat + 'px');
    el.querySelector('figcaption').innerHTML = `<b>${SPECS[kind].name}</b> · ${s.w} × ${s.h} · ${orient === 'portrait' ? 'Portrait' : 'Landscape'}`;
    const f = el.querySelector('iframe');
    if (!f.getAttribute('src')) f.setAttribute('src', src(kind, orient));
    else if (changed && f.contentWindow) f.contentWindow.postMessage({ source: 'trx-shell', type: 'insets', sat: s.sat, sab: s.sab }, '*');
  }
  const visibleFrames = () => [devA, devB].filter((d) => !d.hidden).map((d) => d.querySelector('iframe'));
  const send = (msg) => visibleFrames().forEach((f) => { try { f.contentWindow.postMessage({ source: 'trx-shell', ...msg }, '*'); } catch (e) { /* not ready */ } });
  const kindA = () => (S.mode === 'phone' ? 'phone' : 'tablet');

  function dims(kind, orient) { const s = SPECS[kind][orient], b = SPECS[kind].bezel; return { w: s.w + 2 * b, h: s.h + 2 * b }; }
  function fit() {
    const items = [];
    if (S.mode === 'both') items.push(dims('phone', S.orient.phone));
    items.push(dims(kindA(), S.orient[kindA()]));
    const W = items.reduce((t, d) => t + d.w, 0) + GAP * (items.length - 1);
    const H = Math.max(...items.map((d) => d.h)) + CAPTION;
    const stage = $('#stage');
    const scale = S.zoom === 'fit' ? Math.min(1, (stage.clientWidth - PAD) / W, (stage.clientHeight - PAD) / H) : 1;
    $('#devicesInner').style.transform = `scale(${scale})`;
    $('#devices').style.width = `${Math.ceil(W * scale)}px`;
    $('#devices').style.height = `${Math.ceil(H * scale)}px`;
  }
  function layout() {
    applyDevice(devA, kindA(), S.orient[kindA()]);
    devB.hidden = S.mode !== 'both';
    if (S.mode === 'both') applyDevice(devB, 'phone', S.orient.phone);
    $$('#deviceSeg button').forEach((b) => b.classList.toggle('active', b.dataset.device === S.mode));
    $$('#zoomSeg button').forEach((b) => b.classList.toggle('active', b.dataset.zoom === String(S.zoom)));
    $('#rotateBtn').title = `Rotate the ${kindA() === 'phone' ? 'phone' : 'tablet'} (R)`;
    fit(); setTimeout(fit, 380);
    store.set('mode', S.mode); store.set('orient', S.orient); store.set('zoom', S.zoom);
  }

  function tick() {
    const now = new Date();
    const t = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, '');
    const d = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    $$('.sb-time').forEach((x) => { x.textContent = t; });
    $$('.sb-date').forEach((x) => { x.textContent = d; });
  }

  /* ---------------------------------------------------------------- notes */
  const NOTES = {
    list: `
      <h2>Follow-Up List</h2>
      <p class="lead">The shared work queue as touch-friendly cards. Each card answers “what do I do next?” without a 14-column table.</p>
      <h3>Try this</h3>
      <ul class="try">
        <li>Tap the <b>Call-backs</b> or <b>Overdue</b> quick view under the search bar.</li>
        <li>Tap the red <b>Call-back requested</b> strip on a card. Opportunity Detail opens at the request.</li>
        <li>Tap a <b>Follow-Up date</b> chip to change the date. A Reason is required.</li>
        <li>Tap a communication icon, then open its <b>History</b> tab. Gray and red icons open the same sheet and explain why the method can't be used.</li>
        <li>Tap the round <b>filter button</b> (bottom left, as on the Scan List) for every web filter.</li>
        <li>Open <b>⋮</b> on a card to close a Follow-Up. A confirmation is shown first.</li>
      </ul>
      <h3>Where the web columns went</h3>
      <table><thead><tr><th>Web column</th><th>On the card</th></tr></thead><tbody>
        <tr><td>Call Back</td><td>Red strip across the top</td></tr>
        <tr><td>Follow-Up Date</td><td>Chip, top right. Red = overdue, yellow = 2+ days away</td></tr>
        <tr><td>Status</td><td>Status column of the Tire / Align grid</td></tr>
        <tr><td>Recommendation</td><td>2 × 2 Tire icons (front on top) and the Alignment icon</td></tr>
        <tr><td>Quote</td><td>Amber “Created” or blue “Shared” pill</td></tr>
        <tr><td>Sale</td><td>Red “No sale” or green “Sold” pill</td></tr>
        <tr><td>Visit Date</td><td>Line under the grid</td></tr>
        <tr><td>Vehicle Owner</td><td>Card title. Opens the Communication Log</td></tr>
        <tr><td>Plate, Vehicle</td><td>Second line. Opens Current Visit</td></tr>
        <tr><td>Communications</td><td>Four round buttons with count badges</td></tr>
        <tr><td>Service Advisor</td><td>“SA” on the Visit line</td></tr>
        <tr><td>Opportunity Owner</td><td>Mine / Unclaimed / name chip</td></tr>
        <tr><td>Closed</td><td>⋮ menu with confirmation. Closed cards are dimmed</td></tr>
      </tbody></table>

      <h3>Where communication history is shown</h3>
      <ul><li><b>Send SMS, Send Email, and Make Call</b> each have two tabs: <b>Compose</b> (or Make Call) and <b>History</b>. History lists every SMS, Email, or call for the Vehicle Owner, newest first. Each entry shows the date, who it went to, who sent it, and whether it belongs to the <b>Current Opportunity</b> or another one.</li>
        <li><b>Opportunity Detail → Communication Log</b> shows the full history with All / SMS / Email / Phone filters.</li>
        <li>The <b>⋮</b> menu on a list card has a <b>Communication History</b> shortcut.</li></ul>
      <h3>SMS and Email content</h3>
      <ul><li>TraXtion prepares one message. There is no message-type choice; the user edits the greeting and main text.</li>
        <li>The <b>Vehicle Owner report link</b> opens the Vehicle Owner's report (results, Recommendations, and Quotes). It is locked, always sent, and counts toward the SMS length.</li>
        <li>The SMS opt-out text and the Email dealership footer are also locked and always sent.</li>
        <li>Sending marks any Quote in the report as Shared.</li></ul>
      <h3>Phone</h3>
      <ul><li>One column of cards. Search and quick views stay pinned while you scroll.</li><li>Filters and Sort open as bottom sheets, like the existing Scan List filter.</li></ul>
      <h3>Tablet</h3>
      <ul><li><b>Portrait:</b> two-column card grid. Sheets open as centered dialogs.</li><li><b>Landscape:</b> the list and Opportunity Detail side by side. Work one Opportunity after another without losing your place.</li></ul>
      <h3>Familiar from the TraXtion app</h3>
      <ul><li>Same header, dealer card, rounded white sheet, card style, IBM Plex Sans, floating filter button, pill buttons, and four-tire colors as the Scan List.</li>
        <li><span class="tag">PROPOSED</span>ReCapture is reached from a <b>Scans | ReCapture</b> switch under the dealer card. Its badge counts open Call-backs.</li></ul>
      <h3>Questions for review</h3>
      <ul><li><span class="tag q">Q</span>Is the Scans | ReCapture switch the right entry point?</li>
        <li><span class="tag q">Q</span>Bulk Communication and List Configuration are left off mobile. Are they desktop-only?</li>
        <li><span class="tag q">Q</span>Should the quick views become saved views (for example, “My Callable Opportunities”)?</li></ul>`,
    detail: `
      <h2>Opportunity Detail</h2>
      <p class="lead">One Follow-Up work item. It starts with what needs to happen next and keeps the supporting information one tap away.</p>
      <h3>Try this</h3>
      <ul class="try">
        <li>Tap <b>Mark Addressed</b> on the Call-Back request.</li>
        <li>Tap a step in the Tire or Alignment card, such as <b>Recommendation</b>. The Tread Depth Scan opens.</li>
        <li>Tap <b>Share Quote</b>, then SMS. The message carries the locked report link; after sending, the Quote shows <b>Shared</b> on the card, in the timeline, and in the list.</li>
        <li>Open <b>Communication</b> in the jump bar and filter the history by SMS, Email, or Phone.</li>
        <li>Tap <b>Call</b> in the action bar and record the outcome. The Phone count updates everywhere.</li>
        <li>Switch <b>Scenario</b> to <b>All-green Tires</b> in the toolbar.</li>
      </ul>

      <h3>Where communication history is shown</h3>
      <ul><li><b>Send SMS, Send Email, and Make Call</b> each have two tabs: <b>Compose</b> (or Make Call) and <b>History</b>. History lists every SMS, Email, or call for the Vehicle Owner, newest first. Each entry shows the date, who it went to, who sent it, and whether it belongs to the <b>Current Opportunity</b> or another one.</li>
        <li><b>Opportunity Detail → Communication Log</b> shows the full history with All / SMS / Email / Phone filters.</li>
        <li>The <b>⋮</b> menu on a list card has a <b>Communication History</b> shortcut.</li></ul>
      <h3>SMS and Email content</h3>
      <ul><li>TraXtion prepares one message. There is no message-type choice; the user edits the greeting and main text.</li>
        <li>The <b>Vehicle Owner report link</b> opens the Vehicle Owner's report (results, Recommendations, and Quotes). It is locked, always sent, and counts toward the SMS length.</li>
        <li>The SMS opt-out text and the Email dealership footer are also locked and always sent.</li>
        <li>Sending marks any Quote in the report as Shared.</li></ul>
      <h3>Page order (same as web v007)</h3>
      <ul><li>Vehicle Owner context (sticky) → Call-Back Request → Tire and Alignment Opportunities → Actions → Current Visit → Alignment Quotes → Tire Quotes → Follow-Up Summary → Follow-Up Notes → Prior Visits → Prior Repair Orders → Activity Timeline → Communication Log</li></ul>
      <h3>Mobile adaptations</h3>
      <ul>
        <li><b>The sticky Vehicle Owner context</b> shrinks to one line once you scroll, so the name, vehicle, and plate stay visible.</li>
        <li><b>A section jump bar</b> saves long scrolling and shows which section you are in.</li>
        <li><b>Primary actions</b> (Call, SMS, Email, Note, Follow-Up Date) sit in a bottom bar on phones, within thumb reach. Tablets show the full-width Actions card plus quick icons in the sticky header.</li>
        <li><b>Tread Depth</b> is drawn natively as a 2 × 2 grid. Groove depth is to scale, so worn Tires have visibly shallow grooves.</li>
        <li><b>Repair Order lines</b> are stacked rows. Lines that show a Sale are highlighted green.</li>
        <li><b>Popups</b> (SMS, Email, Call, Notes, Share) open as bottom sheets on phones and centered dialogs on tablets. Their content follows the web popups: contact review, one prepared message, locked report link, Block / Do Not Call, Next Follow-Up, and History.</li>
      </ul>
      <h3>Rules kept from the web requirements</h3>
      <ul><li>Tire, Alignment, and the overall Follow-Up open and close independently.</li>
        <li>Changing the Follow-Up Date always needs a Reason. A Note is needed only for “Other”.</li>
        <li>Sending SMS or Email does not claim the Opportunity. Including a Quote marks it Shared.</li>
        <li>Mark Addressed records acknowledgement only.</li></ul>
      <h3>Questions for review</h3>
      <ul><li><span class="tag q">Q</span>The desktop design removed section links. Is the jump bar acceptable on mobile?</li>
        <li><span class="tag q">Q</span>Should Call open the device dialer directly, then ask for the outcome when the user returns?</li></ul>`
  };
  function renderNotes() {
    const n = $('#notes');
    n.innerHTML = `<div class="mini-tabs"><button data-note="list" class="${S.screen === 'list' ? 'active' : ''}">Follow-Up List</button><button data-note="detail" class="${S.screen === 'detail' ? 'active' : ''}">Opportunity Detail</button><button data-note="close" style="margin-left:auto" aria-label="Close notes">✕</button></div>${NOTES[S.noteView || S.screen]}`;
    $$('#notes .mini-tabs button').forEach((b) => b.classList.toggle('active', b.dataset.note === (S.noteView || S.screen)));
  }
  function setNotes(open) {
    S.notes = open; store.set('notes', open);
    $('#notes').hidden = !open; $('#notesBtn').setAttribute('aria-pressed', String(open));
    if (open) renderNotes();
    fit();
  }
  function setScreen(screen) {
    S.screen = screen; S.noteView = null;
    $$('#screenSeg button').forEach((b) => b.classList.toggle('active', b.dataset.screen === screen));
    if (S.notes) renderNotes();
  }

  /* ---------------------------------------------------------------- events */
  $('#deviceSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.mode = b.dataset.device; layout(); } });
  $('#zoomSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { S.zoom = b.dataset.zoom === 'fit' ? 'fit' : 1; layout(); } });
  $('#rotateBtn').addEventListener('click', () => { const k = kindA(); S.orient[k] = S.orient[k] === 'portrait' ? 'landscape' : 'portrait'; layout(); });
  $('#screenSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; setScreen(b.dataset.screen); send({ type: 'navigate', screen: b.dataset.screen }); });
  $('#scenario').addEventListener('change', (e) => { S.scenario = e.target.value; setScreen('detail'); send({ type: 'scenario', value: S.scenario }); });
  $('#notesBtn').addEventListener('click', () => setNotes(!S.notes));
  $('#notes').addEventListener('click', (e) => { const b = e.target.closest('[data-note]'); if (!b) return; if (b.dataset.note === 'close') setNotes(false); else { S.noteView = b.dataset.note; renderNotes(); } });
  $('#resetBtn').addEventListener('click', () => {
    S.scenario = 'red'; $('#scenario').value = 'red'; setScreen('list');
    [devA, devB].forEach((d) => {
      const f = d.querySelector('iframe'); if (!f.getAttribute('src')) return;
      const base = src(d.dataset.kind, d.dataset.orient).split('#')[0];
      f.setAttribute('src', `${base}&r=${Date.now()}#/list`); // cache-busting param forces a clean reload
    });
  });
  window.addEventListener('message', (e) => {
    const m = e.data; if (!m || m.source !== 'trx-app') return;
    if (m.type === 'route') setScreen(m.screen);
  });
  window.addEventListener('resize', fit);
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const map = { p: () => { S.mode = 'phone'; layout(); }, t: () => { S.mode = 'tablet'; layout(); }, b: () => { S.mode = 'both'; layout(); }, r: () => $('#rotateBtn').click(),
      l: () => $('#screenSeg [data-screen="list"]').click(), d: () => $('#screenSeg [data-screen="detail"]').click(), n: () => setNotes(!S.notes) };
    if (map[k]) { e.preventDefault(); map[k](); }
  });

  tick(); setInterval(tick, 15000);
  setScreen('list');
  layout();
  setNotes(S.notes);
})();
