// Shared layout for every Uni Shuttle email. Email clients (Gmail, Outlook,
// mobile mail apps) ignore <style> blocks and modern CSS, so this uses nested
// tables and inline styles only. Every interpolated value is HTML-escaped:
// names, notes and contact-form messages come from users.

export type Tone = 'info' | 'success' | 'warning' | 'danger';

export interface EmailContent {
  label: string;                  // short status pill, e.g. "Payment received"
  tone: Tone;
  preheader: string;              // preview text shown next to the subject in the inbox
  heading: string;
  paragraphs: string[];
  details?: Array<[string, string]>;
  code?: string;                  // large one-time code (password reset)
  button?: { label: string; url: string };
  footnote?: string;
}

const NAVY = '#10203a';
const MUTED = '#5c6b80';
const GREEN = '#0e7c66';
const FONT = 'Arial, Helvetica, sans-serif';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  info:    { bg: '#e8eef7', fg: NAVY },
  success: { bg: '#e3f2ec', fg: GREEN },
  warning: { bg: '#fdf0e1', fg: '#9a5510' },
  danger:  { bg: '#fbe8e6', fg: '#a83a32' }
};

export const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const webUrl = (): string => (process.env.WEB_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export const renderEmail = (subject: string, c: EmailContent): { html: string; text: string } => {
  const tone = TONES[c.tone];

  const paragraphs = c.paragraphs
    .map(p => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:23px;color:${NAVY};">${esc(p)}</p>`)
    .join('');

  const code = c.code
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;">
         <tr><td align="center" style="background:#f3f5f9;border-radius:10px;padding:18px 12px;font-family:'Courier New', Courier, monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:${NAVY};">${esc(c.code)}</td></tr>
       </table>`
    : '';

  const details = c.details && c.details.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border-collapse:collapse;">
         ${c.details.map(([label, value]) => `
         <tr>
           <td style="padding:10px 0;border-top:1px solid #e6eaf0;font-family:${FONT};font-size:14px;color:${MUTED};">${esc(label)}</td>
           <td align="right" style="padding:10px 0;border-top:1px solid #e6eaf0;font-family:${FONT};font-size:14px;font-weight:bold;color:${NAVY};">${esc(value)}</td>
         </tr>`).join('')}
       </table>`
    : '';

  const button = c.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px;">
         <tr><td style="border-radius:8px;background:${GREEN};">
           <a href="${esc(c.button.url)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(c.button.label)}</a>
         </td></tr>
       </table>`
    : '';

  const footnote = c.footnote
    ? `<p style="margin:18px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">${esc(c.footnote)}</p>`
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef1f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f5;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 4px 14px;font-family:${FONT};font-size:16px;font-weight:bold;color:${NAVY};">
        <span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:#e8912f;margin-right:7px;"></span>Uni Shuttle
      </td></tr>
      <tr><td style="background:#ffffff;border:1px solid #dde3ec;border-radius:12px;padding:30px 30px 26px;">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${tone.bg};color:${tone.fg};font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:0.6px;text-transform:uppercase;">${esc(c.label)}</span>
        <h1 style="margin:14px 0 16px;font-family:${FONT};font-size:22px;line-height:29px;color:${NAVY};">${esc(c.heading)}</h1>
        ${paragraphs}
        ${code}
        ${details}
        ${button}
        ${footnote}
      </td></tr>
      <tr><td style="padding:18px 4px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#7d8798;">
        You're receiving this because you have a Uni Shuttle account, or contacted us.
        Questions? <a href="${esc(webUrl())}/contact" style="color:${GREEN};">Contact us</a>.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    c.heading,
    '',
    ...c.paragraphs,
    ...(c.code ? ['', `Code: ${c.code}`] : []),
    ...(c.details && c.details.length ? ['', ...c.details.map(([l, v]) => `${l}: ${v}`)] : []),
    ...(c.button ? ['', `${c.button.label}: ${c.button.url}`] : []),
    ...(c.footnote ? ['', c.footnote] : []),
    '',
    '— Uni Shuttle',
    `${webUrl()}/contact`
  ].join('\n');

  return { html, text };
};
