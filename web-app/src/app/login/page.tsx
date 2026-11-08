'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE, setPortalToken, setPortalUser } from '../../lib/portalApi';
import '../portal/portal.css';

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
    <div className="portal" style={{ background: 'linear-gradient(135deg, #0e7c66 0%, #10203a 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: '#fff', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,.25)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0e7c66" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '30px', height: '30px' }}>
              <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>Uni Shuttle</h1>
          <p style={{ color: 'rgba(255,255,255,.7)', marginTop: '6px', fontSize: '14px' }}>Student & Driver Portal</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '6px', color: '#10203a' }}>Sign in to your account</h2>
          <p style={{ fontSize: '14px', color: '#7a8699', marginBottom: '28px' }}>
            Students and drivers sign in here.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', color: '#991b1b', fontSize: '14px', marginBottom: '20px' }}>
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
              <Link href="/portal/forgot-password" style={{ fontSize: '13px', color: '#0e7c66', fontWeight: 500 }}>Forgot password?</Link>
            </div>
            <button type="submit" className="p-btn primary" disabled={loading} style={{ width: '100%', padding: '13px', marginTop: '4px', fontSize: '15px' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #dde3ec', textAlign: 'center', fontSize: '14px', color: '#7a8699' }}>
            Don&apos;t have an account?{' '}
            <Link href="/#download" style={{ color: '#0e7c66', fontWeight: 600 }}>Download the app</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
