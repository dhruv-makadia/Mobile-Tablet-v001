/* TraXtion ReCapture — Mobile & Tablet app mockup behaviour.
   Plain JavaScript, no libraries. All changes are kept in memory for the session. */
(() => {
  'use strict';
  const T = window.TRX;
  const ME = T.ME, ME_FIRST = ME.split(' ')[0];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const qs = new URLSearchParams(location.search);
  const inFrame = window.parent !== window || qs.has('frame');
  const rootStyle = document.documentElement.style;
  if (qs.has('sat')) rootStyle.setProperty('--sat', qs.get('sat') + 'px');
  if (qs.has('sab')) rootStyle.setProperty('--sab', qs.get('sab') + 'px');
  if (inFrame) document.body.classList.add('in-frame');

  /* ------------------------------------------------------------ state */
  const freshUi = () => ({ collapsed: new Set(), open: new Set(), allTimeline: false, ro: [], roAnd: false, compact: false, commF: 'all' });
  const S = {
    scenario: qs.get('scenario') === 'green' ? 'green' : 'red',
    opps: [], quick: 'all', search: '', sort: 'follow',
    f: { opp: [], and: false, owner: [], closed: false, dateMode: 'follow', from: '', to: '' },
    sel: null, ui: freshUi(), lastOpened: null
  };
  S.opps = T.build(S.scenario);

  /* ------------------------------------------------------------ helpers */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt = (d, o) => new Date(d).toLocaleDateString('en-US', o);
  const mdy = (d) => fmt(d, { month: 'numeric', day: 'numeric', year: '2-digit' });
  const mon = (d) => fmt(d, { month: 'short', day: 'numeric' });
  const monY = (d) => fmt(d, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dayDiff = (d) => Math.round((new Date(d).setHours(0, 0, 0, 0) - T.today.getTime()) / T.DAY);
  const rel = (d) => { const n = dayDiff(d); return n === 0 ? 'Today' : n === -1 ? 'Yesterday' : n === 1 ? 'Tomorrow' : mon(d); };
  const stamp = (d) => `${rel(d)} · ${time(d)}`;
  const isoDay = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const initials = (n) => n ? n.split(' ').map((p) => p[0]).slice(0, 2).join('') : '?';
  const firstName = (o) => o.name ? o.name.split(' ')[0] : 'there';
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const ic = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const byId = (id) => S.opps.find((o) => o.id === id);
  const cur = () => byId(S.sel);
  const isSplit = () => window.innerWidth >= 1024;
  const post = (msg) => { try { window.parent.postMessage({ source: 'trx-app', ...msg }, '*'); } catch (e) { /* standalone */ } };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const worst = (t) => t.includes('red') ? 'red' : t.includes('yellow') ? 'yellow' : 'green';
  function recLong(t) {
    const c = { red: 0, yellow: 0, green: 0 }; t.forEach((x) => c[x]++);
    const all = Object.keys(c).find((k) => c[k] === 4);
    if (all) return `All Tires ${cap(all)}`;
    return ['red', 'yellow', 'green'].filter((k) => c[k]).map((k) => `${c[k]} ${cap(k)}`).join(' · ');
  }
  function recShort(t) { const w = worst(t); const n = t.filter((x) => x === w).length; return n === 4 ? `All ${cap(w)}` : `${n} ${cap(w)}`; }
  const tireStack = (t, lg) => `<span class="tire-stack${lg ? ' lg' : ''}" aria-hidden="true">${t.map((c) => `<svg class="t-${c}"><use href="#i-tire"/></svg>`).join('')}</span>`;
  const alignIc = (bad, lg, size) => `<svg class="align-ic${lg ? ' lg' : ''}"${size ? ` style="width:${size[0]}px;height:${size[1]}px"` : ''} aria-hidden="true"><use href="#i-align-${bad ? 'bad' : 'ok'}"/></svg>`;

  function due(o) {
    const n = dayDiff(o.follow);
    if (n < 0) return { cls: 'overdue', top: `${plural(-n, 'day')} overdue`, label: mon(o.follow), long: `${monY(o.follow)} · ${plural(-n, 'day')} overdue` };
    if (n === 0) return { cls: '', top: 'Follow-up', label: 'Today', long: `Today · ${monY(o.follow)}` };
    if (n === 1) return { cls: '', top: 'Follow-up', label: 'Tomorrow', long: `Tomorrow · ${monY(o.follow)}` };
    return { cls: 'future', top: `In ${n} days`, label: mon(o.follow), long: `${monY(o.follow)} · in ${n} days` };
  }

  const FLY = {
    sms: { available: 'We are able to send SMS to this vehicle owner.', blocked: 'We are not allowed to send SMS to this vehicle owner.', unavailable: 'We do not have a phone number to use to send SMS to this vehicle owner.' },
    email: { available: 'We are able to send Email to this vehicle owner.', blocked: 'We are not allowed to send Email to this vehicle owner.', unavailable: 'We do not have an Email Address for this vehicle owner.' },
    call: { available: 'We are able to call this vehicle owner.', blocked: 'We are not allowed to call this vehicle owner.', unavailable: 'We do not have a phone number to call this vehicle owner.' }
  };
  const LABEL = { sms: 'SMS', email: 'Email', call: 'Phone', notes: 'Notes' };
  const cnt = (n) => n ? `<span class="cnt">${n > 9 ? '+' : n}</span>` : '';
  function commBtn(o, k) {
    if (k === 'notes') return `<button class="comm notes tap" data-act="notes" data-id="${o.id}" title="Open Note History or add a Follow-Up Note." aria-label="Follow-Up Notes, ${o.comm.notes.count}">${ic('notes')}${cnt(o.comm.notes.count)}</button>`;
    const c = o.comm[k];
    return `<button class="comm ${c.state} tap" data-act="${k}" data-id="${o.id}" title="${FLY[k][c.state]}" aria-label="${LABEL[k]} ${c.state}, ${c.count}">${ic(k)}${cnt(c.count)}</button>`;
  }
  const quotePill = (q) => q ? `<span class="pill ${q}"><i>“</i>${q === 'shared' ? 'Shared' : 'Created'}</span>` : '<span class="mx-none">—</span>';
  const salePill = (s) => s ? `<span class="pill sale-${s}"><i class="money">$</i>${s === 'green' ? 'Sold' : 'No sale'}</span>` : '<span class="mx-none">—</span>';
  const statusMark = (s) => s ? `<span class="mx-status ${s}"><span class="sbox">${s === 'closed' ? ic('check') : ''}</span>${cap(s)}</span>` : '<span class="mx-status"><span class="mx-none">—</span></span>';
  function ownerChip(o) {
    if (!o.owner) return `<span class="owner-chip unclaimed">Unclaimed</span>`;
    if (o.owner === ME) return `<span class="owner-chip mine">${ic('person')}Mine</span>`;
    return `<span class="owner-chip">${ic('person')}${esc(o.owner)}</span>`;
  }
  const avail = (k, s) => `<span class="avail ${s}">${k} ${s === 'available' ? 'Available' : s === 'blocked' ? 'Blocked' : 'Unavailable'}</span>`;

  /* ------------------------------------------------------------ list filtering */
  const QUICK = [
    { k: 'all', label: 'All' },
    { k: 'callback', label: 'Call-backs', dot: 'var(--red)', fn: (o) => o.callback },
    { k: 'overdue', label: 'Overdue', fn: (o) => dayDiff(o.follow) < 0 },
    { k: 'today', label: 'Due today', fn: (o) => dayDiff(o.follow) === 0 },
    { k: 'mine', label: 'Mine', fn: (o) => o.owner === ME },
    { k: 'unclaimed', label: 'Unclaimed', fn: (o) => !o.owner }
  ];
  const OPP_F = [['red', 'Has Red'], ['align', 'Has Align'], ['call', 'Can Call'], ['email', 'Can Email'], ['sms', 'Can SMS']];
  function baseFiltered(f = S.f) {
    const q = S.search.trim().toLowerCase();
    return S.opps.filter((o) => {
      if (!f.closed && o.closed) return false;
      if (q && ![o.name, o.plate, o.vehicle, o.vin, o.owner, o.advisor].join(' ').toLowerCase().includes(q)) return false;
      const day = isoDay(f.dateMode === 'visit' ? o.visitAt : o.follow);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
      if (f.opp.length) {
        const m = (x) => x === 'red' ? o.tires.includes('red') : x === 'align' ? o.align : o.comm[x].state === 'available';
        if (f.and ? !f.opp.every(m) : !f.opp.some(m)) return false;
      }
      if (f.owner.length && !f.owner.some((x) => x === 'mine' ? o.owner === ME : !o.owner)) return false;
      return true;
    });
  }
  function sortList(list) {
    const s = S.sort;
    return list.slice().sort((a, b) => s === 'visit' ? b.visitAt - a.visitAt
      : s === 'name' ? (a.name || '~').localeCompare(b.name || '~')
        : s === 'callback' ? (b.callback - a.callback) || (a.follow - b.follow)
          : (a.follow - b.follow) || (b.callback - a.callback));
  }
  function visible(f = S.f) { const base = baseFiltered(f); const q = QUICK.find((x) => x.k === S.quick); return sortList(q.fn ? base.filter(q.fn) : base); }
  const filterCount = (f = S.f) => f.opp.length + f.owner.length + (f.closed ? 1 : 0) + (f.from || f.to ? 1 : 0);

  /* ------------------------------------------------------------ list rendering */
  function mxRow(o, type) {
    const t = type === 'tire';
    const st = t ? o.tireStatus : o.alignStatus;
    const rec = t ? `${tireStack(o.tires)}<b class="${worst(o.tires)}">${recShort(o.tires)}</b>` : `${alignIc(o.align)}<b class="${o.align ? 'red' : 'green'}">${o.align ? 'Inspect' : 'OK'}</b>`;
    return `<div class="mx-row ${st ? '' : 'no-opp'}">
      <span class="mx-type">${t ? 'Tire' : 'Align'}</span>
      <button class="mx-rec tap" data-sec="recommendations" title="${t ? `Worst Tire Recommendation: ${worst(o.tires)}` : (o.align ? 'This vehicle should have an alignment check to verify it is out of alignment.' : 'It does not appear that this vehicle needs an alignment.')}">${rec}</button>
      <button class="tap" data-sec="${t ? 'tire-quote' : 'align-quote'}">${quotePill(t ? o.tireQuote : o.alignQuote)}</button>
      <button class="tap" data-sec="${(t ? o.tireSale : o.alignSale) ? 'ros' : 'current-ro'}">${salePill(t ? o.tireSale : o.alignSale)}</button>
      ${statusMark(st)}
    </div>`;
  }
  function cardHTML(o) {
    const d = due(o);
    const sel = isSplit() && S.sel === o.id;
    return `<article class="card opp-card tap ${o.closed ? 'is-closed' : ''} ${sel ? 'is-selected' : ''}" data-open="${o.id}" id="card-${o.id}">
      ${o.callback ? `<button class="cb-ribbon" data-sec="callback">${ic('call')}Call-back requested<span>${stamp(o.callbackAt)}</span>${ic('chev', 'ic-chev')}</button>` : ''}
      <div class="oc-head">
        <div class="oc-id">
          <button class="oc-name" data-sec="comms">${o.name ? esc(o.name) : '<em>Vehicle Owner unavailable</em>'}${o.closed ? '<span class="closed-tag">CLOSED</span>' : ''}</button>
          <div class="oc-veh"><button data-sec="visit">${esc(o.vehicle)}</button><span class="sep">|</span><button class="plate" data-sec="visit">${esc(o.plate)}</button></div>
        </div>
        <button class="due ${d.cls} tap" data-act="date" data-id="${o.id}" title="Change Follow-Up Date"><small>${d.top}</small><b>${d.label}</b></button>
      </div>
      <div class="matrix">
        <div class="mx-head"><span></span><span>Recommendation</span><span>Quote</span><span>Sale</span><span>Status</span></div>
        ${mxRow(o, 'tire')}${mxRow(o, 'align')}
      </div>
      <div class="oc-meta"><span>Visit <b>${mdy(o.visitAt)} · ${time(o.visitAt)}</b></span><span>SA <b>${esc(o.advisor || '—')}</b></span>${ownerChip(o)}</div>
      <div class="oc-foot">
        <div class="comms">${commBtn(o, 'sms')}${commBtn(o, 'email')}${commBtn(o, 'call')}${commBtn(o, 'notes')}</div>
        <button class="icon-plain tap" data-act="card-menu" data-id="${o.id}" aria-label="More actions">${ic('more')}</button>
      </div>
    </article>`;
  }
  function renderActiveFilters() {
    const f = S.f, out = [];
    f.opp.forEach((k) => out.push([`${OPP_F.find((x) => x[0] === k)[1]}`, `opp:${k}`]));
    if (f.opp.length > 1) out.push([f.and ? 'Match all' : 'Match any', 'and']);
    f.owner.forEach((k) => out.push([k === 'mine' ? 'Mine' : 'Unclaimed', `owner:${k}`]));
    if (f.closed) out.push(['Closed included', 'closed']);
    if (f.from || f.to) out.push([`${f.dateMode === 'visit' ? 'Visit' : 'Follow-Up'} ${f.from ? mdy(fromIso(f.from)) : '…'} – ${f.to ? mdy(fromIso(f.to)) : '…'}`, 'date']);
    $('#activeFilters').innerHTML = out.length ? out.map(([l, k]) => `<span class="af-chip">${esc(l)}<button class="tap" data-act="af-remove" data-k="${k}" aria-label="Remove ${esc(l)}">${ic('close')}</button></span>`).join('') + `<button class="af-clear tap" data-act="af-clear">Clear all</button>` : '';
    const n = filterCount(); const b = $('#filterBadge'); b.hidden = !n; b.textContent = n;
  }
  function renderList() {
    const base = baseFiltered();
    $('#quickChips').innerHTML = QUICK.map((q) => {
      const n = q.fn ? base.filter(q.fn).length : base.length;
      return `<button class="chip tap ${S.quick === q.k ? 'active' : ''}" data-act="quick" data-k="${q.k}" role="tab" aria-selected="${S.quick === q.k}">${q.dot ? `<span class="dot" style="background:${q.dot}"></span>` : ''}${q.label}<span class="n">${n}</span></button>`;
    }).join('');
    const list = visible();
    $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'Opportunity' : 'Opportunities'} · sorted by ${SORTS.find((s) => s.k === S.sort).short}`;
    $('#moduleBadge').textContent = S.opps.filter((o) => o.callback && !o.closed).length || '';
    renderActiveFilters();
    $('#cards').innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty"><div class="em-ic">${ic('search')}</div><h3>No Opportunities found</h3><p>Try a different search or clear the filters.</p><button class="btn btn-primary tap" data-act="af-clear">Clear search and filters</button></div>`;
    $('#listEnd').textContent = list.length ? 'No more Opportunities' : '';
    $('.clear-search').hidden = !S.search;
  }
  function skeleton() { $('#cards').innerHTML = '<div class="skel"></div>'.repeat(4); $('#quickChips').innerHTML = ''; $('#resultCount').textContent = 'Loading…'; }

  /* ------------------------------------------------------------ detail rendering */
  const JUMPS = [['opps', 'Overview'], ['visit', 'Visit'], ['align-quote', 'Quotes'], ['summary', 'Summary'], ['notes', 'Notes'], ['prior', 'Prior Visits'], ['ros', 'Repair Orders'], ['timeline', 'Timeline'], ['comms', 'Communication']];
  const SEC_MAP = { recommendations: ['visit', 'tread'], 'current-ro': ['visit', 'current-ro'] };

  function sec(id, title, body, o = {}) {
    const collapsed = S.ui.collapsed.has(id);
    return `<section class="card sec ${collapsed ? 'collapsed' : ''}" id="sec-${id}">
      <button class="sec-head tap" data-act="toggle-sec" data-sec="${id}" aria-expanded="${!collapsed}"><span class="sh-t"><span class="st">${title}</span>${o.sub ? `<span class="sub">${o.sub}</span>` : ''}</span>${o.right || ''}${ic('down', 'chev')}</button>
      <div class="sec-body">${body}</div></section>`;
  }
  function contactChip(o, k) {
    const st = o.comm[k].state;
    const val = k === 'call' ? o.phone : o.email;
    if (!val) return `<button class="contact-chip unavailable tap" data-act="${k}" data-id="${o.id}">${ic(k)}No ${k === 'call' ? 'phone number' : 'Email Address'}</button>`;
    return `<button class="contact-chip ${st === 'available' ? '' : st} tap" data-act="${k}" data-id="${o.id}">${ic(k)}${esc(val)}</button>`;
  }
  function stepsFor(o, type) {
    const sale = (s) => ({ label: 'Sale', val: s === 'green' ? 'Sold' : s === 'red' ? 'Not Sold' : 'Pending', cls: s === 'green' ? 'ok' : s === 'red' ? 'danger' : 'neutral', go: s ? 'ros' : 'current-ro' });
    if (type === 'tire') {
      const w = worst(o.tires), q = o.tireQuote;
      return [
        { label: 'Recommendation', val: recLong(o.tires), cls: w === 'red' ? 'danger' : w === 'yellow' ? 'warn' : 'ok', go: 'recommendations' },
        { label: 'Quote', val: q ? 'Created' : 'No Quote', cls: q ? 'ok' : 'neutral', go: 'tire-quote' },
        { label: 'Shared', val: q === 'shared' ? 'Shared' : q ? 'Not Shared' : 'Not Applicable', cls: q === 'shared' ? 'info' : q ? 'warn' : 'neutral', go: 'timeline' },
        sale(o.tireSale)
      ];
    }
    const q = o.alignQuote;
    return [
      { label: 'Recommendation', val: o.align ? 'Inspection Needed' : 'No Inspection Needed', cls: o.align ? 'danger' : 'ok', go: 'recommendations' },
      { label: 'Quote', val: q ? 'Created' : 'No Quote', cls: q ? 'ok' : 'neutral', go: 'align-quote' },
      { label: 'Shared', val: q === 'shared' ? 'Shared' : q ? 'Not Shared' : 'Not Applicable', cls: q === 'shared' ? 'info' : q ? 'warn' : 'neutral', go: 'timeline' },
      sale(o.alignSale)
    ];
  }
  function oppCard(o, type) {
    const t = type === 'tire', st = t ? o.tireStatus : o.alignStatus;
    return `<article class="card opp-card-d ${st === 'closed' ? 'is-closed' : ''}">
      <div class="od-head">${t ? tireStack(o.tires, true) : alignIc(o.align, false, [30, 34])}<h3>${t ? 'Tire' : 'Alignment'} Opportunity</h3>
        ${st ? `<label class="check closed-check"><input type="checkbox" data-chg="opp-status" data-type="${type}" ${st === 'closed' ? 'checked' : ''}><span class="box">${ic('check')}</span>Closed</label>` : `<span class="status-badge none">No Opportunity</span>`}</div>
      <div class="flow">${stepsFor(o, type).map((s) => `<button class="step ${s.cls} tap" data-act="go" data-sec="${s.go}"><span>${s.label}</span><strong>${s.val}</strong></button>`).join('')}</div>
    </article>`;
  }
  const ACTIONS = (o) => [
    { act: 'call', icon: 'call', label: 'Call', short: 'Call', state: o.comm.call.state, count: o.comm.call.count },
    { act: 'sms', icon: 'sms', label: 'Send SMS', short: 'SMS', state: o.comm.sms.state, count: o.comm.sms.count },
    { act: 'email', icon: 'email', label: 'Send Email', short: 'Email', state: o.comm.email.state, count: o.comm.email.count },
    { act: 'notes', icon: 'notes', label: 'Add Note', short: 'Note', state: '', count: o.comm.notes.count },
    { act: 'date', icon: 'cal', label: 'Follow-Up Date', short: 'Follow-Up', state: '', sub: due(o).label }
  ];
  const stateSub = (s) => s === 'blocked' ? 'Blocked' : s === 'unavailable' ? 'Unavailable' : '';
  const actionsCard = (o) => `<section class="card actions-card" id="sec-actions"><h3>Actions</h3><div class="actions-grid">${ACTIONS(o).map((a) => `<button class="act-tile ${a.state === 'available' ? '' : a.state} tap" data-act="${a.act}" data-id="${o.id}"><span class="ai">${ic(a.icon)}${cnt(a.count)}</span>${a.label}${(a.sub || stateSub(a.state)) ? `<span class="sub">${a.sub || stateSub(a.state)}</span>` : ''}</button>`).join('')}</div></section>`;
  const actionBarHTML = (o) => ACTIONS(o).map((a) => `<button class="tap ${a.state === 'available' ? '' : a.state}" data-act="${a.act}" data-id="${o.id}"><span class="ab-ic">${ic(a.icon)}${cnt(a.count)}</span>${a.short}</button>`).join('');

  function callbackHTML(o) {
    return `<section class="callout" id="sec-callback"><span class="co-ic">${ic('call')}</span><div class="co-body"><div class="eyebrow">Vehicle Owner request</div><h3>Call-Back Requested</h3><p>${esc(o.callbackText)} <b>${stamp(o.callbackAt)}</b></p>
      <div class="btn-row" style="margin-top:10px"><button class="btn btn-sm btn-danger tap" data-act="call" data-id="${o.id}">${ic('call')}Call now</button><button class="btn btn-sm btn-outline tap" data-act="address-callback">${ic('check')}Mark Addressed</button></div></div></section>`;
  }

  /* --- Current Visit */
  const GX = [52, 84, 116, 148];
  function treadSvg(c, v) {
    const col = { red: '#F7524B', yellow: '#FFD60A', green: '#00BF91' }[c];
    const grooves = v.map((x, j) => {
      const h = 3 + x * 1.15, y0 = 11, y1 = 11 + h, x0 = GX[j] - 5, x1 = GX[j] + 5;
      return `<rect x="${x0}" y="${y0 - 1}" width="10" height="${(h + 1).toFixed(1)}" fill="#fff"/><path d="M${x0} ${y0} V${(y1 - 3).toFixed(1)} Q${x0} ${y1.toFixed(1)} ${x0 + 3} ${y1.toFixed(1)} H${x1 - 3} Q${x1} ${y1.toFixed(1)} ${x1} ${(y1 - 3).toFixed(1)} V${y0}" fill="none" stroke="#59636b" stroke-width="1"/>`;
    }).join('');
    return `<svg class="tread-svg" viewBox="0 0 200 50" aria-hidden="true"><path d="M6 47 C11 25 20 17 36 16.5 H164 C180 17 189 25 194 47" fill="none" stroke="${col}" stroke-width="11"/><path d="M3 48 C8 22 18 11.5 36 11 H164 C182 11.5 192 22 197 48" fill="none" stroke="#59636b" stroke-width="1.1"/>${grooves}</svg>`;
  }
  function treadTile(o, i) {
    const c = o.tires[i], p = T.POS[i], v = o.depths[i];
    return `<div class="tread ${c}"><div class="tread-head"><b>${p.name}</b><span class="res ${c}">${cap(c)}</span></div>
      <div class="tread-orient"><span>${p.orient[0].toUpperCase()}</span><span>${p.orient[1].toUpperCase()}</span></div>${treadSvg(c, v)}
      <div class="tread-vals">${v.map((x, j) => `<span style="left:${GX[j] / 2}%">${x.toFixed(1)}</span>`).join('')}</div><div class="tread-unit">Groove depth in 32nds</div><p>${T.RESULT[c]}</p></div>`;
  }
  const treadBody = (o) => `<div class="sub-title">Recommendations and Measurements</div><div class="tread-grid">${o.tires.map((_, i) => treadTile(o, i)).join('')}</div>
    <div class="align-card ${o.align ? 'bad' : ''}">${alignIc(o.align, true)}<div><b>${o.align ? 'Alignment Inspection Recommended' : 'No Alignment Inspection Needed'}</b><span>Based on Tread Wear</span></div></div>`;
  const productHTML = (p) => `<div class="product ${p.selected ? 'selected' : ''}">${p.selected ? '<span class="sel-tag">SELECTED</span>' : ''}<img src="${p.img}" alt=""><div><h4>${esc(p.name)}</h4><p>${esc(p.spec)}</p>${p.meta ? `<p>${esc(p.meta)}</p>` : ''}<strong>${money(p.price)} each${p.qty ? ` · Qty ${p.qty}` : ''}</strong></div></div>`;
  const totals = (lines, total) => `<div class="totals">${lines.map((l) => `<div><span>${l[0]}</span><b>${money(l[1])}</b></div>`).join('')}<div class="grand"><span>Quote Total</span><span>${money(total)}</span></div></div>`;
  function tireQuoteBlock(o, compact) {
    const q = o.tq;
    return `<div class="quote-block"><div class="qb-head"><div><b>Current Visit · ${monY(o.visitAt)}</b><small>Quote ${q.id} · Created ${mon(q.created)} · ${esc(q.by)}</small></div><span class="amt">${money(q.total)}</span></div>
      <div class="products">${q.products.filter((p) => !compact || p.selected).map(productHTML).join('')}</div>${totals(q.lines, q.total)}
      ${compact ? '' : `<div class="quote-actions"><button class="btn btn-outline btn-sm tap" data-act="modify-quote" data-type="tire">${ic('edit')}Modify</button><button class="btn btn-outline btn-sm tap" data-act="print-quote" data-type="tire">${ic('print')}Print</button><button class="btn btn-primary btn-sm tap" data-act="share-quote" data-type="tire">${ic('share')}${o.tireQuote === 'shared' ? 'Share again' : 'Share Quote'}</button></div>`}</div>`;
  }
  function alignQuoteBlock(o, compact) {
    const q = o.aqd;
    return `<div class="quote-block"><div class="qb-head"><div><b>Current Visit · ${monY(o.visitAt)}</b><small>Quote ${q.id} · Created ${mon(q.created)} · ${esc(q.by)}</small></div><span class="amt">${money(q.total)}</span></div>
      <div class="svc">${alignIc(true, true)}<div><h4>${q.service}</h4><p>${q.desc}</p></div></div>${totals(q.lines, q.total)}
      ${compact ? '' : `<div class="quote-actions"><button class="btn btn-outline btn-sm tap" data-act="modify-quote" data-type="align">${ic('edit')}Modify</button><button class="btn btn-outline btn-sm tap" data-act="print-quote" data-type="align">${ic('print')}Print</button><button class="btn btn-primary btn-sm tap" data-act="share-quote" data-type="align">${ic('share')}${o.alignQuote === 'shared' ? 'Share again' : 'Share Quote'}</button></div>`}</div>`;
  }
  function roFor(o) {
    if (!o.tireSale && !o.alignSale) return null;
    const lines = [];
    if (o.tireSale) lines.push(o.tireSale === 'green' ? ['1', 'CTIRE4', 'CP', 160, 756, 'Continental CrossContact LX25', 'Replacement', 4, 1] : ['1', 'ROT', 'CP', 24.95, 0, 'Tire rotation', 'Maintenance', 1]);
    if (o.alignSale) lines.push(o.alignSale === 'green' ? ['2', '4WA', 'CP', 129.95, 0, 'Four-wheel alignment', 'Alignment', 1, 1] : ['2', 'MPI', 'INC', 0, 0, 'Multipoint inspection', 'Inspection', 1]);
    lines.push(['3', 'OIL', 'CP', 39.95, 28.40, 'Oil and filter service', 'Maintenance', 1]);
    const n = `RO ${o.visitId + 436000}`;
    const note = [o.tireSale === 'green' ? 'Tire Sale identified' : o.tireSale ? 'No Tire Sale' : '', o.alignSale === 'green' ? 'Alignment Sale identified' : o.alignSale ? 'No Alignment Sale' : ''].filter(Boolean).join(' · ');
    return { no: n, meta: `${monY(o.visitAt)} · ${o.odo.toLocaleString()} miles · ${o.advisor || 'Service Advisor'}`, tire: o.tireSale === 'green', align: o.alignSale === 'green', state: 'Closed', note, lines };
  }
  const roLines = (r) => `<div class="inference"><b>${esc(r.note)}</b><span>TraXtion interpretation of DMS data</span></div>${r.lines.map((l) => `<div class="ro-line ${l[8] ? 'sale' : ''}"><div class="rl-top"><b>${l[1]}</b><span>Line ${l[0]} · ${l[2]}</span><span class="qty">Qty ${l[7]}</span></div><div class="rl-desc">${esc(l[5])} · ${l[6]}</div><div class="rl-amt">Labor ${money(l[3])} · Parts ${money(l[4])}</div></div>`).join('')}`;
  function subs(o) {
    const w = worst(o.tires), ro = roFor(o);
    const list = [
      { id: 'tire-quote-v', icon: ic('tire'), title: 'Tire Quote', small: o.tireQuote ? `Quote ${o.tq.id} · ${esc(o.tq.by)}` : 'No Tire Quote for this Visit', right: o.tireQuote ? `${money(o.tq.total)}<br>${o.tireQuote === 'shared' ? 'Shared' : 'Not Shared'}` : '—', body: o.tireQuote ? tireQuoteBlock(o, true) : `<div class="empty-inline"><b>No Tire Quote Created</b>${w === 'green' ? 'All Tires are Green for the Current Visit. ' : ''}Previous Tire Quotes remain available in Tire Quotes.</div>` },
      { id: 'align-quote-v', icon: alignIc(true, false, [18, 20]), title: 'Alignment Quote', small: o.alignQuote ? `Quote ${o.aqd.id} · ${esc(o.aqd.by)}` : 'No Alignment Quote for this Visit', right: o.alignQuote ? `${money(o.aqd.total)}<br>${o.alignQuote === 'shared' ? 'Shared' : 'Not Shared'}` : '—', body: o.alignQuote ? alignQuoteBlock(o, true) : '<div class="empty-inline"><b>No Alignment Quote Created</b>No Alignment Quote exists for the Current Visit.</div>' },
      { id: 'tread', icon: ic('scan'), title: 'Tread Depth Scan', small: `TreadSpec · Scan ${58384200 + o.id} · ${time(o.visitAt)}`, right: recLong(o.tires), body: treadBody(o) },
      { id: 'wheel', icon: ic('tire'), title: 'WheelSpec Scan', small: `Scan ${58384207 + o.id}`, right: 'Four sidewalls identified', body: '<div class="placeholder"><span class="ph-tag">PLACEHOLDER</span><b>WheelSpec detail</b>Sidewall images, OCR results, Tire identification, and ordering support will appear here.</div>' },
      o.scans > 2 ? { id: 'damage', icon: ic('car'), title: 'DamageSpeX Scan', small: `Scan ${58384211 + o.id}`, right: 'No new damage', body: '<div class="placeholder"><span class="ph-tag">PLACEHOLDER</span><b>DamageSpeX detail</b>SpinFrame Vehicle images with the location and type of detected damage will appear here. Damage becomes a third Recommendation and Quote category alongside Tire and Alignment. This Visit has no new damage, so no Damage Recommendation was created.</div>' } : null,
      { id: 'current-ro', icon: ic('doc'), title: 'Associated RO', small: ro ? `${ro.no} · ${ro.state}` : 'Current Visit · Sale results pending', right: ro ? 'Matched' : 'Not yet available', body: ro ? roLines(ro) : '<div class="ro-empty-state"><span class="ro-badge">RO</span><div><b>No Associated RO Identified Yet</b><p class="field-hint" style="margin-top:2px">TraXtion has not matched a Repair Order to this Visit. Tire and Alignment Sale results remain Pending until a matching RO is received or a Sale is recorded directly.</p></div></div>' }
    ].filter(Boolean);
    return list.map((s) => `<div class="vsub ${S.ui.open.has(s.id) ? 'open' : ''}" id="sub-${s.id}"><button class="sub-head tap" data-act="toggle-sub" data-sub="${s.id}"><span class="sh-ic">${s.icon}</span><span class="sh-txt"><b>${s.title}</b><small>${s.small}</small></span><span class="sh-right">${s.right}</span>${ic('down', 'chev')}</button><div class="sub-body">${s.body}</div></div>`).join('');
  }
  function visitSec(o) {
    const kv = [['Vehicle', `${o.vehicle} ${o.trim}`], ['VIN', o.vin], ['Plate', o.plate], ['Odometer', `${o.odo.toLocaleString()} miles`], ['Service Advisor', o.advisor || '—'], ['Visit ID', o.visitId]];
    const body = `<div class="visit-wrap"><img class="visit-photo" src="assets/img/vehicle-scan.jpg" alt="Vehicle image captured during the Visit"><div class="kv">${kv.map(([k, v]) => `<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div></div><div class="sub-list">${subs(o)}</div>`;
    return sec('visit', 'Current Visit', body, { sub: `${monY(o.visitAt)} · ${time(o.visitAt)} · ${o.scans} Scans` });
  }
  function prevBlock(key, head, small, right, body) {
    return `<div class="prior ${S.ui.open.has(key) ? 'open ro' : 'ro'}" id="x-${key}"><button class="ro-head tap" data-act="toggle-open" data-key="${key}"><div><b>${head}</b><small>${small}</small></div><span class="ro-state">${right}</span>${ic('down', 'chev')}</button><div class="ro-body">${body}</div></div>`;
  }
  function tireQuoteSec(o) {
    const w = worst(o.tires);
    const badge = o.tireQuote ? `<span class="status-badge ${o.tireQuote === 'shared' ? 'shared' : ''}">${o.tireQuote === 'shared' ? 'Shared' : 'Not Shared'}</span>` : '<span class="status-badge none">No Current Quote</span>';
    const current = o.tireQuote ? tireQuoteBlock(o, false) : `<div class="empty-inline"><b>No Tire Quote Created for the Current Visit</b>${w === 'green' ? 'All Tires are Green and no Tire Replacement Recommendation was made. ' : ''}Previous Tire Quotes remain available below.</div>${w !== 'green' ? `<button class="btn btn-primary btn-sm tap" style="margin-top:10px" data-act="modify-quote" data-type="tire">${ic('plus')}Create Tire Quote</button>` : ''}`;
    const prev = T.PRIOR_TIRE_QUOTES.map((p, i) => prevBlock(`ptq${i}`, p.visit, `Quote ${p.id} · ${p.by}`, `${money(p.total)}<br>${p.status}`,
      `<div class="product selected" style="margin-top:4px"><img src="${p.img}" alt=""><div><h4>${p.product}</h4><p>${p.spec}</p><strong>${money(p.each)} each · Qty ${p.qty}</strong></div></div>${totals(p.lines, p.total).replace('class="totals"', 'class="totals" style="margin:8px 0 0"')}`)).join('');
    return sec('tire-quote', 'Tire Quotes', current + `<div class="prev-title">Previous Quotes by Visit</div>` + prev, { right: badge });
  }
  function alignQuoteSec(o) {
    const badge = o.alignQuote ? `<span class="status-badge ${o.alignQuote === 'shared' ? 'shared' : ''}">${o.alignQuote === 'shared' ? 'Shared' : 'Not Shared'}</span>` : '<span class="status-badge none">No Current Quote</span>';
    const current = o.alignQuote ? alignQuoteBlock(o, false) : `<div class="empty-inline"><b>No Alignment Quote for the Current Visit</b>${o.align ? 'An Alignment inspection is recommended. Create a Quote to share it with the Vehicle Owner.' : 'The wear pattern does not currently indicate an Alignment inspection.'}</div>${o.align ? `<button class="btn btn-primary btn-sm tap" style="margin-top:10px" data-act="modify-quote" data-type="align">${ic('plus')}Create Alignment Quote</button>` : ''}`;
    const prev = T.PRIOR_ALIGN_QUOTES.map((p, i) => prevBlock(`paq${i}`, p.visit, `Quote ${p.id} · ${p.by}`, `${money(p.total)}<br>${p.status}`, `<div class="svc" style="padding:4px 0">${alignIc(true, true)}<div><h4>Four-Wheel Alignment Service</h4><p>Inspection and four-wheel adjustment.</p></div></div>${totals(p.lines, p.total).replace('class="totals"', 'class="totals" style="margin:8px 0 0"')}`)).join('');
    return sec('align-quote', 'Alignment Quotes', current + `<div class="prev-title">Previous Quotes by Visit</div>` + prev, { right: badge });
  }
  function summarySec(o) {
    const d = due(o);
    const otherOwner = o.owner && o.owner !== ME;
    const rows = [
      `<div class="sum-row"><span class="sr-ic">${ic('flag')}</span><span class="sr-txt"><span>Follow-Up</span><strong>${o.closed ? 'Closed' : 'Open'}</strong><small>Shared work item for Tire and Alignment</small></span><label class="check closed-check"><input type="checkbox" data-chg="overall" ${o.closed ? 'checked' : ''}><span class="box">${ic('check')}</span>Closed</label></div>`,
      `<div class="sum-row"><span class="sr-ic">${ic('person')}</span><span class="sr-txt"><span>Opportunity Owner</span><strong>${o.owner ? esc(o.owner) : 'Unclaimed'}</strong>${otherOwner ? '<small>Claimed by another user · transfer is not supported</small>' : ''}</span><label class="check" style="gap:8px">Mine<span class="switch"><input type="checkbox" data-chg="mine" ${o.owner === ME ? 'checked' : ''} ${otherOwner ? 'disabled' : ''}><i></i></span></label></div>`,
      `<div class="sum-row"><span class="sr-ic">${ic('cal')}</span><span class="sr-txt"><span>Follow-Up Date</span><strong class="date-strong ${d.cls}">${d.long}</strong></span><button class="btn btn-outline btn-sm tap" data-act="date" data-id="${o.id}">Change</button></div>`,
      `<div class="sum-row"><span class="sr-ic">${ic('scan')}</span><span class="sr-txt"><span>Visit Date</span><strong>${monY(o.visitAt)} · ${time(o.visitAt)}</strong><small>${o.scans} Scans · Visit ${o.visitId}</small></span><button class="icon-plain tap" data-act="go" data-sec="visit" aria-label="Open Visit">${ic('chev', 'ic-chev')}</button></div>`,
      `<div class="sum-row"><span class="sr-ic">${ic('call')}</span><span class="sr-txt"><span>Contact</span><strong>${esc(o.phone || 'No phone number')}</strong><small>${esc(o.email || 'No Email Address')}</small><div>${avail('Call', o.comm.call.state)}${avail('SMS', o.comm.sms.state)}${avail('Email', o.comm.email.state)}</div></span></div>`
    ];
    return sec('summary', 'Follow-Up Summary', `<div class="sum-list">${rows.join('')}</div>`);
  }
  const noteHTML = (n, i) => `<div class="note ${n.fresh ? 'fresh' : ''}"><div class="note-meta"><b>${esc(n.author)}</b><span>${monY(n.at)} · ${time(n.at)}</span></div>${n.text ? `<p>${esc(n.text)}</p>` : ''}${n.reason ? `<span class="reason">Follow-Up Date → ${mon(n.newDate)} · ${esc(n.reason)}</span>` : ''}</div>`;
  function notesSec(o) {
    const more = o.comm.notes.count > o.notesList.length ? `<p class="field-hint" style="margin:10px 0 0">Showing the ${o.notesList.length} most recent of ${o.comm.notes.count} Notes.</p>` : '';
    const body = `<div class="sec-tools"><button class="btn btn-primary btn-sm tap" data-act="notes" data-id="${o.id}">${ic('plus')}Add Note</button></div>${o.notesList.length ? o.notesList.map(noteHTML).join('') : '<div class="empty-inline"><b>No Follow-Up Notes yet</b>Notes you add appear here and in the Activity Timeline.</div>'}${more}`;
    return sec('notes', 'Follow-Up Notes', body, { sub: plural(o.comm.notes.count, 'Note') });
  }
  function priorSec() {
    const body = T.PRIOR_VISITS.map((v, i) => prevBlock(`pv${i}`, v.when, `Visit ${v.id} · ${v.scans} Scans · ${v.ro}`, '', `<div class="kv" style="margin-top:4px"><div><span>Odometer</span><strong>${v.odo}</strong></div><div><span>Service Advisor</span><strong>${v.advisor}</strong></div><div><span>Tread Depth</span><strong>${v.tread}</strong></div><div><span>Quotes</span><strong>${v.quotes}</strong></div></div><div class="placeholder" style="margin-top:12px"><span class="ph-tag">PLACEHOLDER</span><b>Prior Visit Scans</b>Individual Scan details and the Associated RO for this Visit.</div>`)).join('');
    return sec('prior', 'Prior Visits', body, { sub: plural(T.PRIOR_VISITS.length, 'Visit') });
  }
  function roSec() {
    const f = S.ui.ro, and = S.ui.roAnd;
    const shown = T.ROS.filter((r) => !f.length || (and ? f.every((k) => r[k]) : f.some((k) => r[k])));
    const filter = `<div class="ro-filter"><span class="lbl">Sale</span><button class="chip tap ${f.includes('tire') ? 'active' : ''}" data-act="ro-chip" data-k="tire">Has Tire</button><button class="chip tap ${f.includes('align') ? 'active' : ''}" data-act="ro-chip" data-k="align">Has Alignment</button><div class="seg" style="margin-left:auto"><button class="tap ${!and ? 'active' : ''}" data-act="ro-mode" data-v="0">OR</button><button class="tap ${and ? 'active' : ''}" data-act="ro-mode" data-v="1">AND</button></div></div>`;
    const list = shown.length ? shown.map((r, i) => {
      const key = `ro-${r.no}`, open = S.ui.open.has(key) || (!S.ui.open.has('ro-init') && i === 0 && !f.length);
      return `<div class="ro ${open ? 'open' : ''}" id="x-${key}"><button class="ro-head tap" data-act="toggle-open" data-key="${key}"><div><b>${r.no}</b><small>${r.meta}</small><div class="ro-flags"><span class="flag ${r.tire ? 'yes' : ''}">${r.tire ? '✓' : '✕'} Tire Sale</span><span class="flag ${r.align ? 'yes' : ''}">${r.align ? '✓' : '✕'} Alignment Sale</span></div></div><span class="ro-state">${r.state}</span>${ic('down', 'chev')}</button><div class="ro-body">${roLines(r)}</div></div>`;
    }).join('') : '<div class="empty-inline">No Repair Orders match the selected Sale filters.</div>';
    return sec('ros', 'Prior Repair Orders', filter + list, { sub: 'Read only · newest first' });
  }
  const TL_IC = { callback: 'call', quote: 'doc', share: 'share', note: 'notes', sms: 'sms', email: 'email', phone: 'call', claim: 'person', scan: 'scan', ro: 'doc', addressed: 'check', status: 'flag', date: 'cal' };
  function timelineSec(o) {
    const all = o.timeline, list = S.ui.allTimeline ? all : all.slice(0, 6);
    const body = `<ol class="timeline">${list.map((e) => `<li class="tl ${e.fresh ? 'fresh' : ''}"><span class="tl-ic ${e.type}">${ic(TL_IC[e.type] || 'history')}</span><div class="tl-txt"><strong>${esc(e.title)}</strong>${e.text ? `<p>${esc(e.text)}</p>` : ''}<div class="tl-meta"><span>${stamp(e.at)} · ${esc(e.actor)}</span><span class="scope ${e.scope}">${e.scope}</span>${e.link ? `<button class="tl-link tap" data-act="go" data-sec="${e.link[0]}">${e.link[1]}</button>` : ''}</div></div></li>`).join('')}</ol>${all.length > 6 && !S.ui.allTimeline ? `<button class="btn btn-outline btn-sm show-more tap" data-act="tl-more">Show all ${all.length} events</button>` : ''}`;
    return sec('timeline', 'Activity Timeline', body, { sub: 'Newest first' });
  }
  function commsSec(o) {
    const f = S.ui.commF || 'all';
    const n = (t) => o.comms.filter((c) => t === 'all' || c.type === t).length;
    const contact = `<div class="contact-grid">
      <div class="contact-line"><span class="sr-ic">${ic('person')}</span><div><span>Name</span><strong>${esc(o.name || 'Vehicle Owner unavailable')}</strong></div></div>
      <div class="contact-line"><span class="sr-ic">${ic('call')}</span><div><span>Phone Number</span><strong>${esc(o.phone || '—')}</strong>${avail('Call', o.comm.call.state)}${avail('SMS', o.comm.sms.state)}</div></div>
      <div class="contact-line"><span class="sr-ic">${ic('email')}</span><div><span>Email Address</span><strong>${esc(o.email || '—')}</strong>${avail('Email', o.comm.email.state)}</div></div>
      <div class="contact-line"><span class="sr-ic">${ic('pin')}</span><div><span>Address</span><strong>${esc(o.address || '—')}</strong></div></div></div>
      <button class="btn btn-outline btn-sm tap" style="margin-top:12px" data-act="edit-owner">${ic('edit')}Edit Vehicle Owner</button>`;
    const chips = `<div class="chips hscroll comm-filter">${[['all', 'All'], ['sms', 'SMS'], ['email', 'Email'], ['phone', 'Phone']].map(([k, l]) => `<button class="chip tap ${f === k ? 'active' : ''}" data-act="comm-filter" data-k="${k}">${l}<span class="n">${n(k)}</span></button>`).join('')}</div>`;
    const list = o.comms.filter((c) => f === 'all' || c.type === f);
    const open = f === 'all' ? '' : `<button class="btn btn-outline btn-sm tap" style="margin-top:10px" data-act="${f === 'phone' ? 'call' : f}" data-id="${o.id}" data-tab="history">${ic('history')}Open ${f === 'phone' ? 'Phone' : f === 'sms' ? 'SMS' : 'Email'} History</button>`;
    const hist = (list.length ? list.map(histItem).join('') : '<div class="empty-inline">No communications of this type yet.</div>') + open;
    return sec('comms', 'Communication Log', contact + `<div class="history"><div class="prev-title">Communication History</div><p class="field-hint" style="margin:-4px 0 8px">Every SMS, Email, and call with this Vehicle Owner, newest first, including other Opportunities.</p>${chips}${hist}</div>`, { sub: `${n('sms')} SMS · ${n('email')} Email · ${n('phone')} calls` });
  }
  function detailHTML(o) {
    return `<div class="detail-top ${S.ui.compact ? 'compact' : ''}" id="detailTop">
        <div class="card ctx"><div class="ctx-row"><div class="ctx-avatar">${esc(initials(o.name))}</div><div class="ctx-text"><div class="eyebrow">Vehicle Owner</div><h3>${o.name ? esc(o.name) : 'Vehicle Owner unavailable'}</h3><p>${esc(o.vehicle)} · ${esc(o.plate)}</p></div>
          <div class="ctx-actions">${commBtn(o, 'call')}${commBtn(o, 'sms')}${commBtn(o, 'email')}${commBtn(o, 'notes')}</div></div>
          <div class="ctx-contacts">${contactChip(o, 'call')}${contactChip(o, 'email')}</div></div>
        <nav class="jump hscroll" id="jump" aria-label="Jump to section">${JUMPS.map((j) => `<button class="tap" data-act="jump" data-sec="${j[0]}">${j[1]}</button>`).join('')}</nav>
      </div>
      <div class="detail-body">
        ${o.callback ? callbackHTML(o) : ''}
        <section class="opp-grid" id="sec-opps">${oppCard(o, 'tire')}${oppCard(o, 'align')}</section>
        ${actionsCard(o)}${visitSec(o)}${alignQuoteSec(o)}${tireQuoteSec(o)}${summarySec(o)}${notesSec(o)}${priorSec(o)}${roSec(o)}${timelineSec(o)}${commsSec(o)}
      </div>`;
  }
  function renderDetail(reset) {
    const o = cur(), sc = $('#detailScroll');
    const keep = reset ? 0 : sc.scrollTop;
    if (!o) {
      $('#detailContent').innerHTML = `<div class="split-empty"><div><div class="em-ic">${ic('scan')}</div><h3>Nothing selected</h3><p>Select an Opportunity from the Follow-Up List to see its Opportunity Detail.</p></div></div>`;
      $('#actionBar').classList.add('hidden-bar'); $('#detailMenuBtn').hidden = true; return;
    }
    $('#detailMenuBtn').hidden = false; $('#actionBar').classList.remove('hidden-bar');
    $('#detailContent').innerHTML = detailHTML(o);
    $('#actionBar').innerHTML = actionBarHTML(o);
    sc.scrollTop = keep;
    spy();
  }
  const renderAll = () => { renderList(); renderDetail(false); };

  /* ------------------------------------------------------------ detail scrolling */
  const secEl = (id) => document.getElementById('sec-' + id);
  let drag = null;
  function onDetailScroll() {
    const sc = $('#detailScroll'), top = $('#detailTop');
    if (!top) return;
    const st = sc.scrollTop;
    if (!S.ui.compact && st > 90) {
      const h = top.offsetHeight; top.classList.add('compact'); S.ui.compact = true;
      const dlt = h - top.offsetHeight; sc.scrollTop = st - dlt; if (drag && drag.v === sc) drag.st -= dlt;
    } else if (S.ui.compact && st < 20) {
      // Back at the top: expand in place (no scroll compensation) so the first section is fully visible.
      top.classList.remove('compact'); S.ui.compact = false;
    }
    spy();
  }
  function spy() {
    const sc = $('#detailScroll'), top = $('#detailTop'), jump = $('#jump');
    if (!top || !jump) return;
    const line = sc.getBoundingClientRect().top + top.offsetHeight + 30;
    let on = 'opps';
    JUMPS.forEach(([id]) => { const el = secEl(id); if (el && el.getBoundingClientRect().top <= line) on = id; });
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4 && sc.scrollTop > 0) on = JUMPS[JUMPS.length - 1][0];
    $$('button', jump).forEach((b) => {
      const active = b.dataset.sec === on;
      if (active && !b.classList.contains('active')) {
        b.classList.add('active');
        const l = b.offsetLeft - 12, r = b.offsetLeft + b.offsetWidth + 12;
        if (l < jump.scrollLeft) jump.scrollTo({ left: l, behavior: 'smooth' });
        else if (r > jump.scrollLeft + jump.clientWidth) jump.scrollTo({ left: r - jump.clientWidth, behavior: 'smooth' });
      } else if (!active) b.classList.remove('active');
    });
  }
  function goSection(key, smooth = true) {
    if (!cur()) return;
    const [secId, subId] = SEC_MAP[key] || [key];
    if (secId === 'callback' && !secEl('callback')) return goSection('opps', smooth);
    S.ui.collapsed.delete(secId);
    if (subId) S.ui.open.add(subId);
    renderDetail(false);
    const sc = $('#detailScroll'), top = $('#detailTop');
    const target = subId ? document.getElementById('sub-' + subId) : secEl(secId);
    if (!target) return;
    const offset = () => target.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    if (secId === 'opps' || secId === 'callback') { top.classList.remove('compact'); S.ui.compact = false; }
    else if (offset() - top.offsetHeight > 120 && !S.ui.compact) { top.classList.add('compact'); S.ui.compact = true; }
    const y = Math.max(0, offset() - top.offsetHeight - 10);
    sc.scrollTo({ top: secId === 'opps' || secId === 'callback' ? 0 : y, behavior: smooth ? 'smooth' : 'auto' });
    target.classList.remove('target-flash'); void target.offsetWidth; target.classList.add('target-flash');
  }

  /* ------------------------------------------------------------ routing */
  function parseHash() { const m = location.hash.match(/^#\/opp\/(\d+)(?:\/([\w-]+))?/); return m ? { screen: 'detail', id: +m[1], sec: m[2] || null } : { screen: 'list' }; }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function route() {
    const r = parseHash();
    const app = $('#app');
    if (r.screen === 'detail' && byId(r.id)) {
      const changed = S.sel !== r.id;
      if (changed) { S.sel = r.id; S.ui = freshUi(); }
      renderDetail(changed);
      app.classList.add('show-detail');
      renderList();
      S.lastOpened = r.id;
      // Opening a new Opportunity lands directly on the section; in-page jumps scroll smoothly.
      if (r.sec) setTimeout(() => goSection(r.sec, !changed), 30);
    } else {
      const was = app.classList.contains('show-detail');
      app.classList.remove('show-detail');
      if (!isSplit() && was && S.lastOpened) {
        setTimeout(() => { const c = document.getElementById('card-' + S.lastOpened); if (c) { c.scrollIntoView({ block: 'nearest' }); c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 1300); } }, 340);
      }
      renderDetail(false);
      renderList();
    }
    post({ type: 'route', screen: r.screen === 'detail' && byId(r.id) ? 'detail' : 'list', id: S.sel });
  }
  const openOpp = (id, sec) => go(`#/opp/${id}${sec ? '/' + sec : ''}`);

  /* ------------------------------------------------------------ sheets, dialogs, toast */
  const sheet = $('#bsheet'), overlay = $('#overlay');
  let closeGuard = null;
  const requestClose = () => (closeGuard ? closeGuard() : closeSheet());
  function openSheet({ title, body = '', foot = '', tall = false, onMount, guard = null }) {
    sheet.onclick = null; sheet.onchange = null; sheet.oninput = null; sheet.onmousedown = null; closeGuard = guard;
    $('#bsTitle').textContent = title; $('#bsBody').innerHTML = body; $('#bsFoot').innerHTML = foot;
    sheet.classList.toggle('tall', tall);
    sheet.style.transform = '';
    sheet.hidden = false; overlay.hidden = false; void sheet.offsetWidth;
    sheet.classList.add('show'); overlay.classList.add('show');
    $('#bsBody').scrollTop = 0;
    if (onMount) onMount();
  }
  function closeSheet() {
    sheet.classList.remove('show');
    if ($('#dialog').hidden) overlay.classList.remove('show');
    setTimeout(() => { if (!sheet.classList.contains('show')) { sheet.hidden = true; if ($('#dialog').hidden) overlay.hidden = true; } }, 320);
  }
  function confirmDialog({ title, html, ok, okCls = 'btn-primary', onOk }) {
    const d = $('#dialog');
    d.innerHTML = `<h3>${title}</h3>${html}<div class="btn-row"><button class="btn btn-outline tap" data-dlg="cancel">Cancel</button><button class="btn ${okCls} tap" data-dlg="ok">${ok}</button></div>`;
    d.hidden = false; overlay.hidden = false; void d.offsetWidth; d.classList.add('show'); overlay.classList.add('show');
    d.onclick = (e) => { const b = e.target.closest('[data-dlg]'); if (!b) return; closeDialog(); if (b.dataset.dlg === 'ok') onOk(); };
  }
  function closeDialog() {
    const d = $('#dialog'); d.classList.remove('show');
    if (!sheet.classList.contains('show')) overlay.classList.remove('show');
    setTimeout(() => { d.hidden = true; if (!sheet.classList.contains('show')) overlay.hidden = true; }, 220);
  }
  overlay.addEventListener('click', () => { if (!$('#dialog').hidden) closeDialog(); else requestClose(); });
  let toastT;
  function toast(msg, icon = 'check') {
    const t = $('#toast'); t.innerHTML = `${ic(icon)}<span>${msg}</span>`; t.hidden = false; void t.offsetWidth; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('show'); setTimeout(() => { t.hidden = true; }, 260); }, 2600);
  }
  /* drag the sheet handle down to dismiss (phone) */
  (() => {
    let sd = null;
    sheet.addEventListener('pointerdown', (e) => {
      if (window.innerWidth >= 600 || !e.target.closest('.bs-handle, .bs-head') || e.target.closest('button')) return;
      sd = { y: e.clientY, dy: 0 }; sheet.style.transition = 'none'; sheet.setPointerCapture(e.pointerId);
    });
    sheet.addEventListener('pointermove', (e) => { if (!sd) return; sd.dy = Math.max(0, e.clientY - sd.y); sheet.style.transform = `translateY(${sd.dy}px)`; });
    const end = () => { if (!sd) return; sheet.style.transition = ''; if (sd.dy > 90) { sheet.style.transform = ''; requestClose(); } else sheet.style.transform = ''; sd = null; };
    sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
  })();

  /* ------------------------------------------------------------ Follow-Up Date helpers (shared by every sheet) */
  const REASONS = ['Vehicle Owner Requested Later Follow-Up', 'Unable to Reach Vehicle Owner', 'Awaiting Vehicle Owner Decision', 'Quote Being Prepared', 'Quote Shared—Awaiting Response', 'Service Appointment Scheduled', 'Awaiting Tire Availability', 'Awaiting Dealership Action', 'Awaiting Repair Order Update', 'Manager Review or Escalation', 'Follow-Up Date Correction', 'Other'];
  function dateBlock(o, draft, label = 'Follow-Up Date') {
    const changed = draft.date !== isoDay(o.follow);
    return `<div class="sheet-section" id="dateBlock"><h4>${label}</h4>
      <label class="field"><span>Next Follow-Up · currently ${due(o).long}</span><input class="input" type="date" data-f="date" value="${draft.date}"></label>
      <div ${changed ? '' : 'hidden'} id="reasonWrap"><label class="field"><span>Reason for Date Change <b>*</b></span><select class="select ${draft.err === 'reason' ? 'invalid' : ''}" data-f="reason"><option value="">Select a Reason…</option>${REASONS.map((r) => `<option ${draft.reason === r ? 'selected' : ''}>${r}</option>`).join('')}</select>${draft.err === 'reason' ? '<div class="field-error">A Reason is required when the Follow-Up Date changes.</div>' : ''}</label></div></div>`;
  }
  function applyDate(o, draft, source) {
    if (draft.date === isoDay(o.follow)) return false;
    const prev = o.follow; o.follow = fromIso(draft.date);
    o.timeline.unshift({ type: 'date', title: 'Follow-Up Date changed', text: `${monY(prev)} → ${monY(o.follow)} · ${draft.reason}${draft.reasonNote ? ` — ${draft.reasonNote}` : ''} (from ${source})`, at: new Date(), actor: ME, scope: 'Follow-Up', fresh: true });
    return true;
  }
  function markShared(o, type, via) {
    const key = type === 'tire' ? 'tireQuote' : 'alignQuote';
    if (!o[key]) return;
    const was = o[key]; o[key] = 'shared';
    o.timeline.unshift({ type: 'share', title: `${type === 'tire' ? 'Tire' : 'Alignment'} Quote ${was === 'shared' ? 're-shared' : 'shared'}`, text: `Quote ${type === 'tire' ? o.tq.id : o.aqd.id} sent to the Vehicle Owner by ${via}.`, at: new Date(), actor: ME, scope: type === 'tire' ? 'Tire' : 'Alignment', link: [type === 'tire' ? 'tire-quote' : 'align-quote', 'View Quote'], fresh: true });
  }

  /* ------------------------------------------------------------ Send SMS · Send Email · Make Call
     Same pattern as web mockup v007: Compose and History views, Vehicle Owner contact review,
     ONE system-prepared message (no message-type choice), protected link and opt-out / footer
     that the user cannot edit and that are always sent, independent Block controls. */
  const OUTCOMES = ['No Answer', 'Busy', 'Voicemail', 'Wrong Number', 'Do Not Call', 'Declined Service', 'Request Callback Later', 'Schedule Appointment for Service', 'Other'];
  const OPT_OUT = 'Reply STOP to stop';
  const FOOTER = `${T.DEALER} · 1234 Service Drive · Plano, TX 75023`;
  const LINK_TEXT = 'View Vehicle Recommendations and Quotes';
  const linkFor = (o) => `https://traxtion.tireprofiles.com/r/${o.visitId}`;
  const KIND = {
    sms: { title: 'Send SMS', tab: 'Compose SMS', hist: 'SMS History', block: 'Block SMS', blockSub: 'Independent of Email blocking and Do Not Call', addrLabel: 'Mobile Number', type: 'sms', word: 'SMS' },
    email: { title: 'Send Email', tab: 'Compose Email', hist: 'Email History', block: 'Block Email', blockSub: 'Independent of SMS blocking and Do Not Call', addrLabel: 'Email Address', type: 'email', word: 'Email' },
    call: { title: 'Make Call', tab: 'Make Call', hist: 'Phone History', block: 'Do Not Call', blockSub: 'Independent of SMS and Email blocking', addrLabel: 'Phone Number', type: 'phone', word: 'Phone' }
  };
  const digits = (s) => String(s || '').replace(/\D/g, '');
  const fmtPhone = (s) => { const x = digits(s).slice(-10); return x.length === 10 ? `(${x.slice(0, 3)}) ${x.slice(3, 6)}-${x.slice(6)}` : String(s || ''); };
  const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
  const oppLabel = (o) => [o.tireStatus ? 'Tire' : '', o.alignStatus ? 'Alignment' : ''].filter(Boolean).join(' and ') || 'Follow-Up';
  const quotesInLink = (o) => [o.tireQuote ? `the Tire Quote (${money(o.tq.total)})` : '', o.alignQuote ? `the Alignment Quote (${money(o.aqd.total)})` : ''].filter(Boolean);
  const stripHtml = (h) => { const t = document.createElement('div'); t.innerHTML = String(h).replace(/<\/(p|li|div)>/g, ' $&'); return t.textContent.replace(/\s+/g, ' ').trim(); };

  /* One history row, used by every History tab and by the Communication Log */
  function histItem(c) {
    const label = c.type === 'phone' ? 'Phone' : c.type === 'sms' ? 'SMS' : 'Email';
    const long = (c.text || '').length > 120;
    const body = c.type === 'phone'
      ? `<b>${esc(c.outcome)}</b>${c.note ? `<p>${esc(c.note)}</p>` : ''}`
      : `${c.subject ? `<b>${esc(c.subject)}</b>` : ''}<p class="${long ? 'clamp' : ''}">${esc(c.text)}</p>${long ? '<button class="more-btn" data-more>Show more</button>' : ''}`;
    return `<div class="hist ${c.fresh ? 'fresh' : ''}"><div class="hist-top"><span class="type-pill ${c.type}">${label}</span><span class="hist-when">${monY(c.at)} · ${time(c.at)}</span><span class="cur ${c.current ? 'yes' : 'no'}">${c.current ? 'Current Opportunity' : 'Other Opportunity'}</span></div>
      <div class="hist-body">${body}</div>
      <div class="hist-meta">${c.type === 'phone' ? 'Called' : 'Sent to'} <b>${esc(c.addr)}</b> · ${c.type === 'phone' ? 'Called by' : 'Sent by'} <b>${esc(c.by)}</b></div></div>`;
  }

  function openComm(o, k, opts = {}) {
    const K = KIND[k], isSms = k === 'sms', isEmail = k === 'email', isCall = k === 'call';
    /* Known numbers / addresses for this Vehicle Owner (web shows an available and a blocked one) */
    const options = [];
    if (isEmail) { if (o.email) options.push({ v: o.email }); if (o.altEmail) options.push({ v: o.altEmail, blocked: true }); }
    else { if (o.phone) options.push({ v: o.phone, landline: isSms && o.landline }); if (o.altPhone) options.push({ v: o.altPhone, blocked: true }); }
    const usable = options.find((x) => !x.blocked && !x.landline);
    const [fn0, ...ln0] = (o.name || '').split(' ');
    const base = { first: fn0 || '', last: ln0.join(' '), addr: (usable || options[0] || { v: '' }).v };
    const greet = fn0 || 'there';
    const extra = quotesInLink(o).length ? ' We prepared quotes for the recommended work.' : '';
    const d = {
      tab: opts.tab || 'compose', editing: !usable, manual: !options.length, ...base,
      text: isSms ? `Hello ${greet}, your ${oppLabel(o)} results from ${T.DEALER} are ready.${extra} Please review the details and contact us with any questions.` : '',
      html: isEmail ? `<p>Hello ${esc(greet)},</p><p>Your ${oppLabel(o)} results from ${T.DEALER} are ready.${extra} Please review the details and contact us with any questions.</p>` : '',
      subject: `Your Vehicle Recommendations from ${T.DEALER}`,
      date: isoDay(o.follow), reason: '', fnote: '', step: 'ready', outcome: '', cnote: ''
    };
    const start = { text: d.text, html: d.html, subject: d.subject };
    const hist = () => o.comms.filter((c) => c.type === K.type);
    const blocked = () => o.comm[k].state === 'blocked';
    const selOpt = () => (d.manual ? null : options.find((x) => x.v === d.addr));
    const contactDirty = () => d.first !== base.first || d.last !== base.last || d.addr !== base.addr;
    const dirty = () => contactDirty() || d.text !== start.text || d.html !== start.html || d.subject !== start.subject || d.date !== isoDay(o.follow) || !!(d.reason || d.fnote || d.cnote || d.outcome);
    const changed = () => d.date !== isoDay(o.follow);

    function problems() {
      const p = {}, so = selOpt();
      if (!d.first.trim() && !d.last.trim()) p.name = 'Enter a First Name or Last Name.';
      if (blocked()) p.addr = isCall ? 'Do Not Call is on for this Vehicle Owner.' : `${K.word} is blocked for this Vehicle Owner.`;
      else if (isEmail ? !validEmail(d.addr) : digits(d.addr).length !== 10) p.addr = isEmail ? 'Enter a valid Email Address.' : `Enter a valid 10-digit ${K.addrLabel}.`;
      else if (so && so.blocked) p.addr = isCall ? 'This Phone Number is marked Do Not Call.' : `This ${K.addrLabel} is blocked from ${K.word}.`;
      else if (so && so.landline) p.addr = 'This number is a landline and cannot receive SMS.';
      if (isSms && !d.text.trim()) p.msg = 'Enter a message before sending.';
      if (isEmail && !d.subject.trim()) p.subject = 'Enter a Subject.';
      if (isEmail && !stripHtml(d.html)) p.msg = 'Enter a message before sending.';
      if (changed() && !d.reason) p.reason = 'Select a Reason for the date change.';
      if (changed() && d.reason === 'Other' && !d.fnote.trim()) p.fnote = 'Add a Note explaining the Other reason.';
      if (isCall && d.step === 'outcome' && !d.outcome) p.outcome = 'Select an Outcome.';
      if (isCall && d.step === 'outcome' && d.outcome === 'Other' && !d.cnote.trim()) p.cnote = 'Use the Call Note to explain the Other outcome.';
      return p;
    }
    const SHORT = { name: 'Vehicle Owner name is required', msg: 'Message is required', subject: 'Subject is required', reason: 'Date-change Reason is required', fnote: 'Note is required for Other', outcome: 'Outcome is required', cnote: 'Call Note is required for Other' };

    const smsCounts = () => { const full = `${d.text}\n${linkFor(o)}\n${OPT_OUT}`; const segs = full.length <= 160 ? 1 : Math.ceil(full.length / 153); return `<b>${full.length}</b> characters · <b>${segs}</b> SMS segment${segs === 1 ? '' : 's'}`; };
    const quoteNote = () => { const q = quotesInLink(o); return q.length ? `<div class="notice info" style="margin:10px 0 0">${ic('info')}<div>The report link opens the Visit results and ${q.join(' and ')}. Sending marks ${q.length > 1 ? 'them' : 'it'} <b style="display:inline">Shared</b>.</div></div>` : ''; };

    function contactHTML(p) {
      const so = selOpt();
      const st = blocked() || (so && so.blocked) ? 'blocked' : (!d.addr || (so && so.landline)) ? 'unavailable' : 'available';
      const name = `${d.first} ${d.last}`.trim();
      return `<div class="contact-card"><div class="cc-head">Vehicle Owner Contact</div>
        <div class="cc-row"><div class="ctx-avatar">${esc(initials(name))}</div>
          <div class="cc-txt"><b>${esc(name || 'Vehicle Owner unavailable')}</b><small>${esc(d.addr || `No ${K.addrLabel} on file`)}</small>${avail(isCall ? 'Call' : K.word, st)}</div>
          <button class="link-btn tap" data-f="edit">${ic('edit')}${d.editing ? 'Done' : 'Edit'}</button></div>
        ${d.editing ? `<div class="cc-edit"><p class="field-hint" style="margin:0 0 10px">Review or correct the information used for this ${isCall ? 'call' : 'message'}.</p>
          <div class="two"><label class="field"><span>First Name</span><input class="input" data-f="first" value="${esc(d.first)}" autocomplete="off"></label><label class="field"><span>Last Name</span><input class="input" data-f="last" value="${esc(d.last)}" autocomplete="off"></label></div>
          <div class="field-error" data-err="name" style="margin:-8px 0 10px"></div>
          <label class="field"><span>${K.addrLabel}</span><select class="select" data-f="choice">${options.map((x) => `<option value="${esc(x.v)}" ${!d.manual && d.addr === x.v ? 'selected' : ''}>${esc(x.v)} · ${x.blocked ? (isCall ? 'Do Not Call' : 'Blocked') : x.landline ? 'Landline' : 'Available'}</option>`).join('')}<option value="__manual" ${d.manual ? 'selected' : ''}>${isEmail ? 'Enter another address…' : 'Enter another number…'}</option></select></label>
          ${d.manual ? `<label class="field"><span>New ${K.addrLabel}</span><input class="input" data-f="addr" value="${esc(d.addr)}" ${isEmail ? 'type="email" inputmode="email" placeholder="name@example.com"' : 'type="tel" inputmode="tel" placeholder="(555) 555-0100"'}></label>` : ''}
          <button class="btn btn-outline btn-sm tap" data-f="savecontact" id="saveContact" disabled>Save Contact Changes</button></div>` : ''}
        <div class="field-error cc-err" data-err="addr"></div>
        <label class="cc-block"><div><b>${K.block}</b><small>${K.blockSub}</small></div><span class="switch"><input type="checkbox" data-f="block" ${blocked() ? 'checked' : ''} aria-label="${K.block}"><i></i></span></label></div>`;
    }
    function followHTML() {
      const ch = changed();
      return `<div class="sheet-section"><h4>Next Follow-Up</h4>
        <label class="field"><span>Follow-Up Date · currently ${due(o).long}</span><input class="input" type="date" data-f="date" value="${d.date}"></label>
        <label class="field"><span>Reason for Date Change${ch ? ' <b>*</b>' : ''}</span><select class="select" data-f="reason" id="reasonSel" ${ch ? '' : 'disabled'}><option value="">Select a Reason…</option>${REASONS.map((r) => `<option ${d.reason === r ? 'selected' : ''}>${r}</option>`).join('')}</select><div class="field-error" data-err="reason"></div></label>
        <label class="field"><span>Internal Follow-Up Note</span><textarea class="textarea" data-f="fnote" id="fnote" style="min-height:64px" placeholder="Optional unless the Reason is Other." ${ch ? '' : 'disabled'}>${esc(d.fnote)}</textarea><div class="field-error" data-err="fnote"></div></label></div>`;
    }
    function smsHTML() {
      return `<div class="sheet-section"><div class="row-between"><h4 style="margin:0">Message</h4><span class="counts" id="counts">${smsCounts()}</span></div>
        <p class="field-hint" style="margin:4px 0 10px">TraXtion has prepared one message. Edit the greeting and main text as needed.</p>
        <div class="msg-box"><div class="mb-label">Editable message</div><textarea class="mb-edit" data-f="text" rows="5" aria-label="Editable message">${esc(d.text)}</textarea>
          <div class="protected">${ic('lock')}<div><span>Vehicle Owner report link</span><strong>${linkFor(o)}</strong><small>Opens the Vehicle Owner's report with the Visit results, Recommendations, and Quotes. Added by TraXtion and always sent. It cannot be edited.</small></div></div>
          <div class="protected">${ic('lock')}<div><span>Required opt-out</span><strong>${OPT_OUT}</strong><small>Required on every SMS. It cannot be edited.</small></div></div></div>
        <div class="field-error" data-err="msg"></div>${quoteNote()}</div>`;
    }
    function emailHTML() {
      return `<div class="sheet-section"><h4>Email Message</h4><p class="field-hint" style="margin:-4px 0 10px">TraXtion has prepared one formatted Email. Edit the Subject and main text as needed.</p>
        <label class="field"><span>Subject <b>*</b></span><input class="input" data-f="subject" value="${esc(d.subject)}"><div class="field-error" data-err="subject"></div></label>
        <div class="msg-box"><div class="mb-label">Editable message</div>
          <div class="fmt-bar"><button type="button" class="tap" data-f="fmt" data-v="bold" aria-label="Bold"><b>B</b></button><button type="button" class="tap" data-f="fmt" data-v="italic" aria-label="Italic"><i>I</i></button><button type="button" class="tap" data-f="fmt" data-v="insertUnorderedList" aria-label="Bulleted list">• List</button></div>
          <div class="mb-edit email-body" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Editable message" data-f="html">${d.html}</div>
          <div class="protected">${ic('lock')}<div><span>Vehicle Owner report link</span><strong class="plink">${LINK_TEXT}</strong><em class="purl">${linkFor(o)}</em><small>Opens the Vehicle Owner's report with the Visit results, Recommendations, and Quotes. Added by TraXtion and always sent. It cannot be edited.</small></div></div>
          <div class="protected">${ic('lock')}<div><span>Required footer</span><strong>${FOOTER}<br>Unsubscribe from these messages</strong><small>Dealership identification and opt-out text required on every Email. Always sent; it cannot be edited.</small></div></div></div>
        <div class="field-error" data-err="msg"></div>${quoteNote()}</div>`;
    }
    function callHTML(p) {
      if (d.step === 'ready') return `${contactHTML(p)}<button class="btn btn-green btn-block tap" data-f="dial" style="height:50px;margin-top:2px" ${p.name || p.addr ? 'disabled' : ''}>${ic('call')}Make Call</button><p class="field-hint" style="text-align:center;margin-top:8px">The call is placed from this device. Record the outcome when the call ends.</p>`;
      return `<div class="notice info">${ic('call')}<div><b>Call started to ${esc(d.addr)}</b>The behavior used to place the call is pending. Record the outcome below after completing the call.</div></div>
        <div class="sheet-section"><h4>Record Call Outcome</h4><p class="field-hint" style="margin:-4px 0 10px">Save the attempt, its result, any call-specific Note, and the next Follow-Up Date together.</p><div class="out-grid">${OUTCOMES.map((x) => `<button class="opt ${d.outcome === x ? 'on' : ''}" data-f="out" data-v="${x}"><span class="radio"></span><div><b>${x}</b></div></button>`).join('')}</div><div class="field-error" data-err="outcome"></div></div>
        <label class="field"><span>Call Note</span><textarea class="textarea" data-f="cnote" placeholder="Add information specific to this call. Use the Note to explain an Other outcome.">${esc(d.cnote)}</textarea><div class="field-hint">This Note is saved with the call event.</div><div class="field-error" data-err="cnote"></div></label>
        ${followHTML()}`;
    }
    function bodyHTML() {
      const p = problems(), h = hist();
      const strip = `<div class="ctx-strip"><div><span>Vehicle Owner</span><b>${esc(o.name || '—')}</b></div><div><span>Vehicle</span><b>${esc(o.vehicle)}</b></div><div><span>Visit</span><b>${mon(o.visitAt)} · ${time(o.visitAt)}</b></div><div><span>Opportunity</span><b>${oppLabel(o)}</b></div></div>`;
      const tabs = `<div class="seg full comm-tabs" role="tablist"><button class="${d.tab === 'compose' ? 'active' : ''}" data-f="tab" data-v="compose" role="tab">${K.tab}</button><button class="${d.tab === 'history' ? 'active' : ''}" data-f="tab" data-v="history" role="tab">${K.hist}<span class="tab-n">${h.length}</span></button></div>`;
      if (d.tab === 'history') {
        const who = isCall ? 'Call attempts for every Phone Number' : isSms ? 'Messages sent to every Mobile Number' : 'Email sent to every Email Address';
        return strip + tabs + `<p class="hist-intro">${who} associated with <b>${esc(o.name || 'this Vehicle Owner')}</b>, newest first. Entries from other Opportunities stay visible as contact history.</p>` + (h.length ? h.map(histItem).join('') : `<div class="empty-inline">No ${isCall ? 'calls' : K.word} recorded for this Vehicle Owner yet.</div>`);
      }
      const notice = blocked()
        ? `<div class="notice danger">${ic('block')}<div><b>${isCall ? 'Do Not Call is on' : `${K.word} is blocked`}</b>${FLY[k].blocked} Turn off ${K.block} below only if the Vehicle Owner agreed to be contacted again.</div></div>`
        : (!options.length ? `<div class="notice muted">${ic('info')}<div><b>No ${K.addrLabel} on file</b>${FLY[k].unavailable} Enter one below to continue.</div></div>` : '');
      if (isCall) return strip + tabs + notice + callHTML(p);
      return strip + tabs + notice + contactHTML(p) + (isSms ? smsHTML() : emailHTML()) + followHTML();
    }
    function footHTML() {
      if (d.tab === 'history') return `<button class="btn btn-outline" data-f="close">Close</button><button class="btn btn-primary" data-f="tab" data-v="compose">${isCall ? 'Make Call' : K.tab}</button>`;
      if (isCall && d.step === 'ready') return `<button class="btn btn-outline" data-f="close">Close</button>`;
      const p = problems();
      const keys = Object.keys(p).filter((x) => !isCall || ['reason', 'fnote', 'outcome', 'cnote'].includes(x));
      const why = keys.length ? `<div class="send-reason">${keys.map((x) => esc(x === 'addr' ? p.addr.replace(/\.$/, '') : SHORT[x])).join(' · ')}</div>` : '';
      return `${why}<button class="btn btn-outline" data-f="close">Cancel</button><button class="btn btn-primary" data-f="${isCall ? 'save' : 'send'}" ${keys.length ? 'disabled' : ''}>${isCall ? 'Save Call Outcome' : `${ic(k)}Send ${K.word}`}</button>`;
    }
    function refresh() {
      const p = problems();
      $$('#bsBody [data-err]').forEach((el) => { el.textContent = p[el.dataset.err] || ''; });
      $$('#bsBody [data-f="first"], #bsBody [data-f="last"]').forEach((el) => el.classList.toggle('invalid', !!p.name));
      const c = $('#counts'); if (c) c.innerHTML = smsCounts();
      const ch = changed(); const rs = $('#reasonSel'); if (rs) rs.disabled = !ch; const fn = $('#fnote'); if (fn) fn.disabled = !ch;
      const sc = $('#saveContact'); if (sc) sc.disabled = !contactDirty() || !!p.name;
      const dial = $('#bsBody [data-f="dial"]'); if (dial) dial.disabled = !!(p.name || p.addr);
      $('#bsFoot').innerHTML = footHTML();
    }
    const draw = () => { const b = $('#bsBody'), y = b.scrollTop; b.innerHTML = bodyHTML(); b.scrollTop = y; refresh(); };

    function setBlocked(on) {
      o.comm[k].state = on ? 'blocked' : (isEmail ? (o.email ? 'available' : 'unavailable') : (o.phone && !(isSms && o.landline) ? 'available' : 'unavailable'));
      o.timeline.unshift({ type: 'status', title: isCall ? `Do Not Call turned ${on ? 'on' : 'off'}` : `${K.word} ${on ? 'blocked' : 'unblocked'}`, text: 'Changed from the communication popup. Other communication methods are not affected.', at: new Date(), actor: ME, scope: 'Follow-Up', fresh: true });
      renderAll(); draw();
      toast(isCall ? `Do Not Call ${on ? 'on' : 'off'}` : `${K.word} ${on ? 'blocked' : 'unblocked'}`, on ? 'block' : 'check');
    }
    function saveContact() {
      const name = `${d.first} ${d.last}`.trim(); if (!name) return refresh();
      o.name = name;
      if (d.manual && (isEmail ? validEmail(d.addr) : digits(d.addr).length === 10)) {
        const v = isEmail ? d.addr.trim() : fmtPhone(d.addr);
        if (isEmail) { o.email = v; if (o.comm.email.state === 'unavailable') o.comm.email.state = 'available'; }
        else { o.phone = v; o.landline = false; ['call', 'sms'].forEach((x) => { if (o.comm[x].state === 'unavailable') o.comm[x].state = 'available'; }); }
        options.unshift({ v }); d.addr = v; d.manual = false;
      }
      Object.assign(base, { first: d.first, last: d.last, addr: d.addr });
      d.editing = false; renderAll(); draw(); toast('Vehicle Owner contact changes saved');
    }
    function commitFollow(source) {
      if (!changed()) return false;
      const note = d.fnote.trim();
      o.notesList.unshift({ author: ME, at: new Date(), text: note, reason: d.reason, newDate: fromIso(d.date), fresh: true });
      o.comm.notes.count++;
      return applyDate(o, { date: d.date, reason: d.reason, reasonNote: note }, source);
    }
    function send() {
      if (Object.keys(problems()).length) return draw();
      const shown = isEmail ? d.addr.trim() : `+1 ${fmtPhone(d.addr)}`;
      o.comm[k].count++;
      if (isSms) o.comms.unshift({ type: 'sms', at: new Date(), addr: shown, by: ME, text: `${d.text.trim()} ${linkFor(o)} ${OPT_OUT}`, current: true, fresh: true });
      else o.comms.unshift({ type: 'email', at: new Date(), addr: shown, by: ME, subject: d.subject.trim(), text: `${stripHtml(d.html)} ${LINK_TEXT}. ${FOOTER} · Unsubscribe from these messages`, current: true, fresh: true });
      o.timeline.unshift({ type: k, title: `${K.word} sent — Current Opportunity`, text: isSms ? d.text.trim() : `${d.subject.trim()} — ${stripHtml(d.html).slice(0, 90)}…`, at: new Date(), actor: ME, scope: 'Follow-Up', link: ['comms', 'View Communication'], fresh: true });
      const shared = [];
      [['tire', 'tireQuote'], ['align', 'alignQuote']].forEach(([t, key]) => { if (o[key] === 'created' || (o[key] && opts.quote === t)) { markShared(o, t, K.word); shared.push(t); } });
      const moved = commitFollow(K.title);
      closeSheet(); renderAll();
      toast(`${K.word} sent to ${esc(d.first || 'the Vehicle Owner')}${shared.length ? ' · Quote marked Shared' : ''}${moved ? ' · Follow-Up Date updated' : ''}`);
    }
    function saveOutcome() {
      const p = problems(); if (['reason', 'fnote', 'outcome', 'cnote'].some((x) => p[x])) return draw();
      o.comm.call.count++;
      o.comms.unshift({ type: 'phone', at: new Date(), addr: `+1 ${fmtPhone(d.addr)}`, by: ME, outcome: d.outcome, note: d.cnote.trim(), current: true, fresh: true });
      o.timeline.unshift({ type: 'phone', title: `Call attempt — ${d.outcome}`, text: d.cnote.trim() || 'No call-specific Note.', at: new Date(), actor: ME, scope: 'Follow-Up', link: ['comms', 'View Communication'], fresh: true });
      if (d.outcome === 'Do Not Call') o.comm.call.state = 'blocked';
      const moved = commitFollow('Record Call Outcome');
      closeSheet(); renderAll();
      toast(`Call outcome saved · ${d.outcome}${moved ? ' · Follow-Up Date updated' : ''}`);
    }
    function tryClose() {
      if (!dirty() || d.tab === 'history' && !dirty()) return closeSheet();
      confirmDialog({ title: 'Discard changes?', html: `<p>Your unsaved ${isCall ? 'call outcome' : K.word} changes will be lost.</p>`, ok: 'Discard', okCls: 'btn-danger', onOk: closeSheet });
    }

    openSheet({
      title: K.title, tall: true, body: bodyHTML(), guard: tryClose,
      onMount: () => {
        refresh();
        sheet.onmousedown = (e) => { if (e.target.closest('.fmt-bar button')) e.preventDefault(); }; // keep the text selection for B / I / List
        sheet.oninput = (e) => {
          const f = e.target.dataset && e.target.dataset.f; if (!f) return;
          if (f === 'html') d.html = e.target.innerHTML;
          else if (['text', 'subject', 'first', 'last', 'addr', 'cnote', 'fnote'].includes(f)) d[f] = e.target.value;
          refresh();
        };
        sheet.onchange = (e) => {
          const f = e.target.dataset.f;
          if (f === 'date') { d.date = e.target.value || isoDay(o.follow); if (!changed()) { d.reason = ''; d.fnote = ''; } draw(); }
          if (f === 'reason') { d.reason = e.target.value; refresh(); }
          if (f === 'choice') { if (e.target.value === '__manual') { d.manual = true; d.addr = ''; } else { d.manual = false; d.addr = e.target.value; } draw(); }
          if (f === 'block') setBlocked(e.target.checked);
        };
        sheet.onclick = (e) => {
          const b = e.target.closest('[data-f]');
          if (!b || ['INPUT', 'SELECT', 'TEXTAREA'].includes(b.tagName) || b.isContentEditable || b.tagName === 'LABEL') return;
          const f = b.dataset.f;
          if (f === 'close') return tryClose();
          if (f === 'tab') { d.tab = b.dataset.v; draw(); $('#bsBody').scrollTop = 0; }
          if (f === 'edit') { d.editing = !d.editing; draw(); }
          if (f === 'savecontact') saveContact();
          if (f === 'fmt') { document.execCommand(b.dataset.v); const eb = $('#bsBody .email-body'); if (eb) d.html = eb.innerHTML; refresh(); }
          if (f === 'dial') { d.step = 'outcome'; $('#bsTitle').textContent = 'Record Call Outcome'; draw(); $('#bsBody').scrollTop = 0; }
          if (f === 'out') { d.outcome = b.dataset.v; draw(); }
          if (f === 'send') send();
          if (f === 'save') saveOutcome();
        };
      }
    });
  }

  /* --- Follow-Up Notes (also the Change Follow-Up Date entry point) */
  function openNotes(o, focusDate) {
    const d = { text: '', date: isoDay(o.follow), reason: '', reasonNote: '', err: '' };
    const body = () => `${dateBlock(o, d)}
      <label class="field"><span>Follow-Up Note ${d.reason === 'Other' ? '<b>* required for Other</b>' : '(optional)'}</span><textarea class="textarea ${d.err === 'text' ? 'invalid' : ''}" data-f="text" placeholder="Add a Note for this Opportunity…">${esc(d.text)}</textarea>${d.err === 'text' ? '<div class="field-error">A Note is required when the Reason is Other.</div>' : ''}${d.err === 'empty' ? '<div class="field-error">Add a Note or change the Follow-Up Date to save.</div>' : ''}</label>
      <div class="sheet-section"><h4>Note History · this Opportunity</h4>${o.notesList.length ? o.notesList.map(noteHTML).join('') : '<div class="empty-inline">No Notes yet.</div>'}</div>`;
    const draw = () => { const y = $('#bsBody').scrollTop; $('#bsBody').innerHTML = body(); $('#bsBody').scrollTop = y; };
    openSheet({
      title: 'Follow-Up Notes', tall: true, body: body(),
      foot: `<button class="btn btn-outline" data-f="close">Cancel</button><button class="btn btn-primary" data-f="save">Save</button>`,
      onMount: () => {
        if (focusDate) { const inp = $('#bsBody [data-f="date"]'); setTimeout(() => { if (inp) inp.focus(); }, 340); }
        sheet.oninput = (e) => { if (e.target.dataset.f === 'text') d.text = e.target.value; };
        sheet.onchange = (e) => {
          const f = e.target.dataset.f;
          if (f === 'date') { d.date = e.target.value || isoDay(o.follow); $('#reasonWrap').hidden = d.date === isoDay(o.follow); }
          if (f === 'reason') { d.reason = e.target.value; d.err = ''; draw(); }
        };
        sheet.onclick = (e) => {
          const b = e.target.closest('[data-f]'); if (!b || ['INPUT', 'SELECT', 'TEXTAREA'].includes(b.tagName)) return;
          if (b.dataset.f === 'close') return closeSheet();
          if (b.dataset.f === 'save') {
            const ch = d.date !== isoDay(o.follow), text = d.text.trim();
            d.err = !ch && !text ? 'empty' : ch && !d.reason ? 'reason' : d.reason === 'Other' && !text ? 'text' : '';
            if (d.err) { draw(); return; }
            o.notesList.unshift({ author: ME, at: new Date(), text, reason: ch ? d.reason : '', newDate: ch ? fromIso(d.date) : null, fresh: true });
            o.comm.notes.count++;
            if (text) o.timeline.unshift({ type: 'note', title: 'Follow-Up Note added', text, at: new Date(), actor: ME, scope: 'Follow-Up', link: ['notes', 'View Notes'], fresh: true });
            d.reasonNote = text;
            const moved = applyDate(o, d, 'Follow-Up Notes');
            closeSheet(); renderAll();
            toast(moved ? `Follow-Up Date set to ${monY(o.follow)}` : 'Follow-Up Note saved');
          }
        };
      }
    });
  }

  function openShare(o, type) {
    const q = type === 'tire' ? o.tq : o.aqd;
    const ch = (k, label, sub) => { const st = o.comm[k].state; return `<button class="opt" data-f="via" data-v="${k}"><span class="mi-ic share-ic ${st}">${ic(k)}</span><div><b>${label}</b><small>${st === 'available' ? sub : FLY[k][st]}</small></div>${ic('chev', 'ic-chev')}</button>`; };
    openSheet({
      title: `Share ${type === 'tire' ? 'Tire' : 'Alignment'} Quote`,
      body: `<div class="notice info">${ic('info')}<div><b>Quote ${q.id} · ${money(q.total)}</b>The Quote is shared through the Vehicle Owner report link in an SMS or Email. Sending marks it Shared on the Opportunity.</div></div>${ch('sms', 'Share by SMS', esc(o.phone))}${ch('email', 'Share by Email', esc(o.email))}`,
      onMount: () => {
        sheet.onclick = (e) => {
          const b = e.target.closest('[data-f="via"]'); if (!b) return;
          closeSheet(); setTimeout(() => openComm(o, b.dataset.v, { quote: type }), 330);
        };
      }
    });
  }

  /* --- Filters, sort, legend, menus */
  const SORTS = [
    { k: 'follow', label: 'Follow-Up Date', sub: 'Oldest first — overdue work at the top', short: 'Follow-Up Date' },
    { k: 'callback', label: 'Call-backs first', sub: 'Then by Follow-Up Date', short: 'Call-backs' },
    { k: 'visit', label: 'Visit Date', sub: 'Newest Visit first', short: 'Visit Date' },
    { k: 'name', label: 'Vehicle Owner', sub: 'A to Z', short: 'Vehicle Owner' }
  ];
  function openSort() {
    openSheet({
      title: 'Sort by',
      body: SORTS.map((s) => `<button class="opt ${S.sort === s.k ? 'on' : ''}" data-f="sort" data-v="${s.k}"><span class="radio"></span><div><b>${s.label}</b><small>${s.sub}</small></div></button>`).join(''),
      onMount: () => { sheet.onclick = (e) => { const b = e.target.closest('[data-f="sort"]'); if (!b) return; S.sort = b.dataset.v; renderList(); $('#listScroll').scrollTo({ top: 0, behavior: 'smooth' }); closeSheet(); }; }
    });
  }
  function openFilters() {
    const d = JSON.parse(JSON.stringify(S.f));
    const body = () => `
      <div class="sheet-section"><div class="row-between" style="margin-bottom:10px"><h4 style="margin:0">Opportunity</h4><div class="seg"><button class="${!d.and ? 'active' : ''}" data-f="and" data-v="0">Any (OR)</button><button class="${d.and ? 'active' : ''}" data-f="and" data-v="1">All (AND)</button></div></div>
        <div class="chip-wrap">${OPP_F.map(([k, l]) => `<button class="chip ${d.opp.includes(k) ? 'active' : ''}" data-f="opp" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="sheet-section"><h4>Owner</h4><div class="chip-wrap">${[['mine', 'Mine'], ['unclaimed', 'Unclaimed']].map(([k, l]) => `<button class="chip ${d.owner.includes(k) ? 'active' : ''}" data-f="owner" data-v="${k}">${l}</button>`).join('')}</div></div>
      <div class="sheet-section row-between"><div><b style="font-weight:600">Include Closed</b><div class="field-hint" style="margin:2px 0 0">Show Follow-Ups that were marked Closed</div></div><span class="switch"><input type="checkbox" data-f="closed" ${d.closed ? 'checked' : ''} aria-label="Include Closed"><i></i></span></div>
      <div class="sheet-section"><h4>Date range</h4><div class="seg full" style="margin-bottom:12px"><button class="${d.dateMode === 'follow' ? 'active' : ''}" data-f="mode" data-v="follow">Follow-Up Date</button><button class="${d.dateMode === 'visit' ? 'active' : ''}" data-f="mode" data-v="visit">Visit Date</button></div>
        <div style="display:flex;gap:10px"><label class="field" style="flex:1;margin:0"><span>${d.dateMode === 'visit' ? 'Visit' : 'Follow-Up'} From</span><input class="input" type="date" data-f="from" value="${d.from}" max="${d.to}"></label><label class="field" style="flex:1;margin:0"><span>${d.dateMode === 'visit' ? 'Visit' : 'Follow-Up'} To</span><input class="input" type="date" data-f="to" value="${d.to}" min="${d.from}"></label></div></div>`;
    const foot = () => { const n = visible(d).length; return `<button class="btn btn-outline" data-f="clear">Clear Filters</button><button class="btn btn-primary" data-f="apply">Show ${n} Result${n === 1 ? '' : 's'}</button>`; };
    const draw = () => { $('#bsBody').innerHTML = body(); $('#bsFoot').innerHTML = foot(); };
    openSheet({
      title: 'Filters', body: body(), foot: foot(),
      onMount: () => {
        sheet.onchange = (e) => { const f = e.target.dataset.f; if (f === 'closed') d.closed = e.target.checked; if (f === 'from' || f === 'to') d[f] = e.target.value; $('#bsFoot').innerHTML = foot(); };
        sheet.onclick = (e) => {
          const b = e.target.closest('[data-f]'); if (!b || b.tagName === 'INPUT') return;
          const f = b.dataset.f, v = b.dataset.v;
          if (f === 'and') d.and = v === '1';
          if (f === 'opp' || f === 'owner') { const a = d[f]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); }
          if (f === 'mode') d.dateMode = v;
          if (f === 'clear') { Object.assign(d, { opp: [], and: false, owner: [], closed: false, dateMode: 'follow', from: '', to: '' }); }
          if (f === 'apply') { S.f = d; renderList(); closeSheet(); return; }
          draw();
        };
      }
    });
  }
  function openLegend() {
    const row = (sym, b, s) => `<div class="lg-row"><span class="lg-sym">${sym}</span><div><b>${b}</b><small>${s}</small></div></div>`;
    const dueChip = (cls, top, label) => `<span class="due ${cls}" style="pointer-events:none"><small>${top}</small><b>${label}</b></span>`;
    const comm = (k, st, n) => `<span class="comm ${st}" style="pointer-events:none">${ic(k)}${cnt(n)}</span>`;
    openSheet({
      title: 'Icon Legend', tall: true,
      body: `<div class="legend-group"><h4>Work and Status</h4>
        ${row(`<span class="pill sale-red">${ic('call').replace('<svg', '<svg style="width:12px;height:12px;fill:var(--red)"')}Call-back</span>`, 'Call-Back Request', 'Vehicle Owner requested contact and the request has not been addressed.')}
        ${row(statusMark('open'), 'Open', 'The Tire or Alignment work remains open.')}
        ${row(statusMark('closed'), 'Closed', 'The applicable work item has been explicitly closed.')}
        ${row(dueChip('overdue', '3 days overdue', 'Nov 23'), 'Overdue Follow-Up Date', 'The Follow-Up Date is in the past.')}
        ${row(dueChip('', 'Follow-up', 'Today'), 'Due today or tomorrow', 'No highlight — this is the right time to work it.')}
        ${row(dueChip('future', 'In 5 days', 'Dec 1'), 'Future Follow-Up Date', 'At least two days away and may be premature to work.')}</div>
      <div class="legend-group"><h4>Recommendations</h4>
        ${row(tireStack(['green', 'green', 'green', 'green'], true), 'Green Tires', 'Four Tire positions, front on top. Like-new tread.')}
        ${row(tireStack(['yellow', 'yellow', 'yellow', 'yellow'], true), 'Yellow Tires', 'Safe; replacement not needed today.')}
        ${row(tireStack(['yellow', 'yellow', 'red', 'red'], true), 'Red Tires', 'At least one Tire is below recommended levels.')}
        ${row(alignIc(false, true), 'No Alignment Inspection', 'The wear pattern does not indicate an Alignment inspection.')}
        ${row(alignIc(true, true), 'Alignment Inspection Recommended', 'The Tire wear pattern indicates an Alignment inspection.')}</div>
      <div class="legend-group"><h4>Quotes and Sales</h4>
        ${row(quotePill('created'), 'Quote Created', 'Amber — the Quote exists but has not been shared.')}
        ${row(quotePill('shared'), 'Quote Shared', 'Blue — the Quote has been shared with the Vehicle Owner.')}
        ${row(salePill('red'), 'Not shown as sold', 'Red — an applicable RO exists but does not show the Sale.')}
        ${row(salePill('green'), 'Sale found', 'Green — an applicable RO shows the Sale.')}
        ${row('<span class="mx-none">—</span>', 'No icon', 'No Quote, or no applicable RO yet.')}</div>
      <div class="legend-group"><h4>Communications and Notes</h4>
        ${row(comm('sms', 'available', 0), 'Available', 'Blue — SMS, Email, or Phone can be used.')}
        ${row(comm('email', 'unavailable', 0), 'Unavailable', 'Gray — the contact information is missing.')}
        ${row(comm('call', 'blocked', 0), 'Blocked', 'Red with a slash — that method is blocked.')}
        ${row(`<span class="comm notes" style="pointer-events:none">${ic('notes')}</span>`, 'Follow-Up Notes', 'Open Note History or add a Note.')}
        ${row(comm('call', 'available', 3), 'Count badge', 'Shows 1–9 attempts; “+” means more than 9. Zero is hidden.')}</div>`
    });
  }
  function menu(title, items) {
    openSheet({
      title,
      body: items.filter(Boolean).map((it, i) => `<button class="menu-item ${it.cls || ''}" data-i="${i}"><span class="mi-ic">${it.icon}</span><span><span>${it.label}</span>${it.sub ? `<small>${it.sub}</small>` : ''}</span></button>`).join(''),
      onMount: () => { const list = items.filter(Boolean); sheet.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const it = list[+b.dataset.i]; closeSheet(); setTimeout(it.run, 300); }; }
    });
  }
  function confirmClose(o) {
    const closing = !o.closed;
    confirmDialog({
      title: closing ? 'Close Follow-Up Work?' : 'Reopen Follow-Up Work?',
      html: closing ? `<p>The shared Follow-Up for <b>${esc(o.name || o.plate)}</b> will be marked <b>Closed</b> and hidden from the default list.</p><div class="note-box"><b>Items that do not change</b>Tire and Alignment Opportunities, Quotes, Sale results, and history stay as they are.</div>`
        : `<p>The shared Follow-Up will be marked <b>Open</b> and returned to the active Follow-Up List.</p><div class="note-box"><b>Items that do not change</b>Ownership, history, Opportunity states, Quotes, and Sale results.</div>`,
      ok: closing ? 'Close Follow-Up' : 'Reopen', okCls: closing ? 'btn-danger' : 'btn-primary',
      onOk: () => setClosed(o, closing, true)
    });
  }
  function setClosed(o, closing, fromList) {
    o.closed = closing;
    o.timeline.unshift({ type: 'status', title: `Follow-Up ${closing ? 'closed' : 'reopened'}`, text: `Shared Follow-Up work item marked ${closing ? 'Closed' : 'Open'}.`, at: new Date(), actor: ME, scope: 'Follow-Up', fresh: true });
    renderAll();
    toast(closing ? (fromList && !S.f.closed ? 'Follow-Up closed · hidden from the list' : 'Follow-Up closed') : 'Follow-Up reopened', closing ? 'flag' : 'check');
  }
  function cardMenu(o) {
    menu(o.name || o.plate, [
      { icon: ic('chev', 'ic-chev'), label: 'Open Opportunity Detail', run: () => openOpp(o.id) },
      { icon: ic('call'), label: 'Call', sub: o.comm.call.state === 'available' ? o.phone : cap(o.comm.call.state), run: () => openComm(o, 'call') },
      { icon: ic('sms'), label: 'Send SMS', sub: o.comm.sms.state === 'available' ? '' : cap(o.comm.sms.state), run: () => openComm(o, 'sms') },
      { icon: ic('email'), label: 'Send Email', sub: o.comm.email.state === 'available' ? '' : cap(o.comm.email.state), run: () => openComm(o, 'email') },
      { icon: ic('history'), label: 'Communication History', sub: 'SMS, Email, and Phone in Opportunity Detail', run: () => openOpp(o.id, 'comms') },
      { icon: ic('notes'), label: 'Follow-Up Notes', sub: plural(o.comm.notes.count, 'Note'), run: () => openNotes(o) },
      { icon: ic('cal'), label: 'Change Follow-Up Date', sub: due(o).long, run: () => openNotes(o, true) },
      { icon: ic('flag'), label: o.closed ? 'Reopen Follow-Up…' : 'Close Follow-Up…', cls: o.closed ? '' : 'danger', run: () => confirmClose(o) }
    ]);
  }
  function detailMenu() {
    const o = cur(); if (!o) return;
    menu('Opportunity actions', [
      o.callback ? { icon: ic('check'), label: 'Mark Call-Back Addressed', sub: 'Records acknowledgement only', run: addressCallback } : null,
      o.owner === ME ? { icon: ic('person'), label: 'Unclaim Opportunity', run: () => setMine(o, false) } : (!o.owner ? { icon: ic('person'), label: 'Claim Opportunity (Mine)', run: () => setMine(o, true) } : null),
      { icon: ic('cal'), label: 'Change Follow-Up Date', sub: due(o).long, run: () => openNotes(o, true) },
      { icon: ic('flag'), label: o.closed ? 'Reopen Follow-Up' : 'Close Follow-Up', cls: o.closed ? '' : 'danger', run: () => setClosed(o, !o.closed) },
      { icon: ic('info'), label: 'Icon Legend', run: openLegend }
    ]);
  }
  function setMine(o, mine) {
    o.owner = mine ? ME : '';
    o.timeline.unshift({ type: 'claim', title: mine ? 'Opportunity claimed' : 'Opportunity unclaimed', text: mine ? `${ME} claimed ownership of this Follow-Up.` : `${ME} released ownership of this Follow-Up.`, at: new Date(), actor: ME, scope: 'Follow-Up', fresh: true });
    renderAll(); toast(mine ? 'Claimed — this Opportunity is now Mine' : 'Opportunity is now Unclaimed', 'person');
  }
  function addressCallback() {
    const o = cur(); if (!o || !o.callback) return;
    const el = secEl('callback'); if (el) el.classList.add('leaving');
    setTimeout(() => {
      o.callback = false;
      o.timeline.unshift({ type: 'addressed', title: 'Call-Back Request addressed', text: 'Acknowledged in Opportunity Detail.', at: new Date(), actor: ME, scope: 'Follow-Up', fresh: true });
      renderAll(); toast('Call-Back Request marked addressed');
    }, 260);
  }

  /* ------------------------------------------------------------ events */
  const idOf = (el) => +(el.dataset.id || S.sel);
  const placeholder = (what) => toast(`${what} — existing TraXtion screen, unchanged in this mockup`, 'info');
  const ACT = {
    back: () => go('#/list'),
    quick: (el) => { S.quick = el.dataset.k; renderList(); },
    'clear-search': () => { S.search = ''; $('#search').value = ''; renderList(); },
    sort: openSort, filter: openFilters, legend: openLegend,
    notifications: () => placeholder('Notifications'), profile: () => placeholder('Profile'), dealer: () => placeholder('Dealer selection'), scans: () => placeholder('Scan List'),
    sms: (el) => openComm(byId(idOf(el)), 'sms', { tab: el.dataset.tab }),
    email: (el) => openComm(byId(idOf(el)), 'email', { tab: el.dataset.tab }),
    call: (el) => openComm(byId(idOf(el)), 'call', { tab: el.dataset.tab }),
    'comm-filter': (el) => { S.ui.commF = el.dataset.k; renderDetail(false); },
    notes: (el) => openNotes(byId(idOf(el))),
    date: (el) => openNotes(byId(idOf(el)), true),
    'card-menu': (el) => cardMenu(byId(idOf(el))),
    'detail-menu': detailMenu,
    jump: (el) => goSection(el.dataset.sec),
    go: (el) => goSection(el.dataset.sec),
    'toggle-sec': (el) => { const id = el.dataset.sec, s = secEl(id); const c = !s.classList.contains('collapsed'); s.classList.toggle('collapsed', c); el.setAttribute('aria-expanded', String(!c)); c ? S.ui.collapsed.add(id) : S.ui.collapsed.delete(id); spy(); },
    'toggle-sub': (el) => { const id = el.dataset.sub, s = document.getElementById('sub-' + id); const o = s.classList.toggle('open'); o ? S.ui.open.add(id) : S.ui.open.delete(id); },
    'toggle-open': (el) => { const k = el.dataset.key, s = document.getElementById('x-' + k); S.ui.open.add('ro-init'); const o = s.classList.toggle('open'); o ? S.ui.open.add(k) : S.ui.open.delete(k); },
    'address-callback': addressCallback,
    'share-quote': (el) => openShare(cur(), el.dataset.type),
    'modify-quote': () => placeholder('Tire Fitment and Pricing'),
    'print-quote': () => toast('Quote sent to the print dialog (simulated)', 'print'),
    'tl-more': () => { S.ui.allTimeline = true; renderDetail(false); },
    'ro-chip': (el) => { const a = S.ui.ro, k = el.dataset.k, i = a.indexOf(k); i >= 0 ? a.splice(i, 1) : a.push(k); renderDetail(false); },
    'ro-mode': (el) => { S.ui.roAnd = el.dataset.v === '1'; renderDetail(false); },
    'edit-owner': () => placeholder('Edit Vehicle Owner'),
    'close-sheet': () => requestClose(),
    'af-remove': (el) => {
      const [k, v] = el.dataset.k.split(':');
      if (k === 'opp' || k === 'owner') S.f[k] = S.f[k].filter((x) => x !== v);
      if (k === 'and') S.f.and = false;
      if (k === 'closed') S.f.closed = false;
      if (k === 'date') { S.f.from = ''; S.f.to = ''; }
      renderList();
    },
    'af-clear': () => { S.f = { opp: [], and: false, owner: [], closed: false, dateMode: 'follow', from: '', to: '' }; S.search = ''; S.quick = 'all'; $('#search').value = ''; renderList(); }
  };
  const CHG = {
    'opp-status': (el) => {
      const o = cur(), t = el.dataset.type, key = t === 'tire' ? 'tireStatus' : 'alignStatus', closed = el.checked;
      o[key] = closed ? 'closed' : 'open';
      o.timeline.unshift({ type: 'status', title: `${t === 'tire' ? 'Tire' : 'Alignment'} Opportunity ${closed ? 'closed' : 'reopened'}`, text: 'Changed in Opportunity Detail. Other Opportunities are not affected.', at: new Date(), actor: ME, scope: t === 'tire' ? 'Tire' : 'Alignment', fresh: true });
      renderAll(); toast(`${t === 'tire' ? 'Tire' : 'Alignment'} Opportunity ${closed ? 'closed' : 'reopened'}`);
    },
    overall: (el) => setClosed(cur(), el.checked),
    mine: (el) => setMine(cur(), el.checked)
  };

  document.addEventListener('click', (e) => {
    const more = e.target.closest('[data-more]');
    if (more) { const h = more.closest('.hist'); const x = h.classList.toggle('expanded'); more.textContent = x ? 'Show less' : 'Show more'; return; }
    const a = e.target.closest('[data-act]');
    if (a) { if (a.disabled) return; const fn = ACT[a.dataset.act]; if (fn) { e.preventDefault(); fn(a, e); } return; }
    const card = e.target.closest('[data-open]');
    if (card) { const s = e.target.closest('[data-sec]'); openOpp(+card.dataset.open, s ? s.dataset.sec : null); }
  });
  document.addEventListener('change', (e) => { const t = e.target.closest('[data-chg]'); if (t && CHG[t.dataset.chg]) CHG[t.dataset.chg](t, e); });
  $('#search').addEventListener('input', (e) => { S.search = e.target.value; renderList(); });
  $('#search').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
  $('#detailScroll').addEventListener('scroll', onDetailScroll, { passive: true });
  $('#listScroll').addEventListener('scroll', () => { const tb = $('#listToolbar'); tb.classList.toggle('stuck', tb.getBoundingClientRect().top <= $('#listScroll').getBoundingClientRect().top + 1 && $('#listScroll').scrollTop > 0); }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('#dialog').hidden) closeDialog(); else if (!sheet.hidden) requestClose(); else if (parseHash().screen === 'detail' && !isSplit()) go('#/list'); } });

  /* Press feedback like React Native TouchableOpacity — only the innermost touchable dims */
  document.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.tap'); if (!t) return;
    t.classList.add('pressed');
    const up = () => { t.classList.remove('pressed'); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }, { passive: true });

  /* In the simulator: drag with the mouse to scroll, like a finger */
  if (inFrame) {
    let suppress = false;
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (e.target.closest('input, textarea, select, [contenteditable], .switch, .bs-handle, .bs-head')) return;
      const h = e.target.closest('.hscroll'), v = e.target.closest('.scroll, .bs-body');
      if (!h && !v) return;
      drag = { h, v, x: e.clientX, y: e.clientY, axis: null, sl: h ? h.scrollLeft : 0, st: v ? v.scrollTop : 0, moved: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag.axis = drag.h && Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'y' && !drag.v) { drag = null; return; }
        document.body.classList.add('dragging'); $$('.pressed').forEach((x) => x.classList.remove('pressed'));
      }
      if (drag.axis === 'x') drag.h.scrollLeft = drag.sl - dx; else drag.v.scrollTop = drag.st - dy;
      drag.moved = true;
    });
    window.addEventListener('pointerup', () => { if (drag && drag.moved) { suppress = true; setTimeout(() => { suppress = false; }, 0); } drag = null; document.body.classList.remove('dragging'); });
    document.addEventListener('click', (e) => { if (suppress) { e.stopPropagation(); e.preventDefault(); suppress = false; } }, true);
  }

  /* Messages from the device simulator (index.html) */
  window.addEventListener('message', (e) => {
    const m = e.data; if (!m || m.source !== 'trx-shell') return;
    if (m.type === 'navigate') { closeSheet(); if (!$('#dialog').hidden) closeDialog(); go(m.screen === 'detail' ? `#/opp/${S.sel || 2}` : '#/list'); }
    if (m.type === 'scenario' && m.value !== S.scenario) {
      S.scenario = m.value; S.opps = T.build(S.scenario); S.ui = freshUi(); renderAll();
      if (!S.sel || S.sel !== 2) go('#/opp/2');
      toast(m.value === 'green' ? 'Scenario: all-green Tires (Daniel Ruiz)' : 'Scenario: red rear Tires (Daniel Ruiz)', 'info');
    }
    if (m.type === 'insets') { rootStyle.setProperty('--sat', (m.sat || 0) + 'px'); rootStyle.setProperty('--sab', (m.sab || 0) + 'px'); }
  });

  let wasSplit = isSplit(), rT;
  window.addEventListener('resize', () => {
    $('#app').classList.add('no-anim'); clearTimeout(rT); rT = setTimeout(() => $('#app').classList.remove('no-anim'), 120);
    if (isSplit() !== wasSplit) { wasSplit = isSplit(); route(); } else spy();
  });
  window.addEventListener('hashchange', route);

  /* ------------------------------------------------------------ boot */
  if (!location.hash) history.replaceState(null, '', location.pathname + location.search + '#/list');
  $('#app').classList.add('no-anim');
  skeleton();
  setTimeout(() => { route(); requestAnimationFrame(() => $('#app').classList.remove('no-anim')); }, parseHash().screen === 'detail' ? 0 : 450);
})();
