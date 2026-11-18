import { useState, type FormEvent } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { z } from 'zod';
import { apiRequest, ApiRequestError } from '@/services/apiClient';
import type { StudentOutletContext } from '@/components/layout/StudentLayout';

const uploadSchema = z.object({
  id: z.string(),
  title: z.string(),
  approvalStatus: z.literal('approved'),
});

export default function AdminUploadPage() {
  const { profile } = useOutletContext<StudentOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (profile.role !== 'admin') return <Navigate to="/dashboard" replace />;

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
      await apiRequest('/admin/resources', uploadSchema, { method: 'POST', body: formData });
      setSuccess('The PDF was uploaded and published to the library.');
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof ApiRequestError ? submitError.message : 'The resource could not be uploaded.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="student-page">
      <div className="student-page-heading">
        <div>
          <p className="eyebrow">ADMIN RESOURCE CENTER</p>
          <h1>Publish course resources.</h1>
          <p>Upload a PDF directly to the approved library, organized by level and course.</p>
        </div>
      </div>
      <section className="feature-status-card" aria-label="Admin resource upload form">
        <form className="submission-form" onSubmit={submit}>
          <label>Resource title<input name="title" required minLength={3} maxLength={120} /></label>
          <label>Description<textarea name="description" maxLength={500} rows={4} /></label>
          <div className="filter-grid">
            <label>Course code<input name="courseId" required placeholder="e.g. GLY 305" /></label>
            <label>Level<select name="level" required><option value="100">100</option><option value="200">200</option><option value="300">300</option><option value="400">400</option><option value="500">500</option></select></label>
            <label>Semester<select name="semester" required><option value="first">First</option><option value="second">Second</option></select></label>
            <label>Academic session<input name="academicSessionId" required placeholder="e.g. 2025/2026" /></label>
            <label>Resource type<select name="resourceType" required><option value="lecture-note">Lecture note</option><option value="past-question">Past question</option><option value="test-question">Test question</option><option value="handout">Handout</option><option value="study-material">Study material</option><option value="other">Other</option></select></label>
          </div>
          <label>PDF file (maximum 20 MB)<input name="file" type="file" accept="application/pdf,.pdf" required /></label>
          {error && <p className="catalog-error" role="alert">{error}</p>}
          {success && <p className="catalog-message" role="status">{success}</p>}
          <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Publishing…' : 'Upload and publish'}</button>
        </form>
      </section>
    </main>
  );
}
