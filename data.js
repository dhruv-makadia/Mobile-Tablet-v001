/* TraXtion ReCapture — Mobile & Tablet mockup sample data.
   Fictional data only. Mirrors the Follow-Up List rows of web mockup v007 so
   reviewers can compare the web and mobile presentations side by side. */
window.TRX = (() => {
  const DAY = 864e5;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const at = (off, h = 0, m = 0) => { const d = new Date(today.getTime() + off * DAY); d.setHours(h, m, 0, 0); return d; };
  const dayOff = (d) => Math.round((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / DAY);
  const ME = 'Chip Bergquist';
  const DEALER = 'TraXtion Sales Demo';

  const POS = [
    { key: 'LF', name: 'Left Front', orient: ['Outside', 'Inside'] },
    { key: 'RF', name: 'Right Front', orient: ['Inside', 'Outside'] },
    { key: 'LR', name: 'Left Rear', orient: ['Outside', 'Inside'] },
    { key: 'RR', name: 'Right Rear', orient: ['Inside', 'Outside'] }
  ];
  const DEPTHS = {
    green: [[9.4, 9.6, 9.5, 9.3], [9.5, 9.7, 9.6, 9.4], [9.2, 9.4, 9.3, 9.1], [9.3, 9.5, 9.4, 9.2]],
    yellow: [[5.9, 6.1, 6.0, 5.8], [5.8, 6.2, 6.1, 6.4], [5.4, 5.7, 5.6, 5.3], [5.5, 5.9, 5.8, 5.6]],
    red: [[2.5, 2.9, 2.4, 2.6], [2.6, 2.8, 2.7, 2.5], [2.7, 3.0, 2.8, 2.6], [2.9, 3.1, 2.8, 2.7]]
  };
  const RESULT = {
    green: 'Tread depth is like new. No replacement needed.',
    yellow: 'Tread depth is safe. Replacement not needed today.',
    red: 'Below recommended levels. Replacement needed.'
  };

  /* Rows match the v007 Follow-Up List. Daniel Ruiz (id 2) is the fully
     designed Opportunity Detail record, as in the web mockup. */
  const ROWS = [
    { id: 1, name: 'Maya Thompson', vehicle: '2021 Honda Accord', trim: 'EX-L', plate: 'TX KLM-4821', vin: '1HGCV1F51MA018422', odo: 41208, phone: '(512) 555-0187', address: '908 Barton Hills Dr, Austin, TX 78704',
      callback: true, cbOff: [0, 7, 55], follow: -3, visit: [-6, 8, 10], tires: ['yellow', 'yellow', 'red', 'red'], align: true,
      ts: 'open', as: 'open', tq: 'created', aq: null, tsale: 'red', asale: 'red',
      sms: ['available', 3], email: ['available', 1], call: ['available', 2], notes: 4, advisor: 'Alex Morgan', owner: ME, visitId: 846902 },
    { id: 2, name: 'Daniel Ruiz', vehicle: '2019 Ford Escape', trim: 'SEL', plate: 'TX RKV-3184', vin: '1FMCU9GD5KUA48217', odo: 72418, phone: '(469) 555-0142', address: '2217 Spring Creek Drive, Plano, TX 75023',
      callback: true, cbOff: [0, 8, 42], follow: 0, visit: [-2, 9, 18], tires: ['yellow', 'yellow', 'red', 'red'], align: true,
      ts: 'open', as: 'open', tq: 'created', aq: 'created', tsale: null, asale: null,
      sms: ['available', 3], email: ['available', 1], call: ['available', 2], notes: 4, advisor: 'Jamie Lee', owner: ME, visitId: 847291, rich: true },
    { id: 3, name: 'Priya Shah', vehicle: '2022 Toyota RAV4', trim: 'XLE', plate: 'CA 8QXZ214', vin: '2T3P1RFV2NW214870', odo: 23950, phone: '(408) 555-0119', address: '41 Alder Ct, San Jose, CA 95123',
      callback: false, follow: 1, visit: [-1, 10, 35], tires: ['yellow', 'yellow', 'green', 'green'], align: true,
      ts: null, as: 'open', tq: null, aq: 'shared', tsale: null, asale: 'red',
      sms: ['unavailable', 0], email: ['available', 0], call: ['available', 6], notes: 0, advisor: 'Morgan Reed', owner: '', visitId: 847355, landline: true },
    { id: 4, name: 'Lena Brooks', vehicle: '2020 Chevrolet Equinox', trim: 'LT', plate: 'MN BRT-908', vin: '2GNAXKEV1L6201945', odo: 58731, phone: '(612) 555-0168', address: '1180 Lakeview Ave, Minneapolis, MN 55408',
      callback: true, cbOff: [0, 9, 5], follow: 2, visit: [0, 11, 35], tires: ['red', 'red', 'yellow', 'yellow'], align: true,
      ts: 'open', as: 'open', tq: 'shared', aq: 'created', tsale: 'green', asale: 'red',
      sms: ['available', 9], email: ['blocked', 3], call: ['available', 11], notes: 10, advisor: 'Chris Park', owner: '', visitId: 847402 },
    { id: 5, name: 'Owen Clark', vehicle: '2018 Subaru Outback', trim: 'Premium', plate: 'WI ACD-7734', vin: '4S4BSAFC4J3301562', odo: 88412, phone: '(414) 555-0134', address: '77 Prospect St, Milwaukee, WI 53202',
      callback: false, follow: 5, visit: [-3, 12, 10], tires: ['yellow', 'yellow', 'yellow', 'yellow'], align: false,
      ts: 'open', as: null, tq: null, aq: null, tsale: 'red', asale: null,
      sms: ['available', 1], email: ['unavailable', 0], call: ['available', 1], notes: 2, advisor: '', owner: 'Avery Collins', visitId: 847168, noEmail: true },
    { id: 6, name: 'Nora Bennett', vehicle: '2023 Kia Telluride', trim: 'SX', plate: 'MI EPK 6112', vin: '5XYP5DGC7PG355019', odo: 18306, phone: '', address: '3409 Maple Rd, Ann Arbor, MI 48104',
      callback: false, follow: 8, visit: [-4, 13, 35], tires: ['green', 'green', 'green', 'green'], align: true,
      ts: null, as: 'open', tq: null, aq: 'shared', tsale: null, asale: 'green',
      sms: ['available', 0], email: ['available', 4], call: ['unavailable', 0], notes: 7, advisor: 'Taylor Kim', owner: ME, visitId: 847090 },
    { id: 7, name: '', vehicle: '2017 Nissan Altima', trim: '2.5 SV', plate: 'MO XF4 P2N', vin: '1N4AL3AP7HC219844', odo: 102377, phone: '(314) 555-0102', address: '',
      callback: false, follow: -1, visit: [-12, 14, 10], tires: ['red', 'red', 'green', 'green'], align: false,
      ts: 'open', as: null, tq: null, aq: null, tsale: 'red', asale: null,
      sms: ['blocked', 2], email: ['blocked', 1], call: ['blocked', 4], notes: 5, advisor: '', owner: '', visitId: 845530 },
    { id: 8, name: 'Marcus Green', vehicle: '2020 GMC Terrain', trim: 'SLE', plate: 'IN 204MZQ', vin: '3GKALMEV8LL170233', odo: 61840, phone: '(317) 555-0177', address: '15 Monument Cir, Indianapolis, IN 46204',
      callback: false, closed: true, follow: -8, visit: [-15, 8, 35], tires: ['red', 'red', 'yellow', 'yellow'], align: true,
      ts: 'closed', as: 'closed', tq: 'shared', aq: 'shared', tsale: 'green', asale: 'green',
      sms: ['available', 4], email: ['available', 2], call: ['available', 2], notes: 9, advisor: 'Jordan West', owner: ME, visitId: 844711 },
    { id: 9, name: 'Sofia Martinez', vehicle: '2021 Hyundai Tucson', trim: 'SEL', plate: 'OH JHT 4420', vin: 'KM8J3CA46MU398120', odo: 37155, phone: '(614) 555-0151', address: '260 High St, Columbus, OH 43215',
      callback: false, closed: true, follow: -12, visit: [-20, 9, 10], tires: ['yellow', 'yellow', 'green', 'green'], align: true,
      ts: null, as: 'closed', tq: null, aq: 'shared', tsale: null, asale: 'green',
      sms: ['available', 1], email: ['available', 1], call: ['available', 5], notes: 3, advisor: 'Sam Carter', owner: 'Casey Nguyen', visitId: 843902 }
  ];

  const NOTE_POOL = [
    'Vehicle Owner wants to compare Tire options before deciding.',
    'Left a voicemail with the Quote total and our current promotion.',
    'Vehicle Owner asked us to follow up after payday on Friday.',
    'Service Advisor reviewed Recommendations at the counter.',
    'Vehicle Owner prefers SMS over phone calls.',
    'Requested pricing on the alternate Tire.',
    'Owner will bring the vehicle back next week for the Alignment.'
  ];

  const tireQuote = (o) => ({
    id: `${o.visitId}-T`, created: at(dayOff(o.visitAt) + 1, 16, 10), by: o.owner || 'Jamie Lee',
    products: [
      { img: 'assets/img/tire-product-primary.jpg', name: 'Continental CrossContact LX25', spec: '235/55R17 99H · All-season', meta: '70,000-mile limited warranty · In stock', price: 218.00, qty: 4, selected: true },
      { img: 'assets/img/tire-product-alternate.jpg', name: 'General Altimax RT45', spec: '235/55R17 99H · All-season', meta: '75,000-mile limited warranty · Available next day', price: 189.00 }
    ],
    lines: [['Tires', 872.00], ['Installation', 180.00], ['Fees and Tax', 134.76]], total: 1186.76
  });
  const alignQuote = (o) => ({
    id: `${o.visitId}-A`, created: at(dayOff(o.visitAt) + 1, 16, 16), by: o.owner || 'Jamie Lee',
    service: 'Four-Wheel Alignment Service', desc: 'Measure and adjust front and rear wheel angles to manufacturer specifications.',
    lines: [['Service', 139.95], ['Promotion', -10.00]], total: 129.95
  });

  const PRIOR_TIRE_QUOTES = [
    { visit: 'March 14, 2026 Visit', id: '73108', by: 'Jamie Lee', status: 'Shared', product: 'General Altimax RT45', img: 'assets/img/tire-product-alternate.jpg', spec: '235/55R17 99H · All-season', each: 169.00, qty: 4, lines: [['Tires', 676.00], ['Installation', 128.20]], total: 804.20 },
    { visit: 'October 6, 2025 Visit', id: '69422', by: 'TraXtion System', status: 'Expired', product: 'Continental CrossContact LX25', img: 'assets/img/tire-product-primary.jpg', spec: '235/55R17 99H · All-season', each: 189.00, qty: 2, lines: [['Tires', 378.00], ['Installation and fees', 50.50]], total: 428.50 }
  ];
  const PRIOR_ALIGN_QUOTES = [
    { visit: 'March 14, 2026 Visit', id: '73109', by: 'Jamie Lee', status: 'Shared', lines: [['Service', 129.95], ['Promotion', -10.00]], total: 119.95 }
  ];
  const PRIOR_VISITS = [
    { when: 'March 14, 2026 · 10:42 AM', id: 794218, scans: 2, ro: 'RO 1283041', odo: '65,103 miles', advisor: 'Jamie Lee', tread: 'Yellow Tires', quotes: 'Tire $804.20 · Alignment $119.95 — Shared' },
    { when: 'October 6, 2025 · 8:07 AM', id: 741602, scans: 1, ro: 'RO 1198820', odo: '54,810 miles', advisor: 'Jamie Lee', tread: 'Green Tires', quotes: 'Tire $428.50 — Expired' }
  ];
  const ROS = [
    { no: 'RO 1283041', meta: 'Mar 14, 2026 · 65,103 miles · Jamie Lee', tire: false, align: false, state: 'Closed',
      note: 'No Tire or Alignment Sale identified',
      lines: [['1', 'OIL', 'CP', 39.95, 28.40, 'Oil and filter service', 'Maintenance', 1], ['2', 'MPI', 'INC', 0, 0, 'Multipoint inspection', 'Inspection', 1], ['3', 'CABF', 'CP', 24.95, 41.20, 'Cabin air filter', 'Maintenance', 1]] },
    { no: 'RO 1198820', meta: 'Oct 6, 2025 · 54,810 miles · Jamie Lee', tire: true, align: true, state: 'Closed',
      note: 'Tire and Alignment Sales identified',
      lines: [['1', 'CTIRE4', 'CP', 160.00, 756.00, 'Continental CrossContact LX25', 'Replacement', 4, 1], ['2', '4WA', 'CP', 129.95, 0, 'Four-wheel alignment', 'Alignment', 1, 1], ['3', 'OIL', 'CP', 39.95, 28.40, 'Oil and filter service', 'Maintenance', 1]] },
    { no: 'RO 1142379', meta: 'May 21, 2025 · 47,206 miles · Morgan Reed', tire: true, align: false, state: 'Closed',
      note: 'Tire Sale identified · No Alignment Sale',
      lines: [['1', 'RTIRE2', 'CP', 90.00, 378.00, 'Two rear replacement Tires', 'Replacement', 2, 1], ['2', 'ROT', 'CP', 24.95, 0, 'Tire rotation', 'Maintenance', 1]] },
    { no: 'RO 1085614', meta: 'Nov 18, 2024 · 38,944 miles · Alex Morgan', tire: false, align: true, state: 'Closed',
      note: 'Alignment Sale identified · No Tire Sale',
      lines: [['1', '4WA', 'CP', 119.95, 0, 'Four-wheel alignment', 'Alignment', 1, 1], ['2', 'MPI', 'INC', 0, 0, 'Multipoint inspection', 'Inspection', 1]] }
  ];

  const first = (n) => (n || 'Vehicle Owner').split(' ')[0];
  const slug = (n) => n.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');

  function danielDetail(o, green) {
    const v = o.visitAt;
    o.callbackText = green
      ? 'Daniel Ruiz requested a call about the Visit results and Alignment Recommendation.'
      : 'Daniel Ruiz requested a call about the Tire and Alignment Recommendations.';
    o.notesList = [
      { author: 'Jamie Lee', at: at(-1, 15, 48), text: green ? 'Vehicle Owner asked for the Alignment price before approving service.' : 'Vehicle Owner asked for Tire options and the Alignment price before approving service.' },
      { author: 'Jamie Lee', at: at(-2, 14, 12), text: 'Called — no answer. Will try again once the Quotes are ready.' },
      { author: 'Jamie Lee', at: at(-2, 9, 24), text: 'Vehicle is in for scheduled maintenance. Review Recommendations with Vehicle Owner.' },
      { author: 'TraXtion System', at: at(-2, 9, 23), text: `Follow-Up created from Visit ${o.visitId}.` }
    ];
    o.comms = [
      { type: 'sms', at: at(-1, 15, 31), from: 'TraXtion', to: 'Daniel', text: 'Your Tire and Alignment results are ready.', result: 'Delivered', auto: true, current: true },
      { type: 'phone', at: at(-2, 14, 10), from: 'Jamie Lee', to: 'Daniel', text: 'Outbound call', result: 'No answer', current: true },
      { type: 'email', at: at(-2, 9, 25), from: 'TraXtion', to: 'Daniel', subject: 'Vehicle Scan results and Recommendations', text: 'Visit results and Recommendations', result: 'Opened', auto: true, current: true },
      { type: 'sms', at: at(-2, 9, 19), from: 'TraXtion', to: 'Daniel', text: 'Thanks for visiting! Your vehicle is checked in.', result: 'Delivered', auto: true, current: true },
      { type: 'sms', at: new Date(2026, 2, 14, 15, 2), from: 'Jamie Lee', to: 'Daniel', text: 'Your Escape is ready for pickup.', result: 'Delivered', current: false }
    ];
    o.timeline = [
      { type: 'callback', title: 'Call-Back Request received', text: 'Vehicle Owner requested a call about both Recommendations.', at: o.callbackAt, actor: 'Vehicle Owner', scope: 'Follow-Up' },
      { type: 'quote', title: 'Alignment Quote created', text: '$129.95 Alignment service Quote created.', at: at(-1, 16, 16), actor: ME, scope: 'Alignment', link: ['align-quote', 'View Quote'] },
      green ? null : { type: 'quote', title: 'Tire Quote created', text: 'Four-tire replacement Quote totaling $1,186.76.', at: at(-1, 16, 10), actor: ME, scope: 'Tire', link: ['tire-quote', 'View Quote'] },
      { type: 'note', title: 'Follow-Up Note added', text: o.notesList[0].text, at: at(-1, 15, 48), actor: 'Jamie Lee', scope: 'Follow-Up', link: ['notes', 'View Notes'] },
      { type: 'sms', title: 'SMS delivered', text: 'Vehicle Owner received a link to the Visit results.', at: at(-1, 15, 31), actor: 'TraXtion System', scope: 'Follow-Up', link: ['comms', 'View Communication'] },
      { type: 'phone', title: 'Outbound call — no answer', text: 'Jamie Lee attempted to contact the Vehicle Owner.', at: at(-2, 14, 10), actor: 'Jamie Lee', scope: 'Follow-Up', link: ['comms', 'View Communication'] },
      { type: 'email', title: 'Results Email opened', text: 'Vehicle Owner opened the Visit results and Recommendations.', at: at(-2, 9, 41), actor: 'Vehicle Owner', scope: 'Follow-Up', link: ['comms', 'View Communication'] },
      { type: 'claim', title: 'Opportunity claimed', text: `${ME} claimed ownership of this Follow-Up.`, at: at(-2, 9, 28), actor: ME, scope: 'Follow-Up' },
      { type: 'note', title: 'Follow-Up Note added', text: 'Vehicle is in for scheduled maintenance. Review Recommendations with Vehicle Owner.', at: at(-2, 9, 24), actor: 'Jamie Lee', scope: 'Follow-Up', link: ['notes', 'View Notes'] },
      { type: 'scan', title: 'Visit and Recommendations created', text: 'Tread Depth, WheelSpec, and DamageSpeX Scans were related to this Visit.', at: v, actor: 'TraXtion System', scope: 'Follow-Up', link: ['visit', 'View Visit'] }
    ].filter(Boolean);
  }

  function genericDetail(o) {
    const n = first(o.name);
    const v = o.visitAt;
    const dayAfter = new Date(v.getTime() + DAY);
    o.callbackText = `${o.name || 'The Vehicle Owner'} requested a call about the Visit results.`;
    const count = Math.min(o.comm.notes.count, 4);
    o.notesList = Array.from({ length: count }, (_, i) => ({
      author: i % 2 ? (o.advisor || 'Jamie Lee') : (o.owner || ME),
      at: new Date(v.getTime() + (count - i) * 0.6 * DAY),
      text: NOTE_POOL[(o.id + i) % NOTE_POOL.length]
    }));
    o.comms = [];
    const add = (type, k, data) => { for (let i = 0; i < Math.min(o.comm[k].count, 2); i++) o.comms.push({ type, at: new Date(v.getTime() + (i + 1) * 0.37 * DAY), from: i ? 'TraXtion' : (o.owner || o.advisor || 'Jamie Lee'), to: n, ...data(i) }); };
    add('sms', 'sms', (i) => ({ text: i ? 'Your Visit results are ready.' : 'Following up on your Tire Quote — any questions?', result: 'Delivered', auto: !!i, current: true }));
    add('email', 'email', (i) => ({ subject: i ? 'Vehicle Scan results and Recommendations' : 'Your Quote from TraXtion Sales Demo', text: 'Visit results and Recommendations', result: i ? 'Opened' : 'Delivered', auto: !!i, current: true }));
    add('phone', 'call', (i) => ({ text: 'Outbound call', result: i ? 'Left voicemail' : 'No answer', current: true }));
    o.comms.sort((a, b) => b.at - a.at);
    o.timeline = [];
    if (o.callback) o.timeline.push({ type: 'callback', title: 'Call-Back Request received', text: 'Vehicle Owner asked to be contacted.', at: o.callbackAt, actor: 'Vehicle Owner', scope: 'Follow-Up' });
    if (o.tireQuote === 'shared') o.timeline.push({ type: 'share', title: 'Tire Quote shared', text: 'Quote sent to the Vehicle Owner by SMS.', at: new Date(dayAfter.getTime() + 3600e3), actor: o.owner || ME, scope: 'Tire', link: ['tire-quote', 'View Quote'] });
    if (o.alignQuote === 'shared') o.timeline.push({ type: 'share', title: 'Alignment Quote shared', text: 'Quote sent to the Vehicle Owner by Email.', at: new Date(dayAfter.getTime() + 3000e3), actor: o.owner || ME, scope: 'Alignment', link: ['align-quote', 'View Quote'] });
    if (o.tireQuote) o.timeline.push({ type: 'quote', title: 'Tire Quote created', text: 'Four-tire replacement Quote totaling $1,186.76.', at: dayAfter, actor: o.owner || ME, scope: 'Tire', link: ['tire-quote', 'View Quote'] });
    if (o.alignQuote) o.timeline.push({ type: 'quote', title: 'Alignment Quote created', text: '$129.95 Alignment service Quote created.', at: new Date(dayAfter.getTime() - 600e3), actor: o.owner || ME, scope: 'Alignment', link: ['align-quote', 'View Quote'] });
    if (o.tireSale || o.alignSale) o.timeline.push({ type: 'ro', title: 'Repair Order received from DMS', text: `RO ${o.visitId + 436000} matched to this Visit.`, at: new Date(v.getTime() + 0.3 * DAY), actor: 'DMS feed', scope: 'Follow-Up', link: ['current-ro', 'View RO'] });
    o.notesList.forEach((nt) => o.timeline.push({ type: 'note', title: 'Follow-Up Note added', text: nt.text, at: nt.at, actor: nt.author, scope: 'Follow-Up', link: ['notes', 'View Notes'] }));
    o.comms.filter((c) => c.current).forEach((c) => o.timeline.push({ type: c.type, title: c.type === 'phone' ? `Outbound call — ${c.result.toLowerCase()}` : `${c.type === 'sms' ? 'SMS' : 'Email'} ${c.result.toLowerCase()}`, text: c.subject || c.text, at: c.at, actor: c.auto ? 'TraXtion System' : c.from, scope: 'Follow-Up', link: ['comms', 'View Communication'] }));
    if (o.owner) o.timeline.push({ type: 'claim', title: 'Opportunity claimed', text: `${o.owner} claimed ownership of this Follow-Up.`, at: new Date(v.getTime() + 600e3), actor: o.owner, scope: 'Follow-Up' });
    if (o.closed) o.timeline.push({ type: 'status', title: 'Follow-Up closed', text: 'Shared Follow-Up work item marked Closed.', at: at(-2, 10, 5), actor: o.owner || ME, scope: 'Follow-Up' });
    o.timeline.push({ type: 'scan', title: 'Visit and Recommendations created', text: 'Tread Depth and WheelSpec Scans were related to this Visit.', at: v, actor: 'TraXtion System', scope: 'Follow-Up', link: ['visit', 'View Visit'] });
    o.timeline.sort((a, b) => b.at - a.at);
  }

  function build(scenario = 'red') {
    return ROWS.map((r) => {
      const green = r.id === 2 && scenario === 'green';
      const o = {
        id: r.id, name: r.name, vehicle: r.vehicle, trim: r.trim, plate: r.plate, vin: r.vin, odo: r.odo,
        phone: r.phone, email: r.noEmail || !r.name ? '' : `${slug(r.name)}@example.com`, address: r.address,
        callback: r.callback, callbackAt: r.cbOff ? at(...r.cbOff) : null,
        follow: at(r.follow), visitAt: at(...r.visit), visitId: r.visitId,
        tires: green ? ['green', 'green', 'green', 'green'] : r.tires.slice(), align: r.align,
        tireStatus: r.ts, alignStatus: r.as, tireQuote: green ? null : r.tq, alignQuote: r.aq, tireSale: r.tsale, alignSale: r.asale,
        comm: { sms: { state: r.sms[0], count: r.sms[1] }, email: { state: r.email[0], count: r.email[1] }, call: { state: r.call[0], count: r.call[1] }, notes: { count: r.notes } },
        advisor: r.advisor, owner: r.owner, closed: !!r.closed, rich: !!r.rich, scans: r.rich ? 3 : 2, landline: !!r.landline
      };
      o.depths = o.tires.map((c, i) => DEPTHS[c][i]);
      o.tq = tireQuote(o); o.aqd = alignQuote(o);
      if (r.rich) danielDetail(o, green); else genericDetail(o);
      return o;
    });
  }

  return { build, ME, DEALER, POS, RESULT, PRIOR_TIRE_QUOTES, PRIOR_ALIGN_QUOTES, PRIOR_VISITS, ROS, today, DAY, at };
})();
