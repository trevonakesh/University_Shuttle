'use client';
import { useState } from 'react';
import Link from 'next/link';
import PublicShell from '../../../components/PublicShell';
import { RoadBand } from '../../../components/HomeArt';
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

  return (
    <PublicShell footer={false}>
      <section className="h-auth">
        <div className="h-auth-inner">
          <div className="h-auth-head">
            {step !== 'done' && (
              <span className="h-kicker">Step {step === 'email' ? 1 : step === 'code' ? 2 : 3} of 3</span>
            )}
            <h1>{HEADINGS[step]}</h1>
            <p>
              {step === 'email' && "Enter your email and we'll send you a 6-digit code."}
              {step === 'code' && `We sent a code to ${email}. Enter it to continue.`}
              {step === 'password' && 'Your code is confirmed. Choose the password you want to use from now on.'}
              {step === 'done' && 'Taking you to the sign-in page…'}
            </p>
          </div>

          <div className="h-auth-card">
            <div className="h-form">
              {notice && step === 'code' && <div className="p-alert green">{notice}</div>}
              {error && <div className="p-alert red" role="alert">{error}</div>}

              {step === 'email' && (
                <form onSubmit={submit(sendCode)} className="h-form">
                  <div className="p-field">
                    <label htmlFor="reset-email">Email address</label>
                    <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@university.edu" autoComplete="email" />
                  </div>
                  <button type="submit" className="p-btn primary" disabled={loading}>
                    {loading ? 'Sending…' : 'Send reset code'}
                  </button>
                </form>
              )}

              {step === 'code' && (
                <form onSubmit={submit(verifyCode)} className="h-form">
                  <div className="p-field">
                    <label htmlFor="reset-code">6-digit code</label>
                    {/* Digits only, so a code pasted with spaces isn't cut short. */}
                    <input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required minLength={6} placeholder="123456" style={{ letterSpacing: '0.25em', fontSize: '22px', fontWeight: 800 }} />
                    <span className="h-hint">Asked more than once? Only the code in the newest email works.</span>
                  </div>
                  <button type="submit" className="p-btn primary" disabled={loading}>
                    {loading ? 'Checking…' : 'Verify code'}
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" className="h-text-btn" disabled={loading} onClick={sendCode}>Send a new code</button>
                    <button type="button" className="h-text-btn" disabled={loading} onClick={() => { setError(null); setNotice(null); setStep('email'); }}>Use a different email</button>
                  </div>
                </form>
              )}

              {step === 'password' && (
                <form onSubmit={submit(savePassword)} className="h-form">
                  <div className="p-field">
                    <label htmlFor="reset-new">New password</label>
                    <input id="reset-new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required {...passwordInputProps} autoComplete="new-password" />
                    <span className="h-hint">{PASSWORD_HINT}.</span>
                  </div>
                  <div className="p-field">
                    <label htmlFor="reset-confirm">Type it again</label>
                    <input id="reset-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                  </div>
                  <button type="submit" className="p-btn primary" disabled={loading}>
                    {loading ? 'Saving…' : 'Set new password'}
                  </button>
                </form>
              )}

              {step === 'done' && <div className="p-alert green" role="status">Password changed. You can now sign in with it.</div>}
            </div>

            <div className="h-auth-foot">
              <Link href="/login" className="h-link">Back to sign in</Link>
            </div>
          </div>
        </div>
        <RoadBand />
      </section>
    </PublicShell>
  );
}
