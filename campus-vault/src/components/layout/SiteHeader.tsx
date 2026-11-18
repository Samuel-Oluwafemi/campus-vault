import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useToast } from '@/components/feedback/ToastProvider';
import { profileService } from '@/services/profileService';

export default function SiteHeader() {
  const auth = useAuthUser();
  const { showToast } = useToast();
  const { pathname } = useLocation();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [accountRole, setAccountRole] = useState<'student' | 'contributor' | 'admin'>('student');
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenus(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!accountMenuRef.current?.contains(target)) setAccountOpen(false);
      if (!mobileNavRef.current?.contains(target)) setMobileNavOpen(false);
    }

    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  useEffect(() => {
    if (auth.status !== 'signedIn') {
      setAccountRole('student');
      return;
    }
    let active = true;
    void profileService.getCurrentProfile(auth.user)
      .then((profile) => {
        if (active) setAccountRole(profile.role);
      })
      .catch(() => {
        if (active) setAccountRole('student');
      });
    return () => {
      active = false;
    };
  }, [auth.status, auth.status === 'signedIn' ? auth.user.uid : null]);

  async function logout() {
    setSigningOut(true);
    setLogoutError('');
    try {
      await firebaseAuthService.logout();
      showToast('You have signed out successfully.');
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
            {accountRole === 'admin' && (
              <Link to="/admin/resources" aria-current={pathname === '/admin/resources' ? 'page' : undefined}>Admin</Link>
            )}
          </>
        ) : (
          <>
            <Link to="/library">The library</Link>
            <a href="/#how-it-works">How it works</a>
            <a href="/#principles">Our principles</a>
          </>
        )}
      </nav>

      <div className="header-actions">
        {auth.status === 'loading' ? (
          <span className="header-auth-loading" role="status">Checking account…</span>
        ) : verified ? (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              className="account-trigger"
              type="button"
              aria-label={`${accountOpen ? 'Close' : 'Open'} account menu for ${accountName}`}
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <span className="account-avatar" aria-hidden="true">{initials || 'CV'}</span>
              <span className="account-name">{accountName}</span>
              <span className={`account-chevron${accountOpen ? ' is-open' : ''}`} aria-hidden="true">⌄</span>
            </button>
            {accountOpen && (
              <div className="account-menu-panel">
                <div className="account-menu-heading">
                  <span>Account</span>
                  <button
                    className="menu-close-button"
                    type="button"
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                  >×</button>
                </div>
                <span className="account-menu-email">{auth.user.email}</span>
                <Link to="/complete-profile" onClick={() => setAccountOpen(false)}>Academic profile</Link>
                <button type="button" onClick={logout} disabled={signingOut}>
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
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
        {verified && (
          <div className="mobile-nav" ref={mobileNavRef}>
            <button
              className="mobile-nav-trigger"
              type="button"
              aria-label={`${mobileNavOpen ? 'Close' : 'Open'} student navigation`}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <span className="menu-close-mark" aria-hidden="true">×</span>
              ) : (
                <span className="hamburger-icon" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              )}
              <span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Menu'}</span>
            </button>
            {mobileNavOpen && (
            <nav aria-label="Student navigation">
              <Link to="/dashboard" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
              <Link to="/library" onClick={() => setMobileNavOpen(false)}>Library</Link>
              <Link to="/contribute" onClick={() => setMobileNavOpen(false)}>Contribute</Link>
              <Link to="/my-submissions" onClick={() => setMobileNavOpen(false)}>My submissions</Link>
              {accountRole === 'admin' && (
                <Link to="/admin/resources" onClick={() => setMobileNavOpen(false)}>Admin resources</Link>
              )}
            </nav>
            )}
          </div>
        )}
      </div>
      {(auth.status === 'error' || logoutError) && (
        <p className="header-auth-error" role="alert">{logoutError || (auth.status === 'error' ? auth.error : '')}</p>
      )}
    </header>
  );
}
