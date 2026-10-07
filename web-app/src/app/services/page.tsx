import Link from 'next/link';
import SiteChrome from '../../components/SiteChrome';
import { services } from '../../lib/business';

export const metadata = {
  title: 'Services — Uni Shuttle',
  description:
    'Monthly bus subscriptions, live GPS tracking, attendance polls, digital fare management, online fare collection and operator verification.'
};

export default function ServicesPage() {
  const forStudents = services.filter(s => s.audience.includes('students'));
  const forOperators = services.filter(s => !s.audience.includes('students'));

  const Group = ({ title, note, items }: { title: string; note: string; items: typeof services }) => (
    <div style={{ marginBottom: 56 }}>
      <div className="section-head" style={{ marginBottom: 30 }}>
        <span className="eyebrow">{title}</span>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.1rem)' }}>{note}</h2>
      </div>
      <div className="grid-2">
        {items.map(s => (
          <article className="card" key={s.title}>
            <span className="tag">{s.audience}</span>
            <h3 style={{ marginTop: 12 }}>{s.title}</h3>
            <p style={{ marginTop: 8 }}>{s.description}</p>
            <ul className="ticks">
              {s.points.map(p => <li key={p}>{p}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <SiteChrome>
      <section className="page-head">
        <div className="wrap">
          <span className="eyebrow">Our services</span>
          <h1>Everything we do, in one place</h1>
          <p>
            Uni Shuttle serves two sides of the same journey: students who need a
            dependable ride to campus, and the operators who run it.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Group title="For students" note="Get to campus without the guesswork" items={forStudents} />
          <Group title="For operators" note="Run your service like a business" items={forOperators} />

          <div className="pay-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem' }}>Not sure which plan fits?</h3>
            <p style={{ color: 'var(--ink-soft)', marginTop: 10, maxWidth: '52ch', marginInline: 'auto' }}>
              Tell us your campus and travel days and we will recommend an
              operator on your route.
            </p>
            <div className="hero-actions" style={{ justifyContent: 'center', marginTop: 22 }}>
              <Link href="/pricing" className="btn-cta">Compare plans</Link>
              <Link href="/contact" className="btn-ghost">Ask a question</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
