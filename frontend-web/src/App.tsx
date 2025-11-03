import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import IncidentsPage from './pages/IncidentsPage';
import ProtectedRoute from './components/ProtectedRoute';

// --- TODAS TUS PÁGINAS ---
import CorrelationPage from './pages/CorrelationPage';
import SimpleRegressionPage from './pages/SimpleRegressionPage';
import MultiRegressionPage from './pages/MultiRegressionPage';
import AssistantPage from './pages/AssistantPage'; // <-- LA PÁGINA CLAVE

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Cargando...</div>;

  return (
    <Routes>
      {/* Ruta Pública */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />

      {/* Rutas Protegidas (Admin) */}
      <Route element={<ProtectedRoute isAdminRoute />}>
        <Route element={<DashboardLayout />}>
          
          <Route index element={<OverviewPage />} /> {/* Ruta: / */}
          <Route path="incidents" element={<IncidentsPage />} /> {/* Ruta: /incidents */}
          
          {/* --- TODAS TUS RUTAS DE ANÁLISIS --- */}
          {/* (Estas rutas coinciden con tu DashboardLayout.tsx) */}
          <Route path="analysis/regression" element={<SimpleRegressionPage />} />
          <Route path="analysis/multi-regression" element={<MultiRegressionPage />} />
          <Route path="analytics" element={<CorrelationPage />} />
          <Route path="assistant" element={<AssistantPage />} /> {/* <-- LA RUTA CLAVE */}

        </Route>
      </Route>

      {/* Catch-all: Si no encuentra nada, redirige */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;