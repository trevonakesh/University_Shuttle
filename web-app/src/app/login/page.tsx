'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE, setPortalToken, setPortalUser } from '../../lib/portalApi';
import PublicShell from '../../components/PublicShell';
import { RoadBand } from '../../components/HomeArt';
import '../portal/portal.css';
import { useT } from '../../lib/useLang';

export default function PortalLoginPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(t(data.error ?? 'Login failed. Check your credentials.'));
        return;
      }
      const role = data.user?.role;
      // Admins sign in on their own page; this one doesn't point there.
      if (role !== 'STUDENT' && role !== 'DRIVER') {
        setError(t('This page is for student and driver accounts.'));
        return;
      }
      setPortalToken(data.token);
      setPortalUser(data.user);
      window.location.href = role === 'STUDENT' ? '/portal/student' : '/portal/driver';
    } catch {
      setError(t('Could not reach the server. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicShell footer={false}>
      <section className="h-auth">
        <div className="h-auth-inner">
          <div className="h-auth-head">
            <h1>{t("Welcome back")}</h1>
            <p>{t("Sign in to your student or driver account.")}</p>
          </div>

          <div className="h-auth-card">
            <form onSubmit={submit} className="h-form">
              {error && <div className="p-alert red" role="alert">{error}</div>}

              <div className="p-field">
                <label htmlFor="email">{t("Email address")}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={t("you@university.edu")}
                  autoComplete="email"
                />
              </div>
              <div className="p-field">
                <label htmlFor="password">{t("Password")}</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                <Link href="/portal/forgot-password" className="h-link" style={{ fontSize: 15 }}>{t("Forgot password?")}</Link>
              </div>
              <button type="submit" className="p-btn primary" disabled={loading}>
                {loading ? t("Signing in…") : t("Sign in")}
              </button>
            </form>

            <div className="h-auth-foot">
              {t("New to UniShuttle?")} <Link href="/signup" className="h-link">{t("Create an account")}</Link>
            </div>
          </div>
        </div>
        <RoadBand />
      </section>
    </PublicShell>
  );
}
