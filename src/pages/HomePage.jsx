import { Link } from 'react-router-dom';
import { SectorGrid } from '../components/sector/SectorGrid';
import { SampleQuestion } from '../components/home/SampleQuestion';
import { SEO } from '../components/shared/SEO';

// Counts come from public/data at build time (see vite.config.js)
const EXAM_STATS = Object.values(__EXAM_STATS__);
const TOTAL_EXAMS = EXAM_STATS.reduce((total, sector) => total + sector.exams, 0);
const TOTAL_QUESTIONS = EXAM_STATS.reduce((total, sector) => total + sector.questions, 0);

// Scroll without changing the URL hash, which the router would treat as a new page visit
function scrollToClusters(e) {
  e.preventDefault();
  document.getElementById('clusters')?.scrollIntoView({ behavior: 'smooth' });
}

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
        <section className="home-hero">
          <div className="home-hero-text">
            <h1>Practice DECA exams online</h1>
            <p className="home-lead">
              Full 100-question exams from all six clusters, including past ICDC
              and sample tests. Every question comes with an explanation, so
              when you miss one, you'll know why.
            </p>
            <p className="home-sublead">
              Getting ready for regionals, provincials, or ICDC? Pick your
              cluster and start. No account needed.
            </p>
            <a href="#clusters" className="home-cta" onClick={scrollToClusters}>Browse exams</a>
            <dl className="home-stats">
              <div>
                <dt>Exams</dt>
                <dd>{TOTAL_EXAMS}</dd>
              </div>
              <div>
                <dt>Questions</dt>
                <dd>{TOTAL_QUESTIONS.toLocaleString('en-US')}</dd>
              </div>
              <div>
                <dt>Clusters</dt>
                <dd>{EXAM_STATS.length}</dd>
              </div>
            </dl>
          </div>
          <SampleQuestion />
        </section>

        <section id="clusters" className="home-section" aria-labelledby="clusters-title">
          <div className="home-section-header">
            <h2 id="clusters-title">Pick your cluster</h2>
            <p>Each one has its own exams, plus a unit exam.</p>
          </div>
          <SectorGrid />
        </section>

        <section className="home-section home-features" aria-labelledby="features-title">
          <div className="home-section-header">
            <h2 id="features-title">Inside an exam</h2>
          </div>
          <ul className="feature-list">
            <li>
              <h3>Explanations when you miss</h3>
              <p>
                Get a question wrong and you'll see the right answer and why
                before moving on. Get it right and the next question loads on
                its own.
              </p>
            </li>
            <li>
              <h3>Slow Mode</h3>
              <p>
                Shows the explanation after every question, including the ones
                you got right. You move on when you're ready.
              </p>
            </li>
            <li>
              <h3>Shuffle</h3>
              <p>
                Mixes up the order of the questions you haven't answered yet,
                so you're not just memorizing the sequence.
              </p>
            </li>
            <li>
              <h3>A review at the end</h3>
              <p>
                Finish or exit an exam to see your score and go back through
                the questions you missed.
              </p>
            </li>
            <li>
              <h3>Favorites</h3>
              <p>
                Star any question to save it. The{' '}
                <Link to="/favorites">FAV</Link> page turns everything you've
                starred into one quiz, saved right in your browser.
              </p>
            </li>
            <li>
              <h3>Search by exam number</h3>
              <p>
                Know which exam you want? Type its number, like 1167, into the
                search bar to jump straight to it.
              </p>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
