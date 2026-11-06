import { Link } from 'react-router-dom';
import { SEO } from '../components/shared/SEO';

export function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found - DECA Quizzler"
        description="This page could not be found. Return to the home page to access DECA practice exams."
        canonical="/404"
      />
      <main className="not-found-page">
        <div className="not-found-container">
          <div className="not-found-content">
            <h1 className="not-found-title">404</h1>
            <h2 className="not-found-heading">Page Not Found</h2>
            <p className="not-found-message">
              The page you're looking for doesn't exist. This might be because:
            </p>
            <ul className="not-found-reasons">
              <li>You followed a link from our old domain</li>
              <li>The page was moved or removed</li>
              <li>The URL was mistyped</li>
            </ul>
            <p className="not-found-help">
              Don't worry! Head back to our home page to access all DECA practice exams and study materials.
            </p>
            <div className="not-found-actions">
              <Link to="/" className="action-button action-button-home-primary">
                Go to Home Page
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
