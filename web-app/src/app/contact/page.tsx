'use client';
import { useState } from 'react';
import PublicShell from '../../components/PublicShell';
import { RoadBand } from '../../components/HomeArt';
import { business } from '../../lib/business';
import { API_BASE } from '../../lib/api';
import '../portal/portal.css';

type Form = { name: string; email: string; phone: string; subject: string; message: string };
const empty: Form = { name: '', email: '', phone: '', subject: 'General enquiry', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState<Form>(empty);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
        setForm(empty);
      } else {
        setError(data.error ?? 'We could not send your message. Please try again.');
      }
    } catch {
      setError('We could not reach our servers. Please email us directly instead.');
    } finally {
      setSending(false);
    }
  };

  const a = business.address;

  return (
    <PublicShell>
      <section className="h-page-head">
        <div className="h-wrap">
          <span className="h-kicker">Contact us</span>
          <h1>Talk to the UniShuttle team</h1>
          <p>
            Looking for a bus on your route, want to register your bus, or have a
            question about a fare? Send us a message.
          </p>
        </div>
        <RoadBand />
      </section>

      <section className="h-section">
        <div className="h-wrap h-contact">
          {/* ---- form ---- */}
          <div className="h-auth-card">
            {sent ? (
              <div className="h-done" role="status">
                <div className="h-done-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </div>
                <h2 style={{ fontSize: '1.6rem' }}>Message sent</h2>
                <p>Thanks for getting in touch. Our team will reply by email.</p>
                <button className="p-btn outline" style={{ marginTop: 20 }} onClick={() => setSent(false)}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="h-form">
                <h2 style={{ fontSize: '1.6rem' }}>Send us a message</h2>

                {error && <div className="p-alert red" role="alert">{error}</div>}

                <div className="p-field">
                  <label htmlFor="c-name">Your name</label>
                  <input id="c-name" required value={form.name} onChange={set('name')} autoComplete="name" />
                </div>

                <div className="h-cards two" style={{ gap: 16 }}>
                  <div className="p-field">
                    <label htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
                  </div>
                  <div className="p-field">
                    <label htmlFor="c-phone">Phone (optional)</label>
                    <input id="c-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" autoComplete="tel" />
                  </div>
                </div>

                <div className="p-field">
                  <label htmlFor="c-subject">What is this about?</label>
                  <select id="c-subject" value={form.subject} onChange={set('subject')}>
                    <option>General enquiry</option>
                    <option>Finding a bus on my route</option>
                    <option>Registering as a driver</option>
                    <option>Fares or payments</option>
                    <option>Report a problem</option>
                  </select>
                </div>

                <div className="p-field">
                  <label htmlFor="c-message">Message</label>
                  <textarea id="c-message" required value={form.message} onChange={set('message')} placeholder="Tell us how we can help…" />
                </div>

                <button className="p-btn primary" type="submit" disabled={sending}>
                  {sending ? 'Sending…' : 'Send message'}
                </button>
                <p className="h-hint">We use your details only to answer your message.</p>
              </form>
            )}
          </div>

          {/* ---- details ---- */}
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="h-card">
              <h3>Contact details</h3>
              <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
                <div>
                  <div className="h-label">Email</div>
                  <a className="h-strong-link" href={`mailto:${business.email}`}>{business.email}</a>
                </div>
                <div>
                  <div className="h-label">Phone</div>
                  <a className="h-strong-link" href={`tel:${business.phoneHref}`}>{business.phone}</a>
                </div>
                <div>
                  <div className="h-label">Office</div>
                  {a.line1}<br />{a.city}, {a.country}
                </div>
              </div>
            </div>

            <div className="h-card">
              <h3>Office hours</h3>
              <div className="h-hours">
                {business.hours.map(h => (
                  <div key={h.days}>
                    <span>{h.days}</span>
                    <span>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
