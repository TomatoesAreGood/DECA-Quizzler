import { SectorGrid } from '../components/sector/SectorGrid';
import { SEO } from '../components/shared/SEO';

export function HomePage() {
  return (
    <>
      <SEO
        title="Practice DECA Exams Online for Free"
        description="DECA Quizzer is a free online platform to practice DECA exams. Study Entrepreneurship, Finance, Marketing, Hospitality & Tourism, Business Management, and Core exams with realistic questions."
        keywords="DECA, DECA exams, DECA practice, ICDC, business competition, entrepreneurship, marketing, finance, hospitality, business management, DECA quizzer, DECA study, DECA test prep, deca ent, deca mkt, deca fin, deca bma, deca h&t, deca core"
        canonical="/"
      />
      <main className="home-page">
        <div className="hero-section">
          <header className="page-header">
            <h1>Practice DECA Exams Online</h1>
            <p className="header-subtext-xl">
              Master DECA competitive events with free, focused practice exams
              across all major clusters
            </p>
          </header>

          <div className="seo-intro">
            <p>
              Whether you are preparing for regionals, provincials, or ICDC,
              DECA Quizzer lets you practice DECA-style questions online.
              Choose your cluster below to start studying.
            </p>
          </div>
        </div>

        <section className="sectors-section" aria-labelledby="deca-sectors">
          <h2 id="deca-sectors" className="section-title">
            Choose Your Category
          </h2>
          <SectorGrid />
        </section>
      </main>
    </>
  );
}
