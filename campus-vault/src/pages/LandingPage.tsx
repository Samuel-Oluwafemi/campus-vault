import SiteHeader from '@/components/layout/SiteHeader';
import { Link } from 'react-router-dom';

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
              <Link className="button button-primary" to="/register">
                Get started <span aria-hidden="true">→</span>
              </Link>
              <a className="text-link" href="#library">
                About the library <span aria-hidden="true">↓</span>
              </a>
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
              <p className="preview-caption">A product direction preview — the live library is not connected yet.</p>
            </div>
            <div className="visual-footnote"><span>01</span> ORGANISE <i /> <span>02</span> REVIEW <i /> <span>03</span> LEARN</div>
          </div>
        </section>

        <section className="principles-band" id="principles" aria-label="Campus Vault principles">
          <div className="principles-inner page-width">
            <p>Built around what matters</p>
            <div><span className="principle-symbol">◎</span> Free for students</div>
            <div><span className="principle-symbol">▤</span> Organised for courses</div>
            <div><span className="principle-symbol">✓</span> Reviewed before publishing</div>
          </div>
        </section>

        <section className="problem-section page-width" id="library">
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
              Firebase account creation, sign-in and email verification are implemented,
              but need your Firebase web app configuration to run. Student profiles, a
              live academic library, uploads and downloads are not connected yet; those
              require the trusted backend described in the project plan.
            </p>
          </div>
          <div className="status-actions">
            <Link className="text-link" to="/login">Open sign in <span aria-hidden="true">→</span></Link>
            <a className="text-link status-link" href="#top">Back to top <span aria-hidden="true">↑</span></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-inner">
          <a className="brand footer-brand" href="#top">
            <span className="brand-mark" aria-hidden="true">CV</span>
            <span>Campus Vault</span>
          </a>
          <p>Learn together. Share knowledge. Stay prepared.</p>
          <span className="footer-note">A student-first academic library</span>
        </div>
      </footer>
    </div>
  );
}
