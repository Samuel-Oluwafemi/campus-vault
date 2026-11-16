import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function SiteHeader() {
  const auth = useAuthUser();
  const { pathname } = useLocation();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    setLogoutError('');
    try {
      await firebaseAuthService.logout();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'You could not be signed out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  }

  const signedIn = auth.status === 'signedIn';
  const verified = signedIn && auth.user.emailVerified;
  const accountName = signedIn ? auth.user.displayName?.trim() || auth.user.email || 'Account' : 'Account';
  const initials = accountName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Campus Vault home">
        <span className="brand-mark" aria-hidden="true">
          CV
        </span>
        <span>Campus Vault</span>
      </Link>

      <nav className="site-nav" aria-label="Main navigation">
        {auth.status === 'loading' ? null : verified ? (
          <>
            <Link to="/dashboard" aria-current={pathname === '/dashboard' ? 'page' : undefined}>Dashboard</Link>
            <Link to="/library" aria-current={pathname === '/library' ? 'page' : undefined}>Library</Link>
            <Link to="/contribute" aria-current={pathname === '/contribute' ? 'page' : undefined}>Contribute</Link>
            <Link to="/my-submissions" aria-current={pathname === '/my-submissions' ? 'page' : undefined}>My submissions</Link>
          </>
        ) : (
          <>
            <Link to="/library">The library</Link>
            <a href="/#how-it-works">How it works</a>
            <a href="/#principles">Our principles</a>
          </>
        )}
      </nav>

      {verified && (
        <details className="mobile-nav">
          <summary>Menu</summary>
          <nav aria-label="Student navigation">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/library">Library</Link>
            <Link to="/contribute">Contribute</Link>
            <Link to="/my-submissions">My submissions</Link>
          </nav>
        </details>
      )}

      <div className="header-actions">
        {auth.status === 'loading' ? (
          <span className="header-auth-loading" role="status">Checking account…</span>
        ) : verified ? (
          <details className="account-menu">
            <summary aria-label={`Open account menu for ${accountName}`}>
              <span className="account-avatar" aria-hidden="true">{initials || 'CV'}</span>
              <span className="account-name">{accountName}</span>
              <span className="account-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="account-menu-panel">
              <span className="account-menu-email">{auth.user.email}</span>
              <Link to="/complete-profile">Academic profile</Link>
              <button type="button" onClick={logout} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </details>
        ) : signedIn ? (
          <>
            <Link className="header-signin" to="/verify-email">Verify email</Link>
            <button className="header-signin header-signout" type="button" onClick={logout} disabled={signingOut}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        ) : (
          <>
            <Link className="header-signin" to="/login">Sign in</Link>
            <Link className="header-link" to="/register">Get started <span aria-hidden="true">↗</span></Link>
          </>
        )}
      </div>
      {(auth.status === 'error' || logoutError) && (
        <p className="header-auth-error" role="alert">{logoutError || (auth.status === 'error' ? auth.error : '')}</p>
      )}
    </header>
  );
}
