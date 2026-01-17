import { SectorGrid } from '../components/sector/SectorGrid';

export function HomePage() {
  return (
    <main>
      <div className="page-header">
        <h1>DECA Quizzler</h1>
        <p className="header-subtext-md">A minimalistic DECA quizzing website</p>
      </div>
      <h2 id="sectorHeading">Sectors</h2>
      <SectorGrid />
    </main>
  );
}
