import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '@/firebase/client';
import { firebaseAuthService, getAuthErrorMessage } from '@/services/firebaseAuthService';
import { credentialsSchema, registrationSchema } from '@/validators/auth';
import PasswordInput from '@/components/auth/PasswordInput';
import type { UserProfile } from '@/types/profile';
import { z } from 'zod';
import { ApiRequestError } from '@/services/apiClient';
import { useToast } from '@/components/feedback/ToastProvider';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify';
type AuthField = 'fullName' | 'email' | 'password' | 'confirmPassword';
type AuthFieldErrors = Partial<Record<AuthField, string>>;

const passwordRequirements = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'One symbol, such as ! or #', test: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
];

function getMode(pathname: string): AuthMode {
  if (pathname === '/register') return 'register';
  if (pathname === '/forgot-password') return 'forgot';
  if (pathname === '/verify-email') return 'verify';
  return 'login';
}

function logAuthenticationFailure(error: unknown) {
  const code = getErrorCode(error) || 'unknown';
  console.error('[Campus Vault] Authentication request failed.', {
    name: error instanceof Error ? error.name : 'UnknownError',
    code,
  });
}

function getErrorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    ? error.code
    : '';
}

function isInvalidCredentialError(error: unknown) {
  return [
    'auth/invalid-credential',
    'auth/invalid-login-credentials',
    'auth/user-not-found',
    'auth/wrong-password',
  ].includes(getErrorCode(error));
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mode = getMode(location.pathname);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    return firebaseAuthService.observe(
      (currentUser) => setUser(currentUser),
      (authError) => {
        if (isFirebaseConfigured()) {
          logAuthenticationFailure(authError);
          setError(getAuthErrorMessage(authError));
        }
      },
    );
  }, []);

  useEffect(() => {
    setError('');
    setFieldErrors({});
    setNotice('');
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  useEffect(() => {
    if ((mode !== 'login' && mode !== 'register') || !user?.emailVerified) {
      setProfileLoading(false);
      return;
    }

    let active = true;
    setProfileLoading(true);
    void firebaseAuthService.getOrCreateProfile(user)
      .then((currentProfile) => {
        if (!active) return;
        setProfile(currentProfile);
        if (currentProfile.level === null) {
          navigate('/complete-profile', { replace: true });
        } else {
          navigate('/library', { replace: true });
        }
      })
      .catch((profileError: unknown) => {
        if (!active) return;
        if (profileError instanceof ApiRequestError && profileError.code === 'PROFILE_NOT_FOUND') {
          navigate('/complete-profile', { replace: true });
          return;
        }
        logAuthenticationFailure(profileError);
        setError(`${getAuthErrorMessage(profileError)} You are signed in, but your profile could not be loaded.`);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, navigate, user]);

  function updateField(field: AuthField, value: string) {
    if (field === 'fullName') setFullName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      if ((field === 'email' || field === 'password') && current.email === 'Email or password is incorrect.') {
        delete next.email;
        delete next.password;
        return next;
      }
      delete next[field];
      return next;
    });
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setNotice('');

    if (mode === 'forgot') {
      const emailResult = z.string().trim().email('Enter a valid email address.').safeParse(email);
      if (!emailResult.success) {
        setFieldErrors({ email: emailResult.error.issues[0]?.message ?? 'Enter a valid email address.' });
        return;
      }
    } else {
      const parsed = mode === 'register'
        ? registrationSchema.safeParse({ fullName, email, password, confirmPassword })
        : credentialsSchema.safeParse({ email, password });
      if (!parsed.success) {
        const nextFieldErrors: AuthFieldErrors = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0];
          if (
            (field === 'fullName' || field === 'email' || field === 'password' || field === 'confirmPassword') &&
            !nextFieldErrors[field]
          ) {
            nextFieldErrors[field] = issue.message;
          }
        }
        setFieldErrors(nextFieldErrors);
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'register') {
        const account = await firebaseAuthService.register(fullName.trim(), email.trim(), password);
        setUser(account);
        showToast('Account created successfully.');
        navigate('/verify-email', { replace: true });
        setNotice('Your account is ready. Check your inbox for the verification link.');
      } else if (mode === 'login') {
        const account = await firebaseAuthService.login(email.trim(), password);
        setUser(account);
        showToast('Signed in successfully.');
        if (!account.emailVerified) {
          navigate('/verify-email', { replace: true });
        }
      } else if (mode === 'forgot') {
        await firebaseAuthService.requestPasswordReset(email.trim());
        setNotice('If an account exists for that email, a password reset link has been sent.');
      }
    } catch (authError) {
      logAuthenticationFailure(authError);
      if (mode === 'login' && isInvalidCredentialError(authError)) {
        setFieldErrors({
          email: 'Email or password is incorrect.',
          password: 'Email or password is incorrect.',
        });
      } else if (
        mode === 'register' &&
        ['auth/email-already-in-use', 'auth/weak-password', 'auth/invalid-email'].includes(getErrorCode(authError))
      ) {
        const code = getErrorCode(authError);
        if (code === 'auth/email-already-in-use' || code === 'auth/invalid-email') {
          setFieldErrors({ email: getAuthErrorMessage(authError) });
        } else {
          setFieldErrors({ password: getAuthErrorMessage(authError) });
        }
      }
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
        try {
          const currentProfile = await firebaseAuthService.getOrCreateProfile(refreshedUser);
          setProfile(currentProfile);
          if (currentProfile.level === null) {
            navigate('/complete-profile', { replace: true });
          } else {
            navigate('/library', { replace: true });
          }
        } catch (profileError) {
          if (profileError instanceof ApiRequestError && profileError.code === 'PROFILE_NOT_FOUND') {
            navigate('/complete-profile', { replace: true });
          } else {
            logAuthenticationFailure(profileError);
            setError(`${getAuthErrorMessage(profileError)} Your email is verified, but your profile could not be loaded.`);
          }
        }
      } else {
        setNotice('Verification is not confirmed yet. Open the link in your email, then check again.');
      }
    } catch (authError) {
      logAuthenticationFailure(authError);
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
      logAuthenticationFailure(authError);
      setError(getAuthErrorMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function retryProfileLoad() {
    if (!user?.emailVerified) return;
    setProfileLoading(true);
    setError('');
    setNotice('');
    try {
      const currentProfile = await firebaseAuthService.getOrCreateProfile(user);
      setProfile(currentProfile);
      if (currentProfile.level === null) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/library', { replace: true });
      }
    } catch (profileError) {
      if (profileError instanceof ApiRequestError && profileError.code === 'PROFILE_NOT_FOUND') {
        navigate('/complete-profile', { replace: true });
      } else {
        logAuthenticationFailure(profileError);
        setError(`${getAuthErrorMessage(profileError)} You are signed in, but your profile could not be loaded.`);
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await firebaseAuthService.logout();
      setUser(null);
      setProfile(null);
      showToast('You have signed out successfully.');
      setNotice('You have signed out.');
    } catch (authError) {
      logAuthenticationFailure(authError);
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

        {!configured && mode !== 'verify' && (
          <p className="auth-unavailable-note" role="status">
            Account access is temporarily unavailable. Please try again later.
          </p>
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
              {profile
                ? `Profile role: ${profile.role}. ${profile.level !== null ? 'Academic profile ready.' : 'Academic level is not set yet.'}`
                : profileLoading
                  ? 'Loading your student profile…'
                  : 'Your profile could not be loaded. Check the message below and try again.'}
            </p>
            {profileLoading && <p className="auth-loading" role="status">Loading your student profile…</p>}
            {profile?.level === null && (
              <Link className="button button-primary auth-submit" to="/complete-profile">
                Complete academic profile
              </Link>
            )}
            {!profile && !profileLoading && (
              <button className="button button-secondary auth-submit" type="button" onClick={retryProfileLoad} disabled={busy}>
                Retry profile loading
              </button>
            )}
            <button className="button button-secondary auth-submit" type="button" onClick={logout} disabled={busy}>
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {mode === 'register' && (
              <label>
                Full name
                <input
                  id="auth-full-name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  placeholder="Your name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'auth-full-name-error' : undefined}
                  required
                />
                {fieldErrors.fullName && <span className="auth-field-error" id="auth-full-name-error">{fieldErrors.fullName}</span>}
              </label>
            )}
            <label>
              <span>Email address</span>
              <input
                id="auth-email"
                autoComplete="email"
                inputMode="email"
                type="email"
                value={email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
                required
              />
              {fieldErrors.email && <span className="auth-field-error" id="auth-email-error">{fieldErrors.email}</span>}
            </label>
            {mode !== 'forgot' && (
              <label>
                <span>Password</span>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={(value) => updateField('password', value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'register' ? 'Create a strong password' : 'Enter your password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  invalid={Boolean(fieldErrors.password)}
                  describedBy={[
                    mode === 'register' ? 'auth-password-requirements' : '',
                    fieldErrors.password ? 'auth-password-error' : '',
                  ].filter(Boolean).join(' ') || undefined}
                />
                {fieldErrors.password && <span className="auth-field-error" id="auth-password-error">{fieldErrors.password}</span>}
                {mode === 'register' && (
                  <ul className="password-requirements" id="auth-password-requirements" aria-label="Password requirements">
                    {passwordRequirements.map((requirement) => {
                      const satisfied = requirement.test(password);
                      return (
                        <li className={satisfied ? 'requirement-met' : ''} key={requirement.label}>
                          <span aria-hidden="true">{satisfied ? '✓' : '○'}</span>
                          {requirement.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </label>
            )}
            {mode === 'register' && (
              <label>
                <span>Confirm password</span>
                <PasswordInput
                  id="auth-confirm-password"
                  value={confirmPassword}
                  onChange={(value) => updateField('confirmPassword', value)}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  minLength={8}
                  invalid={Boolean(fieldErrors.confirmPassword)}
                  describedBy={fieldErrors.confirmPassword ? 'auth-confirm-password-error' : undefined}
                />
                {fieldErrors.confirmPassword && (
                  <span className="auth-field-error" id="auth-confirm-password-error">{fieldErrors.confirmPassword}</span>
                )}
              </label>
            )}
            {mode === 'login' && (
              <div className="auth-inline-link"><Link to="/forgot-password">Forgot password?</Link></div>
            )}
            {(mode === 'register' || mode === 'login') && (
              <p className="auth-privacy-note">
                <strong>Note:</strong> Your password is used by Firebase Authentication and is never stored in your Campus Vault profile or shown to other students.
                Your email links your account to your academic profile and study activity Campus Vault saves for you.
              </p>
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
