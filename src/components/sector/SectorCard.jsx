import { Link } from 'react-router-dom';

export function SectorCard({ sector, fullName, image, route }) {
  return (
    <div className="sector-card" data-sector={sector}>
      <a href={route} aria-label={`${fullName} DECA practice exams`}>
        <img
          className="sector clickableButton"
          src={image}
          alt={`${fullName} DECA practice exams`}
          loading="lazy"
        />
      </a>
      <Link to={route}>
        <h3>{sector} Exams</h3>
      </Link>
    </div>
  );
}
