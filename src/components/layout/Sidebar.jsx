import { Link } from 'react-router-dom';
import { SVGIcon } from '../shared/SVGIcon';

export function Sidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="sidebar-backdrop" onClick={onClose} />

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="close-sidebar-btn" onClick={onClose} aria-label="Close menu">
            <SVGIcon type="close" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link className="sidebar-item" to="/ent" onClick={onClose}>
            <span>Entrepreneurship</span>
          </Link>

          <Link className="sidebar-item" to="/fin" onClick={onClose}>
            <span>Finance</span>
          </Link>

          <Link className="sidebar-item" to="/mkt" onClick={onClose}>
            <span>Marketing</span>
          </Link>

          <Link className="sidebar-item" to="/ht" onClick={onClose}>
            <span>Hospitality & Tourism</span>
          </Link>

          <Link className="sidebar-item" to="/bma" onClick={onClose}>
            <span>Business Management</span>
          </Link>

          <Link className="sidebar-item" to="/core" onClick={onClose}>
            <span>Principles/Core</span>
          </Link>

          <Link className="sidebar-item" to="/favorites" onClick={onClose}>
            <span>Favorites</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
