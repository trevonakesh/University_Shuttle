import nodemailer, { Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Transactional email over SMTP. Any provider works (SendGrid, Brevo, Resend,
// Amazon SES, Gmail…) — they all offer SMTP credentials — so switching
// provider is a .env change, not a code change.
//
// When SMTP_HOST is not set (local development, demos) nothing is sent:
// each email is saved to backend/.emails/ as an HTML file you can open in a
// browser, and listed in backend/.emails/outbox.jsonl.

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string; // short name, used for logs and captured filenames
}

const OUTBOX_DIR = path.join(__dirname, '../../../.emails');

export const emailConfigured = (): boolean => Boolean(process.env.SMTP_HOST);

let transporter: Transporter | null = null;
const getTransporter = (): Transporter => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    });
  }
  return transporter;
};

const capture = async (msg: EmailMessage): Promise<void> => {
  await fs.promises.mkdir(OUTBOX_DIR, { recursive: true });
  const at = new Date().toISOString();
  const file = `${at.replace(/[:.]/g, '-')}-${msg.template}.html`;
  await fs.promises.writeFile(path.join(OUTBOX_DIR, file), msg.html, 'utf8');
  await fs.promises.appendFile(
    path.join(OUTBOX_DIR, 'outbox.jsonl'),
    JSON.stringify({ at, to: msg.to, subject: msg.subject, template: msg.template, file }) + '\n',
    'utf8'
  );
  console.log(`[email] not sent (SMTP not configured): "${msg.subject}" -> ${msg.to}  saved as .emails/${file}`);
};

// Never throws: a failed email is logged, and the request that triggered it
// still succeeds. Callers fire-and-forget with `void sendEmail(...)`.
export const sendEmail = async (msg: EmailMessage | null | undefined): Promise<boolean> => {
  if (!msg || !msg.to) return false;
  try {
    if (!emailConfigured()) {
      await capture(msg);
      return true;
    }
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'Uni Shuttle <no-reply@unishuttle.lk>',
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      ...(process.env.EMAIL_REPLY_TO ? { replyTo: process.env.EMAIL_REPLY_TO } : {})
    });
    return true;
  } catch (error: any) {
    console.error(`[email] failed to send "${msg.subject}" to ${msg.to}: ${error?.message ?? error}`);
    return false;
  }
};

// Printed once at startup so a production server without SMTP is noticed.
export const logEmailMode = (): void => {
  if (emailConfigured()) {
    console.log(`[email] sending via SMTP host ${process.env.SMTP_HOST}`);
  } else {
    console.warn('[email] SMTP_HOST not set: emails are saved to backend/.emails/ instead of being sent');
  }
};
