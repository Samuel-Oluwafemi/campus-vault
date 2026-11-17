import SiteHeader from '@/components/layout/SiteHeader';
import { Link } from 'react-router-dom';
import { useAuthUser } from '@/hooks/useAuthUser';
import SiteFooter from '@/components/layout/SiteFooter';

const resourceTypes = [
  { number: '01', title: 'Lecture notes', detail: 'Keep course material together.' },
  { number: '02', title: 'Past questions', detail: 'Prepare with relevant examples.' },
  { number: '03', title: 'Handouts & tests', detail: 'Find supporting study materials.' },
];

const steps = [
  {
    number: '01',
    title: 'Find your course',
    description: 'Browse materials through the department, level, semester and course they belong to.',
  },
  {
    number: '02',
    title: 'Study with confidence',
    description: 'Preview and download approved resources, with their type and academic session clearly shown.',
  },
  {
    number: '03',
    title: 'Contribute for review',
    description: 'Share permitted materials with the community. A submission stays private until it is reviewed.',
  },
];

export default function LandingPage() {
  const auth = useAuthUser();
  const authenticatedAction = auth.status === 'loading'
    ? null
    : auth.status === 'signedIn'
    ? auth.user.emailVerified
      ? { href: '/library', label: 'Open the library' }
      : { href: '/verify-email', label: 'Verify your email' }
    : { href: '/register', label: 'Get started' };

  return (
    <div id="top" className="site-shell">
      <SiteHeader />

      <main>
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A shared library for student learning</p>
            <h1 id="hero-title">Good study resources should be <em>easy to find.</em></h1>
            <p className="hero-description">
              Campus Vault is being built to bring lecture notes, past questions and other
              permitted study materials into one organised academic library.
            </p>
            <div className="hero-actions">
              {authenticatedAction ? (
                <Link className="button button-primary" to={authenticatedAction.href}>
                  {authenticatedAction.label} <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <span className="button button-primary hero-auth-loading" role="status">Checking account…</span>
              )}
              <Link className="text-link" to="/library">About the library <span aria-hidden="true">→</span></Link>
            </div>
            <div className="hero-note">
              <span className="note-icon" aria-hidden="true">✓</span>
              <span>Free student access is a core product principle.</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Campus Vault resource organisation preview">
            <div className="visual-topline">
              <span className="visual-label">A clearer way to study</span>
              <span className="visual-status"><span /> Designed around courses</span>
            </div>
            <div className="library-card">
              <div className="library-card-heading">
                <div>
                  <span className="card-kicker">YOUR ACADEMIC LIBRARY</span>
                  <h2>Resources with context.</h2>
                </div>
                <span className="book-mark" aria-hidden="true">⌂</span>
              </div>
              <div className="academic-path" aria-label="Academic organisation">
                <span>Department</span><b>›</b><span>Level</span><b>›</b><span>Course</span>
              </div>
              <div className="visual-divider" />
              <p className="visual-section-title">Materials, thoughtfully organised</p>
              <div className="resource-preview-list">
                {resourceTypes.map((resource) => (
                  <div className="resource-preview" key={resource.number}>
                    <span className="resource-number">{resource.number}</span>
                    <span className="resource-copy">
                      <strong>{resource.title}</strong>
                      <small>{resource.detail}</small>
                    </span>
                    <span className="resource-arrow" aria-hidden="true">↗</span>
                  </div>
                ))}
              </div>
              <p className="preview-caption">A product direction preview — course resources are not available yet.</p>
            </div>
            <div className="visual-footnote"><span>01</span> ORGANISE <i /> <span>02</span> REVIEW <i /> <span>03</span> LEARN</div>
          </div>
        </section>

        <section className="catalog-teaser page-width" id="library" aria-labelledby="catalog-title">
          <div className="catalog-teaser-copy">
            <p className="eyebrow">THE ACADEMIC LIBRARY</p>
            <h2 id="catalog-title">A clearer home for course materials.</h2>
            <p>
              Browse the separate library page for resource filters and the provisional Geology course index.
              Approved materials will appear there once the upload and review workflow is connected.
            </p>
          </div>
          <Link className="button button-primary" to="/library">Explore the library <span aria-hidden="true">→</span></Link>
        </section>

        <section className="principles-band" id="principles" aria-label="Campus Vault principles">
          <div className="principles-inner page-width">
            <p>Built around what matters</p>
            <div><span className="principle-symbol">◎</span> Free for students</div>
            <div><span className="principle-symbol">▤</span> Organised for courses</div>
            <div><span className="principle-symbol">✓</span> Reviewed before publishing</div>
          </div>
        </section>

        <section className="problem-section page-width" id="why-library">
          <div className="section-intro">
            <p className="eyebrow">THE PROBLEM WE’RE SOLVING</p>
            <h2>Useful materials shouldn’t get lost in the chat.</h2>
            <p>
              Students often rely on group messages and personal connections to find
              course materials. Campus Vault aims to make those resources easier to
              discover, understand and preserve.
            </p>
          </div>
          <div className="problem-list">
            <article>
              <span>01</span>
              <div><h3>Scattered across groups</h3><p>Important files are hard to find again when they are buried in old conversations.</p></div>
            </article>
            <article>
              <span>02</span>
              <div><h3>Hard to identify</h3><p>Without course, semester and session details, students can’t easily tell what a file covers.</p></div>
            </article>
            <article>
              <span>03</span>
              <div><h3>Knowledge disappears</h3><p>A useful resource can be lost when a student leaves or a group goes quiet.</p></div>
            </article>
          </div>
        </section>

        <section className="workflow-section" id="how-it-works">
          <div className="page-width workflow-inner">
            <div className="workflow-heading">
              <p className="eyebrow">A SIMPLE, TRUSTED FLOW</p>
              <h2>From contribution<br />to shared knowledge.</h2>
              <p>Students help the library grow. Moderation helps keep it useful and trustworthy.</p>
            </div>
            <div className="steps-list">
              {steps.map((step) => (
                <article className="step" key={step.number}>
                  <span className="step-number">{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                  <span className="step-mark" aria-hidden="true">↗</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="status-section page-width" aria-labelledby="status-title">
          <div className="status-mark" aria-hidden="true">i</div>
          <div>
            <p className="eyebrow">PROJECT STATUS</p>
            <h2 id="status-title">The foundation is taking shape.</h2>
            <p>
              Firebase sign-in, verified accounts and student profiles are connected.
              The student dashboard and separate library experience are available. The Geology
              course index is provisional; approved course materials, uploads, and downloads
              are not connected yet.
            </p>
          </div>
          <div className="status-actions">
            <Link className="text-link" to="/library">Explore the library <span aria-hidden="true">→</span></Link>
            <a className="text-link status-link" href="#top">Back to top <span aria-hidden="true">↑</span></a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
