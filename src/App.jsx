import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import EssenzaTuinen from './pages/EssenzaTuinen';
import EssenzaTuinenDiensten from './pages/EssenzaTuinenDiensten';
import EssenzaTuinenDienst from './pages/EssenzaTuinenDienst';
import EssenzaTuinenProjecten from './pages/EssenzaTuinenProjecten';
import EssenzaTuinenWerkwijze from './pages/EssenzaTuinenWerkwijze';
import EssenzaTuinenOverOns from './pages/EssenzaTuinenOverOns';
import EssenzaTuinenVacatures from './pages/EssenzaTuinenVacatures';
import EssenzaTuinenContact from './pages/EssenzaTuinenContact';
import EssenzaTuinenConfigurator from './pages/EssenzaTuinenConfigurator';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EssenzaTuinen />} />
        <Route path="/diensten" element={<EssenzaTuinenDiensten />} />
        <Route path="/diensten/:slug" element={<EssenzaTuinenDienst />} />
        <Route path="/projecten" element={<EssenzaTuinenProjecten />} />
        <Route path="/werkwijze" element={<EssenzaTuinenWerkwijze />} />
        <Route path="/over-ons" element={<EssenzaTuinenOverOns />} />
        <Route path="/vacatures" element={<EssenzaTuinenVacatures />} />
        <Route path="/contact" element={<EssenzaTuinenContact />} />
        <Route path="/configurator" element={<EssenzaTuinenConfigurator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
