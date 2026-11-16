import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '@/firebase/client';
import { firebaseAuthService, getAuthErrorMessage } from '@/services/firebaseAuthService';
import { ApiRequestError } from '@/services/apiClient';
import { profileService } from '@/services/profileService';
import { academicLevelOptions, type UserProfile } from '@/types/profile';
import { academicProfileInputSchema, profileCreationInputSchema } from '@/validators/profile';

type DepartmentSelection = '' | 'geology' | 'other';

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState<DepartmentSelection>('');
  const [level, setLevel] = useState('');
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!configured) return;

    let active = true;
    const unsubscribe = firebaseAuthService.observe(
      (currentUser) => {
        if (!active) return;
        if (!currentUser) {
          navigate('/login', { replace: true });
          return;
        }
        if (!currentUser.emailVerified) {
          navigate('/verify-email', { replace: true });
          return;
        }

        setUser(currentUser);
        setFullName(currentUser.displayName ?? '');
        void profileService.getCurrentProfile(currentUser)
          .then((currentProfile) => {
            if (!active) return;
            setProfile(currentProfile);
            setDepartment(currentProfile.departmentId === 'geology' ? 'geology' : 'other');
            setLevel(currentProfile.level?.toString() ?? '');
          })
          .catch((profileError: unknown) => {
            if (!active) return;
            if (profileError instanceof ApiRequestError && profileError.code === 'PROFILE_NOT_FOUND') {
              setProfile(null);
              return;
            }
            setError(getAuthErrorMessage(profileError));
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      (authError) => {
        if (!active) return;
        setError(getAuthErrorMessage(authError));
        setLoading(false);
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [configured, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    const parsed = academicProfileInputSchema.safeParse({ department, level });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Choose a department option and academic level.');
      return;
    }
    const parsedName = profile ? null : profileCreationInputSchema.safeParse({ fullName });
    if (parsedName && !parsedName.success) {
      setError(parsedName.error.issues[0]?.message ?? 'Enter your full name.');
      return;
    }
    if (!user) {
      setError('Your verified account is not available. Please sign in again.');
      return;
    }

    setBusy(true);
    try {
      let currentProfile = profile;
      if (!currentProfile && parsedName?.success) {
        await firebaseAuthService.updateDisplayName(user, parsedName.data.fullName);
        currentProfile = await profileService.createProfile(user, parsedName.data.fullName);
        setProfile(currentProfile);
      }
      const updatedProfile = await profileService.updateAcademicProfile(user, {
        departmentId: parsed.data.department === 'geology' ? 'geology' : null,
        level: parsed.data.level,
      });
      setProfile(updatedProfile);
      setNotice('Your academic profile has been saved. Opening your library…');
      navigate('/library', { replace: true });
    } catch (saveError) {
      setError(getAuthErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await firebaseAuthService.logout();
      navigate('/login', { replace: true });
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="profile-title">
        <Link className="brand auth-brand" to="/" aria-label="Campus Vault home">
          <span className="brand-mark" aria-hidden="true">CV</span>
          <span>Campus Vault</span>
        </Link>

        <p className="eyebrow auth-eyebrow">STUDENT PROFILE</p>
        <h1 id="profile-title">Complete your academic profile</h1>
        <p className="auth-intro">
          Add your current academic level. Geology is the first FUNAAB catalog;
          you can leave your department unlisted until more approved departments are added.
        </p>

        {!configured && (
          <div className="auth-alert auth-alert-info" role="status">
            Authentication needs Firebase setup. Configure the project environment and restart Vite before completing a profile.
          </div>
        )}

        {loading ? (
          <p className="auth-loading" role="status">Loading your verified profile…</p>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {!profile && (
              <label>
                Full name
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={120}
                  required
                />
              </label>
            )}
            <label>
              Department
              <select
                autoComplete="off"
                value={department}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === '' || value === 'geology' || value === 'other') setDepartment(value);
                }}
                required
              >
                <option value="" disabled>Choose your department</option>
                <option value="geology">Geology</option>
                <option value="other">Another FUNAAB department (not listed yet)</option>
              </select>
            </label>
            <label>
              Current academic level
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                required
              >
                <option value="" disabled>Choose your level</option>
                {academicLevelOptions.map((option) => (
                  <option key={option} value={option}>{option} level</option>
                ))}
              </select>
            </label>
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>
              {busy ? 'Saving…' : profile ? 'Update academic profile' : 'Create student profile'}
            </button>
            <button className="auth-quiet-button" type="button" onClick={logout} disabled={busy}>
              Sign out
            </button>
          </form>
        )}

        {error && <p className="auth-alert auth-alert-error" role="alert">{error}</p>}
        {notice && <p className="auth-alert auth-alert-success" role="status">{notice}</p>}
        <p className="auth-footnote"><Link to="/">← Back to Campus Vault</Link></p>
      </section>
    </main>
  );
}
