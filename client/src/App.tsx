import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { DatasetDetails } from './pages/DatasetDetails';
import { AddDataset } from './pages/AddDataset';
import { Login } from './pages/Login';
import { DataSources } from './pages/DataSources';
import { Queries } from './pages/Queries';
import { Activity } from './pages/Activity';
import { Settings } from './pages/Settings';
import { GlobalSearch } from './pages/GlobalSearch';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

import { Landing } from './pages/Landing';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { token } = useAuth();

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
        <Routes>
        {/* Public Informational Landing & Customer Onboarding Pages */}
        <Route path="/onboarding" element={<Landing />} />
        <Route path="/franchise" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Main Application with Smart Root */}
        <Route path="/" element={token ? <DashboardLayout /> : <Landing />}>
          <Route index element={token ? <Dashboard /> : null} />
          <Route path="catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="dataset/:id" element={<ProtectedRoute><DatasetDetails /></ProtectedRoute>} />
          <Route path="add-dataset" element={<ProtectedRoute><AddDataset /></ProtectedRoute>} />
          <Route path="data-sources" element={<ProtectedRoute><DataSources /></ProtectedRoute>} />
          <Route path="queries" element={<ProtectedRoute><Queries /></ProtectedRoute>} />
          <Route path="activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="search" element={<ProtectedRoute><GlobalSearch /></ProtectedRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
  );
}

export default App;
