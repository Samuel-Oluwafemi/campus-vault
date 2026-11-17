export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <a className="brand footer-brand" href="/#top">
          <span className="brand-mark" aria-hidden="true">CV</span>
          <span>Campus Vault</span>
        </a>
        <p>Learn together. Share knowledge. Stay prepared.</p>
        <div className="footer-meta">
          <span className="footer-note">A student-first academic library</span>
          <span className="footer-credit">
            Designed &amp; Built by{' '}
            <a href="https://samueloluwafemi.netlify.app" target="_blank" rel="noreferrer">
              Samuel Oluwafemi
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
