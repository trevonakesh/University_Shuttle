'use client';
import { useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '../../../lib/portalApi';
import { PASSWORD_HINT, passwordInputProps } from '../../../lib/password';
import '../portal.css';

// Three steps, one at a time: email, then the emailed code, then the new
// password. The password step only opens once the server confirms the code.
type Step = 'email' | 'code' | 'password' | 'done';

const HEADINGS: Record<Step, string> = {
  email: 'Reset your password',
  code: 'Enter your reset code',
  password: 'Choose a new password',
  done: 'Password changed'
};

const post = async (path: string, body: object) => {
  const res = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { ok: res.ok, data: await res.json() };
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Runs one request with the shared loading and error handling.
  const run = async (action: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await action();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const sendCode = () => run(async () => {
    const { ok, data } = await post('forgot-password', { email });
    if (!ok) { setError(data.error ?? 'Could not send the code. Please try again.'); return; }
    setCode('');
    setNotice(data.message);
    setStep('code');
  });

  const verifyCode = () => run(async () => {
    const { ok, data } = await post('verify-reset-code', { email, code });
    if (!ok) { setError(data.error ?? 'Could not check the code. Please try again.'); return; }
    setResetToken(data.resetToken);
    setNotice(null);
    setStep('password');
  });

  const savePassword = () => run(async () => {
    if (newPassword !== confirmPassword) { setError("The two passwords don't match."); return; }
    const { ok, data } = await post('reset-password', { resetToken, newPassword });
    if (!ok) {
      setError(data.error ?? 'Could not change the password.');
      // The confirmed code is only good for a few minutes; start over if it ran out.
      if (data.code === 'RESET_EXPIRED') { setNewPassword(''); setConfirmPassword(''); setNotice(null); setStep('email'); }
      return;
    }
    setStep('done');
    setTimeout(() => { window.location.href = '/login'; }, 2000);
  });

  const submit = (action: () => void) => (e: React.FormEvent) => { e.preventDefault(); action(); };
  const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' };
  const mainButton: React.CSSProperties = { width: '100%', padding: '13px' };
  const linkButton: React.CSSProperties = { background: 'none', border: 'none', padding: 0, color: '#0e7c66', fontWeight: 600, fontSize: '13px', cursor: 'pointer' };

  return (
    <div className="portal" style={{ background: 'linear-gradient(135deg, #0e7c66 0%, #10203a 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
          {step !== 'done' && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0e7c66', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Step {step === 'email' ? 1 : step === 'code' ? 2 : 3} of 3
            </div>
          )}
          <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#10203a' }}>{HEADINGS[step]}</h2>
          <p style={{ fontSize: '14px', color: '#7a8699', marginBottom: '28px' }}>
            {step === 'email' && "Enter your email and we'll send a 6-digit reset code."}
            {step === 'code' && `We sent a code to ${email}. Enter it to continue.`}
            {step === 'password' && 'Your code is confirmed. Choose the password you want to use from now on.'}
            {step === 'done' && 'Taking you to the sign-in page…'}
          </p>

          {notice && step === 'code' && <div className="p-alert green" style={{ marginBottom: '20px' }}>{notice}</div>}
          {error && <div className="p-alert red" role="alert" style={{ marginBottom: '20px' }}>{error}</div>}

          {step === 'email' && (
            <form onSubmit={submit(sendCode)} style={formStyle}>
              <div className="p-field">
                <label htmlFor="reset-email">Email address</label>
                <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@university.edu" />
              </div>
              <button type="submit" className="p-btn primary" disabled={loading} style={mainButton}>
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={submit(verifyCode)} style={formStyle}>
              <div className="p-field">
                <label htmlFor="reset-code">6-digit code</label>
                {/* Digits only, so a code pasted with spaces isn't cut short. */}
                <input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required minLength={6} placeholder="123456" style={{ letterSpacing: '0.2em', fontSize: '20px' }} />
                <span style={{ fontSize: '12px', color: '#7a8699' }}>Asked more than once? Only the code in the newest email works.</span>
              </div>
              <button type="submit" className="p-btn primary" disabled={loading} style={mainButton}>
                {loading ? 'Checking…' : 'Verify Code'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <button type="button" style={linkButton} disabled={loading} onClick={sendCode}>Send a new code</button>
                <button type="button" style={linkButton} disabled={loading} onClick={() => { setError(null); setNotice(null); setStep('email'); }}>Use a different email</button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={submit(savePassword)} style={formStyle}>
              <div className="p-field">
                <label htmlFor="reset-new">New password</label>
                <input id="reset-new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required {...passwordInputProps} autoComplete="new-password" />
                <span style={{ fontSize: '12px', color: '#7a8699' }}>{PASSWORD_HINT}.</span>
              </div>
              <div className="p-field">
                <label htmlFor="reset-confirm">Type it again</label>
                <input id="reset-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <button type="submit" className="p-btn primary" disabled={loading} style={mainButton}>
                {loading ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          )}

          {step === 'done' && <div className="p-alert green">Password changed. You can now sign in with it.</div>}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <Link href="/login" style={{ color: '#0e7c66', fontWeight: 600 }}>← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
