import { SectorGrid } from '../components/sector/SectorGrid';

export function HomePage() {
  return (
    <main>
      <div className="page-header">
        <h1>DECA Quizzler</h1>
        <p className="header-subtext-xl">A minimalistic DECA quizzing website</p>
      </div>
      <SectorGrid />
    </main>
  );
}
