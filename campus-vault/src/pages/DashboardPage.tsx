import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getGeologyCourseCatalog, type CatalogCourse } from '@/services/catalogService';
import type { StudentOutletContext } from '@/components/layout/StudentLayout';

export default function DashboardPage() {
  const { profile } = useOutletContext<StudentOutletContext>();
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const displayName = profile.fullName.split(/\s+/)[0] || 'student';

  useEffect(() => {
    const controller = new AbortController();
    void getGeologyCourseCatalog(controller.signal)
      .then((catalog) => setCourses(catalog.courses))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setCatalogError(error instanceof Error ? error.message : 'The course index could not be loaded.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="student-page dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">STUDENT DASHBOARD</p>
          <h1>Welcome back, {displayName}.</h1>
          <p>Your academic home for finding and keeping track of useful course materials.</p>
        </div>
        <Link className="button button-primary" to="/library">Explore the library <span aria-hidden="true">→</span></Link>
      </section>

      <section className="dashboard-overview" aria-label="Your academic profile">
        <article className="overview-card profile-overview">
          <span className="overview-icon" aria-hidden="true">◎</span>
          <div>
            <p className="overview-label">YOUR DEPARTMENT</p>
            <h2>{profile.departmentId === 'geology' ? 'Geology' : 'Not listed yet'}</h2>
            <p>{profile.departmentId === 'geology' ? 'Federal University of Agriculture, Abeokuta' : 'Your academic profile is saved.'}</p>
          </div>
          <Link className="text-link" to="/complete-profile">Edit profile <span aria-hidden="true">→</span></Link>
        </article>
        <article className="overview-card level-overview">
          <span className="overview-icon" aria-hidden="true">↗</span>
          <div>
            <p className="overview-label">CURRENT LEVEL</p>
            <h2>{profile.level} level</h2>
            <p>Update your academic details any time.</p>
          </div>
          <Link className="text-link" to="/complete-profile">Update <span aria-hidden="true">→</span></Link>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-courses">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR COURSES</p>
              <h2>Course index</h2>
            </div>
            <Link className="text-link" to="/library">View library <span aria-hidden="true">→</span></Link>
          </div>
          {catalogError ? (
            <p className="dashboard-inline-error" role="alert">{catalogError}</p>
          ) : catalogLoading ? (
            <p className="dashboard-muted" role="status">Loading the provisional course index…</p>
          ) : courses.length ? (
            <ul className="dashboard-course-list">
              {courses.map((course) => (
                <li key={course.id}>
                  <span className="course-list-code">{course.code}</span>
                  <span>{course.title ?? 'Geology course'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-muted" role="status">No provisional course codes are available.</p>
          )}
        </article>

        <aside className="dashboard-side-column">
          <article className="dashboard-panel recent-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">RECENTLY ADDED</p>
                <h2>New resources</h2>
              </div>
            </div>
            <div className="dashboard-empty">
              <span aria-hidden="true">▤</span>
              <p>The approved-resource feed is not connected yet.</p>
              <Link className="text-link" to="/library">Browse the library <span aria-hidden="true">→</span></Link>
            </div>
          </article>
          <article className="dashboard-panel quick-access-panel">
            <p className="eyebrow">QUICK ACCESS</p>
            <h2>Keep your study flow moving.</h2>
            <div className="quick-access-links">
              <Link to={`/library?level=${profile.level}`}><span>Browse {profile.level} level resources</span><span aria-hidden="true">→</span></Link>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
