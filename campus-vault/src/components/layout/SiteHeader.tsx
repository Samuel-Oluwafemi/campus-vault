import { Link } from 'react-router-dom';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Campus Vault home">
        <span className="brand-mark" aria-hidden="true">
          CV
        </span>
        <span>Campus Vault</span>
      </Link>

      <nav className="site-nav" aria-label="Main navigation">
        <a href="#library">The library</a>
        <a href="#how-it-works">How it works</a>
        <a href="#principles">Our principles</a>
      </nav>

      <div className="header-actions">
        <Link className="header-signin" to="/login">Sign in</Link>
        <Link className="header-link" to="/register">Get started <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}
