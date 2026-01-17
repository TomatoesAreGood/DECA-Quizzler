import { Link } from 'react-router-dom';

export function ExamList({ exams, category, title }) {
  if (!exams || exams.length === 0) return null;

  const getCategoryColor = () => {
    switch (category) {
      case 'icdc': return 'var(--color-warning)';
      case 'sample': return 'var(--color-secondary)';
      case 'unit': return 'var(--color-success)';
      default: return 'var(--color-primary)';
    }
  };

  return (
    <section className="exam-section">
      <div className="exam-section-header">
        <h2 className="exam-section-title">{title}</h2>
        <span className="exam-count">{exams.length} exam{exams.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="exam-grid">
        {exams.map((exam) => (
          <Link
            key={exam}
            to={`/quiz?exam=${exam}`}
            className="exam-card"
            style={{ '--category-color': getCategoryColor() }}
          >
            <div className="exam-card-content">
              <span className="exam-name">{exam}</span>
              <span className="exam-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
