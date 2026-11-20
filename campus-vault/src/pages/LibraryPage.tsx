import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { getGeologyCourseCatalog, type CatalogCourse } from '@/services/catalogService';
import { apiRequest, ApiRequestError, downloadApiFile } from '@/services/apiClient';

const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  departmentId: z.string(),
  courseId: z.string(),
  level: z.number(),
  semester: z.string(),
  resourceType: z.string(),
  fileName: z.string(),
  storageKey: z.string(),
  fileSize: z.number(),
  createdAt: z.string(),
});

const resourcePageSchema = z.object({
  items: z.array(resourceSchema),
  nextCursor: z.string().nullable(),
});

const resourceTypes = [
  ['lecture-note', 'Lecture notes'],
  ['past-question', 'Past questions'],
  ['test-question', 'Test questions'],
  ['handout', 'Handouts'],
  ['study-material', 'Study materials'],
  ['other', 'Other'],
] as const;

export default function LibraryPage() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [resources, setResources] = useState<z.infer<typeof resourceSchema>[]>([]);
  const [resourceLoading, setResourceLoading] = useState(true);
  const [resourceError, setResourceError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState(searchParams.get('level') ?? '');
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');
  const [session, setSession] = useState('');
  const [resourceType, setResourceType] = useState('');

  async function loadCatalog(signal?: AbortSignal) {
    setLoading(true);
    setError('');
    try {
      const catalog = await getGeologyCourseCatalog(signal);
      setCourses(catalog.courses);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : 'The course index could not be loaded.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadCatalog(controller.signal);
    apiRequest('/resources', resourcePageSchema, { signal: controller.signal })
      .then((page) => setResources(page.items))
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setResourceError(loadError instanceof ApiRequestError ? loadError.message : 'Approved resources could not be loaded.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setResourceLoading(false);
      });
    return () => controller.abort();
  }, []);

  const visibleResources = useMemo(() => {
    const term = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const course = courses.find((item) => item.id === resource.courseId);
      return (!department || resource.departmentId === department)
        && (!level || resource.level === Number(level))
        && (!semester || resource.semester === semester)
        && (!courseId || resource.courseId === courseId || course?.code === resource.courseId)
        && (!resourceType || resource.resourceType === resourceType)
        && (!term || [resource.title, resource.description, resource.fileName, course?.code]
          .some((value) => value?.toLowerCase().includes(term)));
    });
  }, [resources, courses, department, level, semester, courseId, resourceType, search]);

  async function openResource(resourceId: string, kind: 'preview' | 'download') {
    try {
      if (kind === 'download') {
        await downloadApiFile(
          `/resources/${encodeURIComponent(resourceId)}/download`,
          decodeURIComponent(resourceId.split('/').pop() ?? 'campus-vault-resource.pdf'),
        );
        return;
      }
      const grant = await apiRequest(
        `/resources/${encodeURIComponent(resourceId)}/preview`,
        z.object({ url: z.string().url(), expiresAt: z.string(), kind: z.enum(['preview', 'download']) }),
        { method: 'POST' },
      );
      window.open(grant.url, '_blank', 'noopener,noreferrer');
    } catch (accessError) {
      setResourceError(accessError instanceof ApiRequestError ? accessError.message : 'The resource could not be opened.');
    }
  }

  function clearFilters() {
    setSearch('');
    setDepartment('');
    setLevel('');
    setSemester('');
    setCourseId('');
    setSession('');
    setResourceType('');
  }

  return (
    <main className="student-page library-page">
      <div className="student-page-heading">
        <div>
          <p className="eyebrow">CAMPUS VAULT LIBRARY</p>
          <h1>Find resources for your courses.</h1>
          <p>Search approved course materials by department, level, semester, course, session, or type.</p>
        </div>
        <Link className="button button-secondary" to="/dashboard">Back to dashboard</Link>
      </div>

      <section className="resource-filters" aria-labelledby="filter-heading">
        <div className="filter-heading-row">
          <div>
            <h2 id="filter-heading">Search and filter</h2>
            <p>Only approved resources are listed here.</p>
          </div>
          <button className="filter-clear" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
        <label className="library-search">
          <span>Search resources or course references</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search course code, title, or keyword"
          />
        </label>
        <div className="filter-grid">
          <label>
            Department
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              <option value="geology">Geology</option>
            </select>
          </label>
          <label>
            Level
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="">All levels</option>
              {[100, 200, 300, 400, 500].map((item) => <option key={item} value={item}>{item} level</option>)}
            </select>
          </label>
          <label>
            Semester
            <select value={semester} onChange={(event) => setSemester(event.target.value)}>
              <option value="">All semesters</option>
              <option value="first">First semester</option>
              <option value="second">Second semester</option>
            </select>
          </label>
          <label>
            Course
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.code}</option>
              ))}
            </select>
          </label>
          <label>
            Academic session
            <select value={session} onChange={(event) => setSession(event.target.value)}>
              <option value="">All sessions</option>
              <option value="unavailable" disabled>No sessions published</option>
            </select>
          </label>
          <label>
            Resource type
            <select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
              <option value="">All resource types</option>
              {resourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="resource-results" aria-labelledby="resources-heading">
        <div className="results-heading">
          <div>
            <p className="eyebrow">APPROVED MATERIALS</p>
            <h2 id="resources-heading">Resources</h2>
          </div>
          <span className="resource-count">{visibleResources.length} available</span>
        </div>
        {resourceLoading ? (
          <p className="catalog-message" role="status">Loading approved resources…</p>
        ) : resourceError ? (
          <p className="catalog-error" role="alert">{resourceError}</p>
        ) : visibleResources.length ? (
          <div className="catalog-grid">
            {visibleResources.map((resource) => (
              <article className="catalog-course" key={resource.id}>
                <div className="catalog-course-topline">
                  <span className="catalog-course-code">{resource.resourceType}</span>
                  <span className="catalog-status">Approved</span>
                </div>
                <h3>{resource.title}</h3>
                {resource.description && <p>{resource.description}</p>}
                <dl>
                  <div><dt>Level</dt><dd>{resource.level}</dd></div>
                  <div><dt>File</dt><dd>{resource.fileName}</dd></div>
                </dl>
                <div className="feature-status-actions">
                  <button className="button button-primary" type="button" onClick={() => void openResource(resource.id, 'preview')}>
                    Preview
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => void openResource(resource.id, 'download')}>
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="resource-empty-state">
            <span className="empty-state-icon" aria-hidden="true">⌕</span>
            <h3>No approved resources match these filters</h3>
            <p>Resources appear here after they are uploaded and approved in the admin workflow.</p>
          </div>
        )}
      </section>

    </main>
  );
}
