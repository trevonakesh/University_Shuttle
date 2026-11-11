'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '../../../lib/portalApi';
import { PASSWORD_HINT, passwordInputProps } from '../../../lib/password';
import '../portal.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not send the code. Please try again.'); return; }
      if (data.devCode) setDevCode(data.devCode); // dev only
      setMsg(data.message);
      setStep('code');
    } catch { setError('Could not reach the server.'); }
    finally { setLoading(false); }
  };

  const resetPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Reset failed.'); return; }
      setMsg(data.message);
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch { setError('Could not reach the server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="portal" style={{ background: 'linear-gradient(135deg, #0e7c66 0%, #10203a 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#10203a' }}>
            {step === 'email' ? 'Reset your password' : 'Enter your reset code'}
          </h2>
          <p style={{ fontSize: '14px', color: '#7a8699', marginBottom: '28px' }}>
            {step === 'email'
              ? 'Enter your email and we\'ll send a 6-digit reset code.'
              : `We sent a code to ${email}. Enter it below with your new password.`}
          </p>

          {msg && step === 'code' && (
            <div className="p-alert green" style={{ marginBottom: '20px' }}>{msg}</div>
          )}
          {devCode && (
            <div className="p-alert amber" style={{ marginBottom: '20px' }}>
              <strong>Dev mode:</strong> Your code is <strong style={{ fontFamily: 'monospace', fontSize: '18px' }}>{devCode}</strong>
            </div>
          )}
          {error && <div className="p-alert red" style={{ marginBottom: '20px' }}>{error}</div>}

          {step === 'email' ? (
            <form onSubmit={sendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="p-field">
                <label>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@university.edu" />
              </div>
              <button type="submit" className="p-btn primary" disabled={loading} style={{ width: '100%', padding: '13px' }}>
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          ) : msg?.includes('successful') ? (
            <div className="p-alert green">Password changed! Redirecting to login…</div>
          ) : (
            <form onSubmit={resetPwd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="p-field">
                <label>6-digit code</label>
                {/* Digits only, so a code pasted with spaces isn't cut short. */}
                <input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required minLength={6} placeholder="123456" style={{ letterSpacing: '0.2em', fontSize: '20px' }} />
                <span style={{ fontSize: '12px', color: '#7a8699' }}>Asked more than once? Only the code in the newest email works.</span>
              </div>
              <div className="p-field">
                <label>New password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required {...passwordInputProps} autoComplete="new-password" placeholder={PASSWORD_HINT} />
              </div>
              <button type="submit" className="p-btn primary" disabled={loading} style={{ width: '100%', padding: '13px' }}>
                {loading ? 'Resetting…' : 'Set New Password'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <Link href="/login" style={{ color: '#0e7c66', fontWeight: 600 }}>← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
