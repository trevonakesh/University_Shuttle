'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE, setPortalToken, setPortalUser } from '../../lib/portalApi';
import { fontVariables } from '../../lib/fonts';
import RouteNetwork from '../../components/RouteNetwork';
import '../site.css';
import '../portal/portal.css';
import '../auth.css';

export default function PortalLoginPage() {
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
        setError(data.error ?? 'Login failed. Check your credentials.');
        return;
      }
      const role = data.user?.role;
      // Admins sign in on their own page; this one doesn't point there.
      if (role !== 'STUDENT' && role !== 'DRIVER') {
        setError('This page is for student and driver accounts.');
        return;
      }
      setPortalToken(data.token);
      setPortalUser(data.user);
      window.location.href = role === 'STUDENT' ? '/portal/student' : '/portal/driver';
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`portal auth ${fontVariables}`}>
      <RouteNetwork />
      <div className="auth-inner" style={{ maxWidth: '430px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="auth-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '30px', height: '30px' }}>
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 className="auth-title">Uni Shuttle</h1>
          <p className="auth-sub">Student &amp; Driver Portal</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="auth-card-title">Sign in to your account</h2>
          <p className="auth-muted" style={{ marginBottom: '28px' }}>
            Students and drivers sign in here.
          </p>

          {error && (
            <div className="p-alert red" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="p-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@university.edu"
                autoComplete="email"
              />
            </div>
            <div className="p-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <Link href="/portal/forgot-password" className="auth-link" style={{ fontSize: '13px' }}>Forgot password?</Link>
            </div>
            <button type="submit" className="p-btn primary" disabled={loading} style={{ width: '100%', padding: '13px', marginTop: '4px', fontSize: '15px' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-foot">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="auth-link">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
