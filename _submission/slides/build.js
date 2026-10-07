const pptxgen = require('pptxgenjs');

// ---- brand palette: carried over from the Uni Shuttle website ----
const NAVY   = '10203A';  // signage navy (dominant)
const NAVY_2 = '1B2E4D';
const GREEN  = '0E7C66';  // signal green
const GREEN_L= 'E6F4F0';
const AMBER  = 'E8912F';  // bus livery amber (accent)
const AMBER_L= 'FDF3E6';
const PAPER  = 'FFFFFF';
const PAPER_2= 'F4F6F9';
const INK    = '10203A';
const SOFT   = '47566E';
const FAINT  = '7D8798';
const LINE   = 'DDE3EC';
const RED    = 'B3413A';

const HEAD = 'Calibri';
const BODY = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';           // 13.33 x 7.5
pres.author = 'Uni Shuttle';
pres.title  = 'Uni Shuttle — Innovative Features';

const W = 13.33, H = 7.5, M = 0.62;
const COL = (W - M * 2 - 0.5) / 2;      // two-column width with 0.5" gutter

// ---------- shared builders ----------
function slideHeader(s, num, label, title, sub) {
  s.addShape(pres.ShapeType.ellipse, {
    x: M, y: 0.46, w: 0.52, h: 0.52, fill: { color: GREEN }
  });
  s.addText(num, {
    x: M, y: 0.46, w: 0.52, h: 0.52,
    align: 'center', valign: 'middle',
    fontFace: HEAD, fontSize: 17, bold: true, color: PAPER, margin: 0
  });
  s.addText(label, {
    x: M + 0.72, y: 0.46, w: 6, h: 0.52,
    valign: 'middle', margin: 0,
    fontFace: BODY, fontSize: 11.5, bold: true, color: GREEN, charSpacing: 2
  });
  s.addText(title, {
    x: M, y: 1.14, w: W - M * 2, h: 0.78,
    margin: 0, fontFace: HEAD, fontSize: 38, bold: true, color: INK
  });
  if (sub) {
    s.addText(sub, {
      x: M, y: 1.98, w: 10.6, h: 0.62,
      margin: 0, fontFace: BODY, fontSize: 14.5, color: SOFT, lineSpacing: 21
    });
  }
}

function card(s, { x, y, w, h, fill, line }) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: fill || PAPER_2 },
    line: { color: line || LINE, width: 1 }
  });
}

function cardTitle(s, text, x, y, w, color) {
  s.addText(text, {
    x, y, w, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, bold: true, color: color || FAINT, charSpacing: 1.4
  });
}

function bullets(s, items, { x, y, w, h, size = 13.5, color = SOFT }) {
  s.addText(
    items.map((t, i) => ({
      text: t,
      options: { bullet: { code: '25AA' }, breakLine: i !== items.length - 1 }
    })),
    {
      x, y, w, h, margin: 0, valign: 'top',
      fontFace: BODY, fontSize: size, color,
      lineSpacing: size * 1.42, paraSpaceAfter: 7
    }
  );
}

// big number + label tile
function statTile(s, { x, y, w, h, value, label, fill, valueColor }) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: fill || GREEN_L }, line: { color: 'FFFFFF', width: 0 }
  });
  s.addText(value, {
    x: x + 0.16, y: y + 0.14, w: w - 0.32, h: h * 0.52,
    margin: 0, valign: 'bottom',
    fontFace: HEAD, fontSize: 26, bold: true, color: valueColor || INK
  });
  s.addText(label, {
    x: x + 0.16, y: y + h * 0.62, w: w - 0.32, h: h * 0.3,
    margin: 0, valign: 'top',
    fontFace: BODY, fontSize: 10, bold: true, color: FAINT, charSpacing: 0.8
  });
}

// horizontal process flow
function flow(s, steps, { x, y, w, h }) {
  const gap = 0.14;
  const sw = (w - gap * (steps.length - 1)) / steps.length;
  steps.forEach((st, i) => {
    const sx = x + i * (sw + gap);
    const hi = !!st.hi;
    s.addShape(pres.ShapeType.roundRect, {
      x: sx, y, w: sw, h, rectRadius: 0.08,
      fill: { color: hi ? GREEN : PAPER_2 },
      line: { color: hi ? GREEN : LINE, width: 1 }
    });
    s.addText(st.t, {
      x: sx + 0.14, y: y + 0.16, w: sw - 0.28, h: 0.32,
      margin: 0, fontFace: HEAD, fontSize: 13.5, bold: true,
      color: hi ? PAPER : INK
    });
    s.addText(st.d, {
      x: sx + 0.14, y: y + 0.5, w: sw - 0.28, h: 0.34,
      margin: 0, fontFace: BODY, fontSize: 10.5,
      color: hi ? 'D7EDE7' : FAINT
    });
  });
}

/* ============================================================
   SLIDE 1 — cover (dark)
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  // subtle route-line motif
  for (let i = 0; i < 4; i++) {
    s.addShape(pres.ShapeType.ellipse, {
      x: 10.2 + i * 0.78, y: 5.95, w: 0.2, h: 0.2,
      fill: { color: i === 3 ? AMBER : '2C4166' }
    });
  }
  s.addShape(pres.ShapeType.rect, {
    x: 10.3, y: 6.03, w: 2.34, h: 0.04, fill: { color: '2C4166' }
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 1.6, w: 3.1, h: 0.42, rectRadius: 0.2,
    fill: { color: '243A5E' }, line: { color: '243A5E', width: 0 }
  });
  s.addText('E-BUSINESS ASSIGNMENT', {
    x: M, y: 1.6, w: 3.1, h: 0.42, align: 'center', valign: 'middle',
    margin: 0, fontFace: BODY, fontSize: 10.5, bold: true, color: AMBER, charSpacing: 1.4
  });

  s.addText('Uni Shuttle', {
    x: M, y: 2.24, w: 9.5, h: 1.25,
    margin: 0, fontFace: HEAD, fontSize: 60, bold: true, color: PAPER
  });
  s.addText('Turning informal university bus services into a fully digital,\ncashless and trackable business.', {
    x: M, y: 3.62, w: 8.4, h: 1.0,
    margin: 0, fontFace: BODY, fontSize: 17, color: 'B9C4D6', lineSpacing: 27
  });

  s.addShape(pres.ShapeType.rect, { x: M, y: 4.9, w: 1.5, h: 0.05, fill: { color: AMBER } });
  s.addText('FIVE INNOVATIVE FEATURES', {
    x: M, y: 5.18, w: 7, h: 0.34,
    margin: 0, fontFace: BODY, fontSize: 13, bold: true, color: PAPER, charSpacing: 2.6
  });

  s.addNotes('Uni Shuttle digitises university bus travel. Five features make it a genuine e-business: the monthly fare ledger, automatic account freezing, private per-bus live tracking, a cash-and-card revenue model, and enforced operator verification.');
}

/* ============================================================
   SLIDE 2 — Feature 01: fare ledger
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  slideHeader(s, '1', 'FEATURE ONE', 'The Monthly Fare Ledger',
    'Most bus operators track fares in a notebook. We replaced it with a per-student, per-month ledger that is the single source of truth for who has paid.');

  const cy = 2.82, ch = 2.56;
  card(s, { x: M, y: cy, w: COL, h: ch, fill: PAPER_2 });
  cardTitle(s, 'THE PROBLEM TODAY', M + 0.28, cy + 0.26, COL - 0.56, RED);
  bullets(s, [
    'Drivers chase 30+ students individually every month',
    'No record of who paid, when, or how much',
    'Cash disputes settled from memory'
  ], { x: M + 0.28, y: cy + 0.66, w: COL - 0.56, h: 1.5 });

  const rx = M + COL + 0.5;
  card(s, { x: rx, y: cy, w: COL, h: ch, fill: GREEN_L, line: GREEN });
  cardTitle(s, 'OUR INNOVATION', rx + 0.28, cy + 0.26, COL - 0.56, GREEN);
  bullets(s, [
    'Three states per student per month: Paid, Unpaid, Not travelling',
    'One tap to record a cash payment',
    'Card payments settle themselves — the ledger updates automatically',
    'Filtered lists show exactly who still owes'
  ], { x: rx + 0.28, y: cy + 0.66, w: COL - 0.56, h: 1.74, size: 13, color: '1F4438' });

  const sy = 5.66, sh = 1.1, sw = (W - M * 2 - 0.36) / 3;
  statTile(s, { x: M, y: sy, w: sw, h: sh, value: '3', label: 'FARE STATES TRACKED' });
  statTile(s, { x: M + sw + 0.18, y: sy, w: sw, h: sh, value: 'Zero', label: 'PAPER RECORDS NEEDED', fill: AMBER_L });
  statTile(s, { x: M + (sw + 0.18) * 2, y: sy, w: sw, h: sh, value: 'Auto', label: 'CARD RECONCILIATION' });

  s.addNotes('The ledger is the foundation everything else builds on. Because the platform knows who owes what, it can enforce payment automatically and report earnings accurately.');
}

/* ============================================================
   SLIDE 3 — Feature 02: account freezing
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  slideHeader(s, '2', 'FEATURE TWO', 'Automatic Account Freezing',
    'The platform enforces payment terms by itself — no phone calls, no awkward conversations, no manual suspensions.');

  flow(s, [
    { t: '1st – 10th', d: 'Grace window' },
    { t: '8th', d: 'Automatic reminder' },
    { t: 'After 10th', d: 'Account frozen', hi: true },
    { t: 'On payment', d: 'Restored instantly' }
  ], { x: M, y: 2.78, w: W - M * 2, h: 0.98 });

  const cy = 4.02, ch = 2.66;
  card(s, { x: M, y: cy, w: COL, h: ch, fill: GREEN_L, line: GREEN });
  cardTitle(s, 'WHY IT IS INNOVATIVE', M + 0.28, cy + 0.26, COL - 0.56, GREEN);
  bullets(s, [
    'Enforced on the server — not merely hidden in the interface',
    'Self-healing: paying unfreezes instantly, with no admin involved',
    'Timezone-correct — the deadline uses local time, not the device clock',
    'Fair by design — students joining after the 10th get a grace period'
  ], { x: M + 0.28, y: cy + 0.66, w: COL - 0.56, h: 1.86, size: 13, color: '1F4438' });

  const rx = M + COL + 0.5;
  card(s, { x: rx, y: cy, w: COL, h: ch, fill: PAPER_2 });
  cardTitle(s, 'BUSINESS IMPACT', rx + 0.28, cy + 0.26, COL - 0.56, FAINT);
  bullets(s, [
    'Operators are paid on time, every month',
    'Removes the operator from the debt-collection role',
    'A frozen student keeps full access to payment, so they can always fix it'
  ], { x: rx + 0.28, y: cy + 0.66, w: COL - 0.56, h: 1.86, size: 13 });

  s.addNotes('This is the feature that makes the business model work. Payment terms enforce themselves, so operators never have to chase money, and students always have a one-tap route back to good standing.');
}

/* ============================================================
   SLIDE 4 — Feature 03: live tracking
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  slideHeader(s, '3', 'FEATURE THREE', 'Private, Per-Bus Live Tracking',
    'Real GPS streamed from the driver’s phone to only the students on that bus, with arrival time calculated for each rider individually.');

  const cy = 2.82, ch = 3.42;
  card(s, { x: M, y: cy, w: COL, h: ch, fill: PAPER_2 });
  cardTitle(s, 'HOW IT WORKS', M + 0.28, cy + 0.26, COL - 0.56, FAINT);
  bullets(s, [
    'The driver’s device streams real GPS, throttled to protect battery and data',
    'Each bus has its own private channel — buses never leak into each other',
    'Late joiners catch up instantly: the last position is replayed on connect',
    'The bus goes offline automatically if updates stop'
  ], { x: M + 0.28, y: cy + 0.66, w: COL - 0.56, h: 2.5 });

  const rx = M + COL + 0.5;
  s.addText('WHAT THE STUDENT SEES', {
    x: rx, y: cy + 0.02, w: COL, h: 0.3, margin: 0,
    fontFace: BODY, fontSize: 11, bold: true, color: FAINT, charSpacing: 1.4
  });

  const tw = (COL - 0.18) / 2, th = 1.12;
  statTile(s, { x: rx, y: cy + 0.44, w: tw, h: th, value: '4 min', label: 'TO MY STOP', valueColor: GREEN });
  statTile(s, { x: rx + tw + 0.18, y: cy + 0.44, w: tw, h: th, value: '1.4 km', label: 'DISTANCE AWAY' });
  statTile(s, { x: rx, y: cy + 0.44 + th + 0.18, w: tw, h: th, value: '32 km/h', label: 'CURRENT SPEED', fill: AMBER_L });
  statTile(s, { x: rx + tw + 0.18, y: cy + 0.44 + th + 0.18, w: tw, h: th, value: 'Live', label: 'UPDATED 3s AGO', fill: AMBER_L });

  s.addText('Arrival time is computed from the bus’s actual speed, not a fixed timetable.', {
    x: rx, y: cy + 0.44 + (th + 0.18) * 2 + 0.06, w: COL, h: 0.42, margin: 0,
    fontFace: BODY, fontSize: 12.5, italic: true, color: SOFT
  });

  s.addNotes('Tracking is scoped per bus for privacy: a student only ever sees the vehicle they are assigned to. Arrival estimates use the bus’s live speed rather than a published timetable.');
}

/* ============================================================
   SLIDE 5 — Feature 04: revenue model
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  slideHeader(s, '4', 'FEATURE FOUR', 'Cash and Card in One Revenue Model',
    'The hard problem in transport payments is that cash never disappears. So commission works either way — the model used by Uber and PickMe.');

  const cy = 2.86, ch = 2.24;

  card(s, { x: M, y: cy, w: COL, h: ch, fill: PAPER_2 });
  cardTitle(s, 'CARD PAYMENT  ·  ONLINE', M + 0.28, cy + 0.26, COL - 0.56, GREEN);
  s.addText([
    { text: 'Student pays  ', options: { color: SOFT } },
    { text: '$39', options: { bold: true, color: INK } },
    { text: '  through PayPal', options: { color: SOFT } }
  ], { x: M + 0.28, y: cy + 0.72, w: COL - 0.56, h: 0.34, margin: 0, fontFace: BODY, fontSize: 14 });
  s.addText([
    { text: 'Platform keeps  ', options: { color: SOFT } },
    { text: '$3.90', options: { bold: true, color: GREEN } },
    { text: '  commission', options: { color: SOFT } }
  ], { x: M + 0.28, y: cy + 1.18, w: COL - 0.56, h: 0.34, margin: 0, fontFace: BODY, fontSize: 14 });
  s.addText([
    { text: 'Operator wallet credited  ', options: { color: SOFT } },
    { text: '+$35.10', options: { bold: true, color: INK } }
  ], { x: M + 0.28, y: cy + 1.64, w: COL - 0.56, h: 0.34, margin: 0, fontFace: BODY, fontSize: 14 });

  const rx = M + COL + 0.5;
  card(s, { x: rx, y: cy, w: COL, h: ch, fill: AMBER_L, line: AMBER });
  cardTitle(s, 'CASH PAYMENT  ·  IN PERSON', rx + 0.28, cy + 0.26, COL - 0.56, 'A8631A');
  s.addText([
    { text: 'Student hands  ', options: { color: SOFT } },
    { text: '$39', options: { bold: true, color: INK } },
    { text: '  to the driver', options: { color: SOFT } }
  ], { x: rx + 0.28, y: cy + 0.72, w: COL - 0.56, h: 0.34, margin: 0, fontFace: BODY, fontSize: 14 });
  s.addText([
    { text: 'Driver marks it paid in ', options: { color: SOFT } },
    { text: 'one tap', options: { bold: true, color: INK } }
  ], { x: rx + 0.28, y: cy + 1.18, w: COL - 0.56, h: 0.34, margin: 0, fontFace: BODY, fontSize: 14 });
  s.addText([
    { text: 'Platform’s  ', options: { color: SOFT } },
    { text: '$3.90', options: { bold: true, color: 'A8631A' } },
    { text: '  debited from the wallet', options: { color: SOFT } }
  ], { x: rx + 0.28, y: cy + 1.64, w: COL - 0.56, h: 0.34, margin: 0, fontFace: BODY, fontSize: 14 });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 5.44, w: W - M * 2, h: 1.06, rectRadius: 0.06,
    fill: { color: NAVY }, line: { color: NAVY, width: 0 }
  });
  s.addText([
    { text: 'The result:  ', options: { bold: true, color: AMBER } },
    { text: 'the platform earns exactly 10% on every fare however the student paid, and every transaction lands in the same ledger. Operators withdraw their balance through a payout request that an administrator reviews and approves.', options: { color: 'D7DEEA' } }
  ], {
    x: M + 0.32, y: 5.44, w: W - M * 2 - 0.64, h: 1.06,
    valign: 'middle', margin: 0, fontFace: BODY, fontSize: 13, lineSpacing: 19
  });

  s.addNotes('Cash is not treated as a leak in the model. Commission is charged identically on both rails, so the platform’s revenue is independent of how students choose to pay.');
}

/* ============================================================
   SLIDE 6 — Feature 05: verification
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  slideHeader(s, '5', 'FEATURE FIVE', 'Trust as a Product Feature',
    'Parents are handing a stranger their child’s daily commute. Verification is not paperwork — it is the reason the marketplace works at all.');

  flow(s, [
    { t: 'Apply', d: 'Operator signs up' },
    { t: 'Upload', d: 'Licence · rego · ID' },
    { t: 'Review', d: 'Administrator checks', hi: true },
    { t: 'Verified', d: 'Listed to students' }
  ], { x: M, y: 2.78, w: W - M * 2, h: 0.98 });

  const cy = 4.02, ch = 2.4;
  card(s, { x: M, y: cy, w: COL, h: ch, fill: GREEN_L, line: GREEN });
  cardTitle(s, 'ENFORCED, NOT ADVERTISED', M + 0.28, cy + 0.26, COL - 0.56, GREEN);
  bullets(s, [
    'An unapproved operator is invisible in student search',
    'Documents are reviewed by a person before approval',
    'Approval is pushed to the operator’s device in real time'
  ], { x: M + 0.28, y: cy + 0.66, w: COL - 0.56, h: 1.7, color: '1F4438' });

  const rx = M + COL + 0.5;
  card(s, { x: rx, y: cy, w: COL, h: ch, fill: PAPER_2 });
  cardTitle(s, 'SUPPORTING FEATURES', rx + 0.28, cy + 0.26, COL - 0.56, FAINT);
  bullets(s, [
    'Attendance polls — drivers know who is travelling before departing',
    'Notice board — schedule changes reach every passenger at once',
    'Digital receipts — every payment is evidenced for both sides'
  ], { x: rx + 0.28, y: cy + 0.66, w: COL - 0.56, h: 1.7 });

  s.addNotes('Verification is what allows a student to trust a bus they have never travelled on. Because approval is enforced in the search results, an unverified operator simply cannot take bookings.');
}

/* ============================================================
   SLIDE 7 — close (dark)
   ============================================================ */
{
  const s = pres.addSlide();
  s.background = { color: NAVY };

  s.addText('IN SUMMARY', {
    x: M, y: 0.82, w: 6, h: 0.34, margin: 0,
    fontFace: BODY, fontSize: 12, bold: true, color: AMBER, charSpacing: 2.4
  });
  s.addText('Why this is a genuine e-business', {
    x: M, y: 1.26, w: 11, h: 0.8, margin: 0,
    fontFace: HEAD, fontSize: 40, bold: true, color: PAPER
  });

  const items = [
    { v: 'Online', l: 'PAYPAL CHECKOUT' },
    { v: '10%', l: 'REVENUE PER FARE' },
    { v: '3', l: 'USER ROLES SERVED' },
    { v: '24/7', l: 'SELF-SERVICE' },
    { v: 'Zero', l: 'PAPER RECORDS' }
  ];
  const tw = (W - M * 2 - 0.18 * 4) / 5, th = 1.3;
  items.forEach((it, i) => {
    const x = M + i * (tw + 0.18);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.42, w: tw, h: th, rectRadius: 0.08,
      fill: { color: NAVY_2 }, line: { color: '2C4166', width: 1 }
    });
    s.addText(it.v, {
      x: x + 0.14, y: 2.56, w: tw - 0.28, h: 0.6, margin: 0, valign: 'bottom',
      fontFace: HEAD, fontSize: 27, bold: true, color: i === 1 ? AMBER : PAPER
    });
    s.addText(it.l, {
      x: x + 0.14, y: 3.2, w: tw - 0.28, h: 0.4, margin: 0,
      fontFace: BODY, fontSize: 9.5, bold: true, color: '8B98AD', charSpacing: 0.7
    });
  });

  s.addText('Customers discover the service, choose a plan, pay online and receive the service — without a phone call or a cash handover. The platform earns automatically on every transaction, and both sides of the marketplace are managed from one system.', {
    x: M, y: 4.18, w: 11.4, h: 1.1, margin: 0,
    fontFace: BODY, fontSize: 15, color: 'B9C4D6', lineSpacing: 24
  });

  // route-line motif, closing the loop with the cover
  for (let i = 0; i < 4; i++) {
    s.addShape(pres.ShapeType.ellipse, {
      x: M + i * 0.78, y: 5.72, w: 0.2, h: 0.2,
      fill: { color: i === 3 ? AMBER : '2C4166' }
    });
  }
  s.addShape(pres.ShapeType.rect, { x: M + 0.1, y: 5.8, w: 2.34, h: 0.04, fill: { color: '2C4166' } });

  s.addText('unishuttle.com.au   ·   ABN 12 345 678 901', {
    x: M, y: 6.42, w: 8, h: 0.34, margin: 0,
    fontFace: BODY, fontSize: 11.5, color: '6F7C92'
  });

  s.addNotes('To close: every stage of the customer journey — discovery, purchase, delivery and support — happens online, and the platform monetises automatically through commission.');
}

pres.writeFile({ fileName: 'UniShuttle_Innovative_Features.pptx' })
  .then(f => console.log('written:', f));
