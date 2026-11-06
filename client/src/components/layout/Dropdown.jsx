import { Link } from 'react-router-dom';

export function Dropdown({ sector, exams, route }) {
  const isCore = sector === 'CORE';

  return (
    <div className="dropdown">
      <Link className="dropbtn" to={route}>
        {sector} ▼
      </Link>
      <div className={`grid-container ${isCore ? 'grid-container-core' : ''}`}>
        {exams.map((exam) => (
          <div key={exam} className="dropdown-element">
            <Link to={`/quiz?exam=${exam}`}>
              {exam.length > 15 ? `${exam.substring(0, 13)}...` : exam}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
