import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import FieldsList from './pages/FieldsList';
import FieldDetail from './pages/FieldDetail';
import FieldForm from './pages/FieldForm';
import Agents from './pages/Agents';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/my-fields" replace />;
  return <Layout>{children}</Layout>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/dashboard' : '/my-fields'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={
            <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
          } />
          <Route path="/my-fields" element={
            <ProtectedRoute><AgentDashboard /></ProtectedRoute>
          } />
          <Route path="/fields" element={
            <ProtectedRoute><FieldsList /></ProtectedRoute>
          } />
          <Route path="/fields/new" element={
            <ProtectedRoute adminOnly><FieldForm /></ProtectedRoute>
          } />
          <Route path="/fields/:id" element={
            <ProtectedRoute><FieldDetail /></ProtectedRoute>
          } />
          <Route path="/fields/:id/edit" element={
            <ProtectedRoute><FieldForm /></ProtectedRoute>
          } />
          <Route path="/agents" element={
            <ProtectedRoute adminOnly><Agents /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}