import { SectorCard } from './SectorCard';
import { SECTOR_IMAGES } from '../../utils/constants';

// Counts come from public/data at build time (see vite.config.js)
const EXAM_STATS = __EXAM_STATS__;

// color matches the background of each sector image
const CLUSTERS = [
  { sector: 'ENT', file: 'ENT', fullName: 'Entrepreneurship', route: '/ent', image: SECTOR_IMAGES.ENT, color: '#7c868a', topics: 'Business planning, startups, and innovation' },
  { sector: 'FIN', file: 'FIN', fullName: 'Finance', route: '/fin', image: SECTOR_IMAGES.FIN, color: '#009b47', topics: 'Financial planning, investing, and banking' },
  { sector: 'MKT', file: 'MKT', fullName: 'Marketing', route: '/mkt', image: SECTOR_IMAGES.MKT, color: '#cc1d36', topics: 'Branding, advertising, and consumer behavior' },
  { sector: 'H&T', file: 'HnT', fullName: 'Hospitality & Tourism', route: '/ht', image: SECTOR_IMAGES.HT, color: '#0a75be', topics: 'Hotels, restaurants, travel, and events' },
  { sector: 'BMA', file: 'BMA', fullName: 'Business Management', route: '/bma', image: SECTOR_IMAGES.BMA, color: '#f6bc00', topics: 'Operations, human resources, and leadership' },
  { sector: 'CORE', file: 'CORE', fullName: 'Principles & Core', route: '/core', image: SECTOR_IMAGES.CORE, color: '#0d3b77', topics: 'Economics, communication, and business basics' }
];

export function SectorGrid() {
  return (
    <ul className="sectorList">
      {CLUSTERS.map(({ file, ...cluster }) => (
        <li key={cluster.sector}>
          <SectorCard {...cluster} stats={EXAM_STATS[file]} />
        </li>
      ))}
    </ul>
  );
}
