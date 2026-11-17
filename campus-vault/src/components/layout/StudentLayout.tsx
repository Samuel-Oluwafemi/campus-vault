import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { UserProfile } from '@/types/profile';
import { ApiRequestError } from '@/services/apiClient';
import { profileService } from '@/services/profileService';
import { useAuthUser } from '@/hooks/useAuthUser';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';

export type StudentOutletContext = {
  profile: UserProfile;
};

export default function StudentLayout() {
  const auth = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (auth.status !== 'signedIn' || !auth.user.emailVerified) return;

    let active = true;
    setProfile(null);
    setProfileError('');
    setProfileLoading(true);

    void profileService.getCurrentProfile(auth.user)
      .then((currentProfile) => {
        if (!active) return;
        if (currentProfile.level === null) {
          navigate('/complete-profile', { replace: true });
          return;
        }
        setProfile(currentProfile);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiRequestError && error.code === 'PROFILE_NOT_FOUND') {
          navigate('/complete-profile', { replace: true });
          return;
        }
        setProfileError(error instanceof Error ? error.message : 'Your student profile could not be loaded.');
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [auth, navigate, retryCount]);

  if (auth.status === 'loading') {
    return <main className="student-loading" role="status">Checking your account…</main>;
  }

  if (auth.status === 'error') {
    return (
      <main className="student-loading">
        <p className="auth-alert auth-alert-error" role="alert">{auth.error}</p>
        <Link className="button button-secondary" to="/login">Return to sign in</Link>
      </main>
    );
  }

  if (auth.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!auth.user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (profileError) {
    return (
      <main className="student-loading">
        <p className="auth-alert auth-alert-error" role="alert">{profileError}</p>
        <button className="button button-secondary" type="button" onClick={() => setRetryCount((count) => count + 1)}>
          Retry profile loading
        </button>
      </main>
    );
  }

  if (profileLoading || !profile) {
    return <main className="student-loading" role="status">Loading your student space…</main>;
  }

  return (
    <div className="student-shell">
      <SiteHeader />
      <Outlet context={{ profile } satisfies StudentOutletContext} />
      <SiteFooter />
    </div>
  );
}
