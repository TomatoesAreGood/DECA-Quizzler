import { Link } from 'react-router-dom';

export function SectorCard({ sector, fullName, image, route, color, topics, stats }) {
  return (
    <Link
      to={route}
      className="sector-card"
      style={{ '--sector-color': color }}
      aria-label={`${fullName} (${sector}) practice exams`}
    >
      <div className="sector-card-image">
        <img src={image} alt="" width="1152" height="648" loading="lazy" />
      </div>
      <div className="sector-card-body">
        <div className="sector-card-heading">
          <h3>{fullName}</h3>
          <span className="sector-card-code">{sector}</span>
        </div>
        <p className="sector-card-topics">{topics}</p>
        <div className="sector-card-footer">
          <span>
            {stats.exams} exams
            {stats.icdc > 0 && <> · {stats.icdc} from ICDC</>}
          </span>
          <span className="sector-card-arrow" aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
