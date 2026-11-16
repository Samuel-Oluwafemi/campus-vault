import { Link, useLocation } from 'react-router-dom';

export default function FeatureStatusPage() {
  const { pathname } = useLocation();
  const isContribute = pathname === '/contribute';
  const title = isContribute ? 'Contributions are coming next.' : 'Submission tracking is coming next.';

  return (
    <main className="student-page feature-status-page">
      <section className="feature-status-card">
        <p className="eyebrow">{isContribute ? 'CONTRIBUTE' : 'MY SUBMISSIONS'}</p>
        <h1>{title}</h1>
        <p>
          {isContribute
            ? 'The review and file-upload workflow is not connected yet. Resources will only appear in the library after they are uploaded and approved.'
            : 'Submission records are not available yet because the contribution and review workflow has not been connected.'}
        </p>
        <div className="feature-status-actions">
          <Link className="button button-primary" to="/library">Go to the library</Link>
          <Link className="button button-secondary" to="/dashboard">Back to dashboard</Link>
        </div>
      </section>
    </main>
  );
}
