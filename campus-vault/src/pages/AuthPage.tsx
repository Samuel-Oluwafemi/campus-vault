import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '@/firebase/client';
import { firebaseAuthService, getAuthErrorMessage } from '@/services/firebaseAuthService';
import { credentialsSchema, registrationSchema } from '@/validators/auth';
import { z } from 'zod';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';

function getMode(pathname: string): AuthMode {
  if (pathname === '/register') return 'register';
  if (pathname === '/forgot-password') return 'forgot';
  if (pathname === '/verify-email') return 'verify';
  return 'login';
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = getMode(location.pathname);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return firebaseAuthService.observe(
      (currentUser) => setUser(currentUser),
      (authError) => {
        if (isFirebaseConfigured()) setError(getAuthErrorMessage(authError));
      },
    );
  }, []);

  useEffect(() => {
    setError('');
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    if (mode === 'forgot') {
      const emailResult = z.string().trim().email('Enter a valid email address.').safeParse(email);
      if (!emailResult.success) {
        setError(emailResult.error.issues[0]?.message ?? 'Enter a valid email address.');
        return;
      }
    } else {
      const parsed = mode === 'register'
        ? registrationSchema.safeParse({ fullName, email, password, confirmPassword })
        : credentialsSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check the information you entered.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'register') {
        const account = await firebaseAuthService.register(fullName.trim(), email.trim(), password);
        setUser(account);
        navigate('/verify-email', { replace: true });
        setNotice('Your account is ready. Check your inbox for the verification link.');
      } else if (mode === 'login') {
        const account = await firebaseAuthService.login(email.trim(), password);
        setUser(account);
        if (!account.emailVerified) {
          navigate('/verify-email', { replace: true });
        } else {
          setNotice('You are signed in. The student library is not connected yet.');
        }
      } else if (mode === 'forgot') {
        await firebaseAuthService.requestPasswordReset(email.trim());
        setNotice('If an account exists for that email, a password reset link has been sent.');
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function refreshVerification() {
    if (!user) {
      setError('Sign in with the account you want to verify, then return to this page.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const refreshedUser = await firebaseAuthService.refreshVerification(user);
      setUser(refreshedUser);
      if (refreshedUser?.emailVerified) {
        setNotice('Your email is verified. Protected student features will be available when implemented.');
      } else {
        setNotice('Verification is not confirmed yet. Open the link in your email, then check again.');
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!user) {
      setError('Sign in with the account you want to verify, then return to this page.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await firebaseAuthService.resendVerification(user);
      setNotice(user.emailVerified ? 'This email is already verified.' : 'A new verification link has been sent.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await firebaseAuthService.logout();
      setUser(null);
      setNotice('You have signed out.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  const configured = isFirebaseConfigured();
  const title = mode === 'register'
    ? 'Create your account'
    : mode === 'forgot'
      ? 'Reset your password'
      : mode === 'verify'
        ? 'Verify your email'
        : 'Welcome back';

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="brand auth-brand" to="/" aria-label="Campus Vault home">
          <span className="brand-mark" aria-hidden="true">CV</span>
          <span>Campus Vault</span>
        </Link>

        <p className="eyebrow auth-eyebrow">STUDENT ACCESS</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-intro">
          {mode === 'register' && 'Create an account. Email verification is required before protected student features become available.'}
          {mode === 'login' && 'Sign in to your Campus Vault account.'}
          {mode === 'forgot' && 'Enter your email and we’ll send a password reset link if an account exists.'}
          {mode === 'verify' && 'Verify your email before using protected student features.'}
        </p>

        {!configured && (
          <div className="auth-alert auth-alert-info" role="status">
            Authentication needs Firebase setup. Copy the values from your Firebase web app into the project’s <code>.env</code> file, then restart Vite. No credentials are configured here, so sign-in is unavailable.
          </div>
        )}

        {mode === 'verify' ? (
          <div className="verification-panel">
            <div className="verification-icon" aria-hidden="true">✉</div>
            <p>
              {user?.email
                ? <>Check <strong>{user.email}</strong> for a verification link.</>
                : 'Sign in to the account that needs verification. We will not grant protected access until Firebase confirms it.'}
            </p>
            {user?.emailVerified && (
              <p className="verification-confirmed">Email verified</p>
            )}
            <div className="auth-actions">
              <button className="button button-primary auth-submit" type="button" onClick={refreshVerification} disabled={!configured || busy || !user}>
                {busy ? 'Checking…' : 'I’ve verified my email'}
              </button>
              <button className="button button-secondary auth-submit" type="button" onClick={resendVerification} disabled={!configured || busy || !user || user.emailVerified}>
                Resend verification link
              </button>
              {user && <button className="auth-quiet-button" type="button" onClick={logout} disabled={busy}>Sign out</button>}
            </div>
          </div>
        ) : mode === 'login' && user?.emailVerified ? (
          <div className="signed-in-panel">
            <p className="signed-in-label">SIGNED IN</p>
            <p className="signed-in-email">{user.email}</p>
            <p className="signed-in-message">
              Authentication is active. The student library and profile services
              are not connected yet.
            </p>
            <button className="button button-secondary auth-submit" type="button" onClick={logout} disabled={busy}>
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <label>
                Full name
                <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" required />
              </label>
            )}
            <label>
              Email address
              <input autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
            </label>
            {mode !== 'forgot' && (
              <label>
                Password
                <input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} required />
              </label>
            )}
            {mode === 'register' && (
              <label>
                Confirm password
                <input autoComplete="new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" minLength={8} required />
              </label>
            )}
            {mode === 'login' && (
              <div className="auth-inline-link"><Link to="/forgot-password">Forgot password?</Link></div>
            )}
            <button className="button button-primary auth-submit" type="submit" disabled={!configured || busy}>
              {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
            </button>
          </form>
        )}

        {error && <p className="auth-alert auth-alert-error" role="alert">{error}</p>}
        {notice && <p className="auth-alert auth-alert-success" role="status">{notice}</p>}

        <div className="auth-switch">
          {mode === 'register' ? (
            <>Already have an account? <Link to="/login">Sign in</Link></>
          ) : mode === 'forgot' ? (
            <Link to="/login">Return to sign in</Link>
          ) : mode === 'verify' ? (
            <>Need to switch accounts? <Link to="/login">Sign in</Link></>
          ) : (
            <>New to Campus Vault? <Link to="/register">Create an account</Link></>
          )}
        </div>
        <p className="auth-footnote"><Link to="/">← Back to Campus Vault</Link></p>
      </section>
    </main>
  );
}
