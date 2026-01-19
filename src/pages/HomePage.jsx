import { SectorGrid } from '../components/sector/SectorGrid';
import { SEO } from '../components/shared/SEO';

export function HomePage() {
  return (
    <>
      <SEO
        title="Home"
        description="Practice DECA exams online for free. Choose from Entrepreneurship, Finance, Marketing, Hospitality & Tourism, Business Management, and Core exams. ICDC and sample exams available."
        keywords="DECA, DECA exams, DECA practice, ICDC, business competition, entrepreneurship, marketing, finance, hospitality, business management, DECA quizzer, DECA study"
        canonical="/"
      />
      <main>
        <div className="page-header">
          <h1>DECA Quizzer</h1>
          <p className="header-subtext-xl">A minimalistic DECA quizzing website</p>
        </div>
        <SectorGrid />
      </main>
    </>
  );
}
