import { Link } from 'react-router-dom';

export function SectorCard({ sector, image, route }) {
  return (
    <div className="sector-card">
      <Link to={route}>
        <img className="sector clickableButton" src={image} alt={sector} />
      </Link>
      <Link to={route}>
        <h3>{sector} Exams</h3>
      </Link>
    </div>
  );
}
