import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './layouts/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import ListingDetails from './pages/ListingDetails';
import RunnerBoard from './pages/RunnerBoard';
import ChatHub from './pages/ChatHub';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import Legal from './pages/Legal';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Private Route Guard
const PrivateRoute = ({ children }) => {
  const { user, loading } = useApp();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Authenticating...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/runners" element={<RunnerBoard />} />
        
        {/* Protected Resident Routes */}
        <Route path="/chat" element={
          <PrivateRoute>
            <ChatHub />
          </PrivateRoute>
        } />
        
        <Route path="/seller-dashboard" element={
          <PrivateRoute>
            <SellerDashboard />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        
        <Route path="/orders" element={
          <PrivateRoute>
            <OrderHistory />
          </PrivateRoute>
        } />
        
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } />

        <Route path="/super-admin" element={
          <PrivateRoute>
            <SuperAdminDashboard />
          </PrivateRoute>
        } />

        {/* Legal Routes */}
        <Route path="/legal/:docType" element={<Legal />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </Router>
  );
}

export default App;
