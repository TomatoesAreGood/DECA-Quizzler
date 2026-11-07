import { SEO } from './SEO';

// A page that's in the account menu but not built yet
export function PlaceholderPage({ title, description, canonical }) {
  return (
    <>
      <SEO title={title} description={description} canonical={canonical} />
      <main className="placeholder-page">
        <h1 className="placeholder-title">{title}</h1>
        <p className="placeholder-text">Coming soon.</p>
      </main>
    </>
  );
}
