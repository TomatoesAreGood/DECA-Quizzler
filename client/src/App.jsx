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
import { QuestionBankPage } from './pages/QuestionBankPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { trackVisit } from './utils/analytics';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';
import { AuthModal } from './components/auth/AuthModal';
import { FEEDBACK_ENABLED } from './config/feedback';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { useThemeSync } from './hooks/useThemeSync';

function AppContent() {
  const location = useLocation();
  useThemeSync();

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
        <Route path="/question-bank" element={<QuestionBankPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/:sector" element={<SectorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      {FEEDBACK_ENABLED && <FeedbackWidget />}
      <AuthModal />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <FavoritesProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
          </Router>
        </FavoritesProvider>
      </AuthProvider>
      <Analytics />
    </HelmetProvider>
  );
}

export default App;
