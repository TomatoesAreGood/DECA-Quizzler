import { SectorCard } from './SectorCard';
import { SECTOR_IMAGES } from '../../utils/constants';

export function SectorGrid() {
  return (
    <ul className="sectorList">
      <li><SectorCard sector="ENT" image={SECTOR_IMAGES.ENT} route="/ent" fullName="Entrepreneurship" /></li>
      <li><SectorCard sector="FIN" image={SECTOR_IMAGES.FIN} route="/fin" fullName="Finance" /></li>
      <li><SectorCard sector="MKT" image={SECTOR_IMAGES.MKT} route="/mkt" fullName="Marketing" /></li>
      <li><SectorCard sector="H&T" image={SECTOR_IMAGES.HT} route="/ht" fullName="Hospitality & Tourism" /></li>
      <li><SectorCard sector="BMA" image={SECTOR_IMAGES.BMA} route="/bma" fullName="Business Management" /></li>
      <li><SectorCard sector="CORE" image={SECTOR_IMAGES.CORE} route="/core" fullName="Core" /></li>
    </ul>
  );
}
