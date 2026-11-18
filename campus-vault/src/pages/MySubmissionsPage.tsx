import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { apiRequest, ApiRequestError } from '@/services/apiClient';

const submissionSchema = z.object({
  id: z.string(),
  resourceTitle: z.string(),
  courseId: z.string(),
  resourceType: z.string(),
  fileName: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  reviewNote: z.string().nullable(),
  createdAt: z.string(),
});

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<z.infer<typeof submissionSchema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest('/submissions/mine', z.array(submissionSchema), { signal: controller.signal })
      .then(setSubmissions)
      .catch((loadError) => setError(loadError instanceof ApiRequestError ? loadError.message : 'Could not load submissions.'))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <main className="student-page">
      <div className="student-page-heading">
        <div>
          <p className="eyebrow">MY SUBMISSIONS</p>
          <h1>Track your uploads.</h1>
          <p>Review status and moderator notes for each PDF you submit.</p>
        </div>
        <Link className="button button-primary" to="/contribute">Submit another resource</Link>
      </div>
      {loading ? (
        <p className="catalog-message" role="status">Loading submissions…</p>
      ) : error ? (
        <p className="catalog-error" role="alert">{error}</p>
      ) : submissions.length === 0 ? (
        <section className="feature-status-card">
          <h2>No submissions yet</h2>
          <p>Your submitted PDFs and their review status will appear here.</p>
          <Link className="button button-primary" to="/contribute">Upload a PDF</Link>
        </section>
      ) : (
        <div className="catalog-grid">
          {submissions.map((submission) => (
            <article className="catalog-course" key={submission.id}>
              <div className="catalog-course-topline">
                <span className="catalog-course-code">{submission.resourceType}</span>
                <span className="catalog-status">{submission.status}</span>
              </div>
              <h3>{submission.resourceTitle}</h3>
              <dl>
                <div><dt>File</dt><dd>{submission.fileName}</dd></div>
                <div><dt>Submitted</dt><dd>{new Date(submission.createdAt).toLocaleDateString()}</dd></div>
              </dl>
              {submission.reviewNote && <p>{submission.reviewNote}</p>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
