import { EmailMessage } from './mailer';
import { EmailContent, renderEmail } from './layout';

// One builder per event. Each returns a ready-to-send message; controllers
// call `void sendEmail(emails.xyz(...))` right after the event succeeds.

const web = (p = ''): string => `${(process.env.WEB_APP_URL || 'http://localhost:3000').replace(/\/$/, '')}${p}`;
const PORTAL = () => web('/login');

const build = (to: string, template: string, subject: string, content: EmailContent): EmailMessage => ({
  to,
  template,
  subject,
  ...renderEmail(subject, content)
});

// ---------- formatting ----------

const firstName = (fullName?: string | null): string => (fullName || '').trim().split(/\s+/)[0] || 'there';

export const lkr = (amount: number): string =>
  `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const monthLabel = (month: string): string => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const dayLabel = (date: string): string => {
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

const colomboTime = (at: Date = new Date()): string =>
  `${at.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Colombo'
  })} (Sri Lanka time)`;

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const tripLabel = (tripType: string): string =>
  ({ ROUND_TRIP: 'Round trip', TO_UNI_ONLY: 'To university only', FROM_UNI_ONLY: 'From university only' } as Record<string, string>)[tripType] ?? tripType;

const methodLabel = (method: string): string =>
  ({ BANK_TRANSFER: 'Bank transfer', CASH: 'Cash', PAYHERE: 'Card (PayHere)', IN_APP: 'In-app' } as Record<string, string>)[method] ?? method;

// Turns a user-agent string into something a person recognises.
export const describeDevice = (userAgent?: string): string => {
  const ua = userAgent || '';
  if (!ua) return 'Unknown device';
  if (/dart|okhttp/i.test(ua)) return 'Uni Shuttle mobile app';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || ua.slice(0, 80);
};

// ---------- account & security ----------

export const welcomeStudent = (to: string, fullName: string) =>
  build(to, 'welcome-student', 'Welcome to Uni Shuttle', {
    label: 'Account created',
    tone: 'success',
    preheader: 'Your student account is ready. Find a bus and request a seat.',
    heading: `Welcome, ${firstName(fullName)}`,
    paragraphs: [
      'Your student account is ready.',
      'Next, find a bus going to your university and request a seat. Once the driver approves you, you can pay your monthly fare, answer attendance polls and follow the bus live.'
    ],
    button: { label: 'Find a bus', url: PORTAL() },
    footnote: "If you didn't create this account, contact us and we'll remove it."
  });

export const driverApplicationReceived = (to: string, fullName: string) =>
  build(to, 'driver-application', "We've received your driver application", {
    label: 'Under review',
    tone: 'info',
    preheader: "An administrator will check your documents. We'll email you with the decision.",
    heading: `Thanks for applying, ${firstName(fullName)}`,
    paragraphs: [
      "We've received your application to run a bus on Uni Shuttle.",
      'An administrator will check your documents (NIC, driving licence and vehicle registration) before your bus is shown to students.',
      "We'll email you as soon as a decision is made."
    ]
  });

export const driverApproved = (to: string, fullName: string) =>
  build(to, 'driver-approved', 'Your driver account is approved', {
    label: 'Approved',
    tone: 'success',
    preheader: 'Your documents are verified and your bus is now visible to students.',
    heading: "You're approved: your bus is live",
    paragraphs: [
      `Good news, ${firstName(fullName)}. Your documents have been verified.`,
      'Students going to your destination university can now find your bus and request a seat. Sign in to review requests, record fares and share your live location.'
    ],
    button: { label: 'Open the driver portal', url: PORTAL() }
  });

export const driverRejected = (to: string, fullName: string) =>
  build(to, 'driver-rejected', 'Update on your driver application', {
    label: 'Not approved',
    tone: 'danger',
    preheader: "We weren't able to approve your driver account.",
    heading: "Your application wasn't approved",
    paragraphs: [
      `Hi ${firstName(fullName)}, after reviewing your documents we weren't able to approve your driver account.`,
      "If you think this is a mistake, or you'd like to resubmit with updated documents, get in touch."
    ],
    button: { label: 'Contact us', url: web('/contact') }
  });

export const accountCreatedByAdmin = (to: string, fullName: string, role: 'STUDENT' | 'DRIVER') =>
  build(to, 'account-created', 'Your Uni Shuttle account is ready', {
    label: 'Account created',
    tone: 'success',
    preheader: 'An administrator created an account for you.',
    heading: `Welcome, ${firstName(fullName)}`,
    paragraphs: [
      `An administrator created a ${role === 'DRIVER' ? 'driver' : 'student'} account for you with this email address.`,
      'Sign in with the password they gave you. To choose your own password, use "Forgot password?" on the sign-in page.'
    ],
    button: { label: 'Sign in', url: PORTAL() }
  });

export const signInAlert = (to: string, fullName: string, device: string, ip: string, at = new Date()) =>
  build(to, 'sign-in', 'New sign-in to your Uni Shuttle account', {
    label: 'Signed in',
    tone: 'info',
    preheader: `Signed in from ${device}.`,
    heading: 'You signed in',
    paragraphs: [`Hi ${firstName(fullName)}, your account was just signed in to.`],
    details: [['Time', colomboTime(at)], ['Device', device], ['IP address', ip || 'Unknown']],
    button: { label: "Wasn't you? Reset your password", url: web('/portal/forgot-password') },
    footnote: "If this was you, there's nothing to do."
  });

export const passwordResetCode = (to: string, fullName: string, code: string, minutes: number) =>
  build(to, 'password-reset', 'Your password reset code', {
    label: 'Password reset',
    tone: 'warning',
    preheader: `Your code expires in ${minutes} minutes.`,
    heading: 'Reset your password',
    paragraphs: [`Hi ${firstName(fullName)}, enter this code to choose a new password. It expires in ${minutes} minutes.`],
    code,
    footnote: "If you didn't ask to reset your password, ignore this email. Your password stays the same."
  });

export const passwordChanged = (to: string, fullName: string, at = new Date()) =>
  build(to, 'password-changed', 'Your password was changed', {
    label: 'Security',
    tone: 'warning',
    preheader: 'The password for your account was just changed.',
    heading: 'Your password was changed',
    paragraphs: [`Hi ${firstName(fullName)}, the password for your Uni Shuttle account was just changed.`],
    details: [['Time', colomboTime(at)]],
    button: { label: "Wasn't you? Contact us", url: web('/contact') },
    footnote: "If you made this change, there's nothing to do."
  });

// ---------- seats & daily rides ----------

interface BusInfo { fullName: string; busRegNumber?: string | null; routeName?: string | null; pickupTime?: string | null; monthlyFee?: number }

export const seatApproved = (to: string, studentName: string, bus: BusInfo) =>
  build(to, 'seat-approved', `Your seat on ${bus.busRegNumber || 'the bus'} is confirmed`, {
    label: 'Seat approved',
    tone: 'success',
    preheader: `${bus.fullName} approved your seat request.`,
    heading: 'Your seat is confirmed',
    paragraphs: [
      `Hi ${firstName(studentName)}, ${bus.fullName} approved your seat request.`,
      'Pay your monthly fare before the 10th of each month to keep your account active.'
    ],
    details: [
      ['Bus', bus.busRegNumber || '-'],
      ['Route', bus.routeName || '-'],
      ['Pickup time', bus.pickupTime || '-'],
      ...(bus.monthlyFee ? [['Monthly fare', lkr(bus.monthlyFee)] as [string, string]] : [])
    ],
    button: { label: 'Open the portal', url: PORTAL() }
  });

export const seatRejected = (to: string, studentName: string, bus: BusInfo) =>
  build(to, 'seat-rejected', 'Update on your seat request', {
    label: 'Not approved',
    tone: 'danger',
    preheader: `${bus.fullName} wasn't able to offer you a seat.`,
    heading: "Your seat request wasn't approved",
    paragraphs: [
      `Hi ${firstName(studentName)}, ${bus.fullName} (${bus.busRegNumber || 'bus'}) wasn't able to offer you a seat.`,
      'You can request a seat on another bus that goes to your university.'
    ],
    button: { label: 'Find another bus', url: PORTAL() }
  });

interface RideInfo { date: string; tripType: string; fareAmount: number | null; driverName: string }

export const dailyRideApproved = (to: string, studentName: string, ride: RideInfo) =>
  build(to, 'daily-ride-approved', `Daily ride approved: ${dayLabel(ride.date)}`, {
    label: 'Ride approved',
    tone: 'success',
    preheader: 'Pay for the ride in the app before you travel.',
    heading: 'Your daily ride is approved',
    paragraphs: [`Hi ${firstName(studentName)}, ${ride.driverName} approved your ride. Pay for it in the app before you travel.`],
    details: [
      ['Date', dayLabel(ride.date)],
      ['Trip', tripLabel(ride.tripType)],
      ['Fare', ride.fareAmount ? lkr(ride.fareAmount) : '-']
    ],
    button: { label: 'Pay for the ride', url: PORTAL() }
  });

export const dailyRideRejected = (to: string, studentName: string, ride: RideInfo) =>
  build(to, 'daily-ride-rejected', `Daily ride not approved: ${dayLabel(ride.date)}`, {
    label: 'Not approved',
    tone: 'danger',
    preheader: `${ride.driverName} can't take you on ${dayLabel(ride.date)}.`,
    heading: "Your daily ride wasn't approved",
    paragraphs: [`Hi ${firstName(studentName)}, ${ride.driverName} can't take you on this day. You haven't been charged.`],
    details: [['Date', dayLabel(ride.date)], ['Trip', tripLabel(ride.tripType)]]
  });

// ---------- payments ----------

export const monthlyFareLabel = (month: string): string => `Monthly fare, ${monthLabel(month)}`;
export const dailyRideLabel = (date: string): string => `Daily ride, ${dayLabel(date)}`;

interface ReceiptInfo { description: string; amount: number; method: string; reference?: string | null; paidTo: string; at?: Date }

export const paymentReceipt = (to: string, studentName: string, r: ReceiptInfo) =>
  build(to, 'payment-receipt', `Payment receipt: ${r.description}`, {
    label: 'Payment received',
    tone: 'success',
    preheader: `${lkr(r.amount)} for ${r.description}.`,
    heading: 'Thanks, your payment went through',
    paragraphs: [`Hi ${firstName(studentName)}, here's your receipt. Keep this email for your records.`],
    details: [
      ['Paid for', r.description],
      ['Amount', lkr(r.amount)],
      ['Method', methodLabel(r.method)],
      ['Paid to', r.paidTo],
      ['Reference', r.reference || '-'],
      ['Date', colomboTime(r.at)]
    ]
  });

export const cashRecorded = (to: string, studentName: string, month: string, amount: number, driverName: string) =>
  build(to, 'cash-recorded', `Cash payment recorded: ${monthLabel(month)}`, {
    label: 'Payment recorded',
    tone: 'success',
    preheader: `${driverName} recorded your cash payment for ${monthLabel(month)}.`,
    heading: 'Your cash payment was recorded',
    paragraphs: [
      `Hi ${firstName(studentName)}, ${driverName} recorded your cash payment for ${monthLabel(month)}.`,
      'Your account is in good standing for the month.'
    ],
    details: [['Month', monthLabel(month)], ['Amount', lkr(amount)], ['Recorded by', driverName], ['Date', colomboTime()]],
    footnote: "If you didn't make this payment, contact your driver or us."
  });

export const markedNotTravelling = (to: string, studentName: string, month: string, amount: number, driverName: string) =>
  build(to, 'not-travelling', `Marked as not travelling: ${monthLabel(month)}`, {
    label: 'Account frozen',
    tone: 'warning',
    preheader: `Your account is frozen for ${monthLabel(month)}.`,
    heading: 'Marked as not travelling this month',
    paragraphs: [
      `Hi ${firstName(studentName)}, ${driverName} marked you as not travelling in ${monthLabel(month)}, so your account is frozen for the rest of the month. It unfreezes automatically next month.`,
      `Planning to travel after all? Pay the ${monthLabel(month)} fare (${lkr(amount)}) and your account is reactivated straight away.`
    ],
    button: { label: 'Pay the fare', url: PORTAL() }
  });

export const duplicatePaymentRefund = (to: string, studentName: string, month: string, amount: number, reference: string) =>
  build(to, 'refund-due', `You were charged twice for ${monthLabel(month)}`, {
    label: 'Refund due',
    tone: 'danger',
    preheader: 'Your card payment arrived after the month was already paid.',
    heading: 'Your card payment needs a refund',
    paragraphs: [
      `Hi ${firstName(studentName)}, your card payment went through after ${monthLabel(month)} had already been paid, so you were charged twice. The extra payment was not passed to your driver.`,
      "Contact us and we'll refund it."
    ],
    details: [['Month', monthLabel(month)], ['Amount', lkr(amount)], ['Reference', reference]],
    button: { label: 'Contact us', url: web('/contact') }
  });

export const fareReminder = (to: string, studentName: string, month: string, amount: number, dueDay: number, driverName: string) =>
  build(to, 'fare-reminder', `Your ${monthLabel(month)} fare is due by the ${ordinal(dueDay)}`, {
    label: 'Payment due',
    tone: 'warning',
    preheader: `Pay ${lkr(amount)} before the ${ordinal(dueDay)} to keep your account active.`,
    heading: 'Your monthly fare is due soon',
    paragraphs: [
      `Hi ${firstName(studentName)}, please pay your ${monthLabel(month)} fare before the ${ordinal(dueDay)} to keep your account active.`,
      'You can pay by card in the app, or hand the fare to your driver.'
    ],
    details: [['Month', monthLabel(month)], ['Amount', lkr(amount)], ['Due by', `${ordinal(dueDay)} of the month`], ['Driver', driverName]],
    button: { label: 'Pay now', url: PORTAL() }
  });

export const accountFrozen = (to: string, studentName: string, month: string, amount: number, dueDay: number) =>
  build(to, 'account-frozen', `Your account is frozen: ${monthLabel(month)} fare unpaid`, {
    label: 'Account frozen',
    tone: 'danger',
    preheader: 'Pay the fare and your account unfreezes straight away.',
    heading: 'Your account is frozen',
    paragraphs: [
      `Hi ${firstName(studentName)}, your ${monthLabel(month)} fare (${lkr(amount)}) wasn't paid by the ${ordinal(dueDay)}, so seat requests and attendance polls are paused.`,
      'Pay the fare and your account unfreezes straight away.'
    ],
    button: { label: 'Pay now', url: PORTAL() }
  });

// ---------- driver payouts ----------

export const payoutRequestedDriver = (to: string, driverName: string, amount: number) =>
  build(to, 'payout-requested', "We've received your payout request", {
    label: 'Under review',
    tone: 'info',
    preheader: `${lkr(amount)} payout request received.`,
    heading: 'Payout request received',
    paragraphs: [
      `Hi ${firstName(driverName)}, you asked to withdraw ${lkr(amount)} from your wallet. An administrator will review it and pay it to your bank account.`,
      "Your wallet balance doesn't change until the payout is approved."
    ],
    details: [['Amount', lkr(amount)], ['Requested', colomboTime()]]
  });

export const payoutRequestedAdmin = (to: string, driverName: string, busRegNumber: string | null, amount: number) =>
  build(to, 'payout-request-admin', `Payout request from ${driverName}`, {
    label: 'Action needed',
    tone: 'warning',
    preheader: `${driverName} asked to withdraw ${lkr(amount)}.`,
    heading: 'A driver requested a payout',
    paragraphs: ['Review the request and pay it, or reject it with a reason.'],
    details: [['Driver', driverName], ['Bus', busRegNumber || '-'], ['Amount', lkr(amount)], ['Requested', colomboTime()]],
    button: { label: 'Review in the admin panel', url: web('/admin/earnings') }
  });

export const payoutSent = (to: string, driverName: string, amount: number, method: string, reference: string | null, remaining: number) =>
  build(to, 'payout-sent', `Payout sent: ${lkr(amount)}`, {
    label: 'Payout sent',
    tone: 'success',
    preheader: `${lkr(amount)} paid by ${methodLabel(method).toLowerCase()}.`,
    heading: 'Your payout is on its way',
    paragraphs: [`Hi ${firstName(driverName)}, your payout has been paid.`],
    details: [
      ['Amount', lkr(amount)],
      ['Method', methodLabel(method)],
      ['Reference', reference || '-'],
      ['Remaining wallet balance', lkr(remaining)]
    ]
  });

export const payoutRejected = (to: string, driverName: string, amount: number, reason: string | null) =>
  build(to, 'payout-rejected', "Your payout request wasn't approved", {
    label: 'Not approved',
    tone: 'danger',
    preheader: 'Your wallet balance is unchanged.',
    heading: 'Payout request not approved',
    paragraphs: [
      `Hi ${firstName(driverName)}, your request to withdraw ${lkr(amount)} wasn't approved, and your wallet balance is unchanged.`,
      ...(reason ? [`Reason given: ${reason}`] : [])
    ],
    button: { label: 'Open your wallet', url: PORTAL() }
  });

// ---------- website contact form ----------

export const contactAutoReply = (to: string, name: string, subject: string) =>
  build(to, 'contact-received', "We've received your message", {
    label: 'Message received',
    tone: 'info',
    preheader: "Thanks for getting in touch. We'll reply soon.",
    heading: `Thanks, ${firstName(name)}`,
    paragraphs: ["Thanks for getting in touch. We've received your message and will reply as soon as we can."],
    details: [['Subject', subject]]
  });

export const contactToBusiness = (to: string, m: { name: string; email: string; phone: string | null; subject: string; message: string }) =>
  build(to, 'contact-inbox', `New enquiry: ${m.subject}`, {
    label: 'New enquiry',
    tone: 'info',
    preheader: `${m.name}: ${m.message.slice(0, 90)}`,
    heading: `Message from ${m.name}`,
    paragraphs: m.message.split(/\r?\n+/).filter(Boolean),
    details: [['Name', m.name], ['Email', m.email], ['Phone', m.phone || '-'], ['Subject', m.subject]],
    button: { label: 'Open in the admin panel', url: web('/admin/messages') }
  });
