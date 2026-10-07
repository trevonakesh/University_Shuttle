'use client';
import { useState } from 'react';
import { API_BASE, setToken } from '../../lib/api';

export default function LoginPage() {
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
        setError(data.error ?? 'Login failed');
        return;
      }
      if (data.user?.role !== 'ADMIN') {
        setError('This account is not an administrator.');
        return;
      }
      setToken(data.token);
      window.location.href = '/admin';
    } catch {
      setError('Could not reach the backend. Is the API server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={submit} className="glass-panel" style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="sidebar-logo" style={{ marginBottom: 0, textAlign: 'center' }}>Uni Shuttle Admin</div>
        <p className="subtitle" style={{ marginBottom: 0, textAlign: 'center' }}>Sign in to manage the platform</p>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '12px' }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid var(--surface-border)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '14px'
};
