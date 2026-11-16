import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGeologyCourseCatalog, type CatalogCourse } from '@/services/catalogService';

const resourceTypes = [
  ['lecture-note', 'Lecture notes'],
  ['past-question', 'Past questions'],
  ['test-question', 'Test questions'],
  ['handout', 'Handouts'],
  ['study-material', 'Study materials'],
  ['other', 'Other'],
] as const;

export default function LibraryPage() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [unassignedPastQuestionReferences, setUnassignedPastQuestionReferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
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
      setUnassignedPastQuestionReferences(catalog.unassignedPastQuestionReferences);
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
    return () => controller.abort();
  }, []);

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch = !term || [course.code, ...course.sourceFiles]
        .some((value) => value.toLowerCase().includes(term));
      const matchesDepartment = !department || department === course.departmentId;
      const matchesLevel = !level || Number(level) === course.level;
      const matchesSemester = !semester || course.semester === semester;
      const matchesCourse = !courseId || course.id === courseId;
      return matchesSearch && matchesDepartment && matchesLevel && matchesSemester && matchesCourse;
    });
  }, [courses, department, level, semester, courseId, search]);

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
              <option value="geology">Geology (provisional catalog)</option>
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
                <option key={course.id} value={course.id}>{course.code} · provisional</option>
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
          <span className="resource-count">Feed not connected</span>
        </div>
        <div className="resource-empty-state">
          <span className="empty-state-icon" aria-hidden="true">⌕</span>
          <h3>Approved resources are not connected yet</h3>
          <p>
            This page will list materials after the approved-resource feed is connected and files are
            uploaded, reviewed, and approved. Reference-folder files are not hosted or available to open.
          </p>
        </div>
      </section>

      <section className="course-index" aria-labelledby="course-index-heading">
        <div className="results-heading">
          <div>
            <p className="eyebrow">REFERENCE INDEX</p>
            <h2 id="course-index-heading">Provisional Geology course codes</h2>
          </div>
          {!loading && !error && <span className="resource-count">{visibleCourses.length} of {courses.length}</span>}
        </div>
        <div className="catalog-warning" role="note">
          <strong>This is not an official course catalog.</strong>
          <span>Codes are derived from reference filenames. Titles, semesters, and academic levels are not verified; no materials are attached.</span>
        </div>
        {loading ? (
          <p className="catalog-message" role="status">Loading the provisional course index…</p>
        ) : error ? (
          <div className="catalog-error" role="alert">
            <p>{error}</p>
            <button type="button" className="button button-secondary" onClick={() => void loadCatalog()}>Try again</button>
          </div>
        ) : visibleCourses.length ? (
          <>
            <div className="catalog-grid">
              {visibleCourses.map((course) => (
                <article className="catalog-course" key={course.id}>
                  <div className="catalog-course-topline">
                    <span className="catalog-course-code">{course.code}</span>
                    <span className="catalog-status">Provisional</span>
                  </div>
                  <h3>{course.title ?? 'Official course title not verified'}</h3>
                  <dl>
                    <div><dt>Level</dt><dd>{course.level} (inferred)</dd></div>
                    <div><dt>Semester</dt><dd>{course.semester ?? 'Not verified'}</dd></div>
                    <div><dt>Published materials</dt><dd>None</dd></div>
                  </dl>
                  <details>
                    <summary>Reference filenames ({course.sourceFiles.length})</summary>
                    <ul>{course.sourceFiles.map((file) => <li key={file}>{file}</li>)}</ul>
                    <p>These filenames are references only; the files are not accessible through Campus Vault.</p>
                  </details>
                </article>
              ))}
            </div>
            {!search.trim() && unassignedPastQuestionReferences.length > 0 && (
              <section className="unassigned-references" aria-labelledby="past-question-references">
                <h3 id="past-question-references">Level-wide past-question references</h3>
                <p>These filenames do not identify a specific course and are not hosted or available to open.</p>
                <ul>
                  {unassignedPastQuestionReferences.map((file) => <li key={file}>{file}</li>)}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p className="catalog-message" role="status">No course codes match the current search and course filters.</p>
        )}
      </section>
    </main>
  );
}
