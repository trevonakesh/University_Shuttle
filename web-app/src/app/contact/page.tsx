'use client';
import { useState } from 'react';
import SiteChrome from '../../components/SiteChrome';
import RouteNetwork from '../../components/RouteNetwork';
import { business } from '../../lib/business';
import { API_BASE } from '../../lib/api';

type Form = { name: string; email: string; phone: string; subject: string; message: string };
const empty: Form = { name: '', email: '', phone: '', subject: 'General enquiry', message: '' };

const label: React.CSSProperties = {
  fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)'
};

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
    <SiteChrome>
      <section className="page-head">
        <RouteNetwork />
        <div className="wrap">
          <span className="eyebrow">Contact us</span>
          <h1>Talk to the UniShuttle team</h1>
          <p>
            Looking for a bus on your route, want to register your bus as a driver,
            or have a question about a payment? Send us a message.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="grid-2" style={{ alignItems: 'start', gap: 34 }}>
            {/* ---- form ---- */}
            <div className="pay-panel">
              {sent ? (
                <div className="success-box" style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 40, lineHeight: 1 }}>✓</div>
                  <h2 style={{ fontSize: '1.4rem', marginTop: 14 }}>Message sent</h2>
                  <p style={{ color: 'var(--ink-soft)', marginTop: 10 }}>
                    Thanks for getting in touch. Our team will reply by email.
                  </p>
                  <button className="btn-ghost" style={{ marginTop: 20 }} onClick={() => setSent(false)}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
                  <h2 style={{ fontSize: '1.3rem' }}>Send us a message</h2>

                  {error && <div className="field-error" role="alert">{error}</div>}

                  <div className="field">
                    <label htmlFor="c-name">Your name</label>
                    <input id="c-name" required value={form.name} onChange={set('name')} />
                  </div>

                  <div className="grid-2" style={{ gap: 16 }}>
                    <div className="field">
                      <label htmlFor="c-email">Email</label>
                      <input id="c-email" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
                    </div>
                    <div className="field">
                      <label htmlFor="c-phone">Phone (optional)</label>
                      <input id="c-phone" value={form.phone} onChange={set('phone')} placeholder="07X XXX XXXX" />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="c-subject">What is this about?</label>
                    <select id="c-subject" value={form.subject} onChange={set('subject')}>
                      <option>General enquiry</option>
                      <option>Finding a bus on my route</option>
                      <option>Registering as a driver</option>
                      <option>Fares or payments</option>
                      <option>Report a problem</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="c-message">Message</label>
                    <textarea id="c-message" required value={form.message} onChange={set('message')} placeholder="Tell us how we can help…" />
                  </div>

                  <button className="btn-cta" type="submit" disabled={sending} style={{ justifyContent: 'center' }}>
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                  <p style={{ fontSize: 12.8, color: 'var(--ink-faint)' }}>
                    We use your details only to answer your enquiry.
                  </p>
                </form>
              )}
            </div>

            {/* ---- details ---- */}
            <div style={{ display: 'grid', gap: 20 }}>
              <div className="card">
                <h3 style={{ fontSize: '1.05rem' }}>Contact details</h3>
                <div style={{ display: 'grid', gap: 16, marginTop: 16, fontSize: 14.8 }}>
                  <div>
                    <div style={label}>Email</div>
                    <a href={`mailto:${business.email}`} style={{ color: 'var(--signal-dk)', fontWeight: 600 }}>{business.email}</a>
                  </div>
                  <div>
                    <div style={label}>Phone</div>
                    <a href={`tel:${business.phoneHref}`} style={{ color: 'var(--signal-dk)', fontWeight: 600 }}>{business.phone}</a>
                  </div>
                  <div>
                    <div style={label}>Office</div>
                    {a.line1}<br />{a.city}, {a.country}
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.05rem' }}>Office hours</h3>
                <div style={{ display: 'grid', gap: 9, marginTop: 14, fontSize: 14.6 }}>
                  {business.hours.map(h => (
                    <div key={h.days} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ color: 'var(--ink-soft)' }}>{h.days}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13.5 }}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
