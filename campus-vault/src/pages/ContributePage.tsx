import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { apiRequest, ApiRequestError } from '@/services/apiClient';
import { getGeologyCourseCatalog, type CatalogCourse } from '@/services/catalogService';
import { RESOURCE_TYPES } from '@/types';

const submissionSchema = z.object({
  id: z.string(),
  status: z.literal('pending'),
});

export default function ContributePage() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getGeologyCourseCatalog(controller.signal)
      .then((catalog) => setCourses(catalog.courses))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load courses.'))
      .finally(() => setLoadingCourses(false));
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setError('Choose a PDF file to upload.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('This file is over the 20 MB limit.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(
        '/submissions',
        submissionSchema,
        { method: 'POST', body: formData },
      );
      setSuccess('Your PDF was uploaded and is waiting for review.');
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof ApiRequestError ? submitError.message : 'The submission could not be uploaded.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="student-page">
      <div className="student-page-heading">
        <div>
          <p className="eyebrow">CONTRIBUTE</p>
          <h1>Upload a resource.</h1>
          <p>Submit a PDF for review. It appears in the library only after approval.</p>
        </div>
        <Link className="button button-secondary" to="/my-submissions">View submissions</Link>
      </div>
      <section className="feature-status-card" aria-label="Resource upload form">
        <form className="submission-form" onSubmit={submit}>
          <label>
            Resource title
            <input name="resourceTitle" required minLength={3} maxLength={120} />
          </label>
          <label>
            Description
            <textarea name="description" maxLength={500} rows={4} />
          </label>
          <div className="filter-grid">
            <label>
              Course
              <select name="courseId" required disabled={loadingCourses}>
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code} · {course.title ?? 'Provisional title'}</option>
                ))}
              </select>
            </label>
            <label>
              Academic session
              <input name="academicSessionId" required placeholder="e.g. 2024/2025" />
            </label>
            <label>
              Resource type
              <select name="resourceType" required>
                {RESOURCE_TYPES.map((resourceType) => <option key={resourceType} value={resourceType}>{resourceType}</option>)}
              </select>
            </label>
          </div>
          <label>
            PDF file (maximum 20 MB)
            <input name="file" type="file" accept="application/pdf,.pdf" required />
          </label>
          {error && <p className="catalog-error" role="alert">{error}</p>}
          {success && <p className="catalog-message" role="status">{success}</p>}
          <button className="button button-primary" type="submit" disabled={submitting || loadingCourses}>
            {submitting ? 'Uploading…' : 'Upload for review'}
          </button>
        </form>
      </section>
    </main>
  );
}
