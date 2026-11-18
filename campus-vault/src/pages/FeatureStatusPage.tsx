import { Link, useLocation } from 'react-router-dom';

export default function FeatureStatusPage() {
  const { pathname } = useLocation();
  const isContribute = pathname === '/contribute';
  const title = isContribute ? 'Contributions are coming soon.' : 'Submission tracking is coming soon.';

  return (
    <main className="student-page feature-status-page">
      <section className="feature-status-card">
        <p className="eyebrow">{isContribute ? 'CONTRIBUTE' : 'MY SUBMISSIONS'}</p>
        <h1>{title}</h1>
        <p>
          {isContribute
            ? 'Student contributions are not available yet. Resource uploads and submissions will be managed through the protected admin dashboard.'
            : 'Student submission tracking is not available yet. You will be able to track your uploads after the student submission workflow is released.'}
        </p>
        <div className="feature-status-actions">
          <Link className="button button-primary" to="/library">Go to the library</Link>
          <Link className="button button-secondary" to="/dashboard">Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
