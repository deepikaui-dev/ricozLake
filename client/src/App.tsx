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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="dataset/:id" element={<DatasetDetails />} />
          <Route path="add-dataset" element={<AddDataset />} />
          <Route path="data-sources" element={<DataSources />} />
          <Route path="queries" element={<Queries />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
          <Route path="search" element={<GlobalSearch />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
