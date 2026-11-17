import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-inner">
        <div className="footer-intro">
          <Link className="brand footer-brand" to="/#top">
            <span className="brand-mark" aria-hidden="true">CV</span>
            <span>Campus Vault</span>
          </Link>
          <p>Learn together. Share knowledge. Stay prepared.</p>
        </div>
        <nav className="footer-links" aria-label="Footer quick links">
          <span className="footer-heading">Quick links</span>
          <Link to="/library">Library</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/login">Sign in</Link>
        </nav>
        <div className="footer-credit">
          <span className="footer-heading">Built with purpose</span>
          <span>Designed &amp; Built by</span>
          <a href="https://samueloluwafemi.netlify.app" target="_blank" rel="noreferrer">
            Samuel Oluwafemi
          </a>
        </div>
      </div>
    </footer>
  );
}
