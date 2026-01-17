import { SectorCard } from './SectorCard';
import { SECTOR_IMAGES } from '../../utils/constants';

export function SectorGrid() {
  return (
    <div className="sectorList">
      <SectorCard sector="ENT" image={SECTOR_IMAGES.ENT} route="/ent" />
      <SectorCard sector="FIN" image={SECTOR_IMAGES.FIN} route="/fin" />
      <SectorCard sector="MKT" image={SECTOR_IMAGES.MKT} route="/mkt" />
      <SectorCard sector="H&T" image={SECTOR_IMAGES.HT} route="/ht" />
      <SectorCard sector="BMA" image={SECTOR_IMAGES.BMA} route="/bma" />
      <SectorCard sector="CORE" image={SECTOR_IMAGES.CORE} route="/core" />
    </div>
  );
}
