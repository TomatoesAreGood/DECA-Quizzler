import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { SectorPage } from './pages/SectorPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { TrafficPage } from './pages/TrafficPage';
import { trackVisit } from './utils/analytics';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Don't track activity on the traffic page
    if (location.pathname !== '/traffic') {
      trackVisit();
    }
  }, [location]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/traffic" element={<TrafficPage />} />
        <Route path="/:sector" element={<SectorPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
      <Analytics />
    </HelmetProvider>
  );
}

export default App;
