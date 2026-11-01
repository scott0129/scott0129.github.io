import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import './paper.min.css';
import './site.css';

// Layout for the personal site: /, /projects, /blog and the 404 page.
// Its global styles (paper.css and friends) only load with this chunk.
// /chess and /cougher are separate sections, reached with plain links
// (full page loads) so their styles never mix with these.
const FONTS_URL = 'https://fonts.googleapis.com/css?family=Neucha|Patrick+Hand+SC';

export default function HomeSite() {
  useEffect(() => {
    document.title = 'Scott.Kim';
    // paper.css's handwriting fonts. Added at runtime instead of via @import in
    // the stylesheet so a blocked or offline Google Fonts can't break the page.
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONTS_URL;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  return (
    <>
      <nav className="split-nav">
        <div className="nav-brand">
          <h3>
            <Link to="/">Scott.Kim</Link>
          </h3>
        </div>
        <div className="collapsible">
          <input id="collapsible1" type="checkbox" name="collapsible1" />
          <button>
            <label htmlFor="collapsible1">
              <div className="bar1"></div>
              <div className="bar2"></div>
              <div className="bar3"></div>
            </label>
          </button>
          <div className="collapsible-body">
            <ul className="inline">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><a href="/chess">Chess</a></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><a href="https://github.com/scott0129">GitHub</a></li>
            </ul>
          </div>
        </div>
      </nav>
      <Outlet />
    </>
  );
}
