import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [condos, setCondos] = useState([]);
  const [activeCondoId, setActiveCondoId] = useState(() => {
    return localStorage.getItem('condoId') || '';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Toggle Theme (Light / Dark)
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateBodyThemeClass(newTheme);
  };

  const updateBodyThemeClass = (currentTheme) => {
    if (currentTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  // Set Condominium context
  const selectCondo = (id) => {
    setActiveCondoId(id);
    if (id) {
      localStorage.setItem('condoId', id);
    } else {
      localStorage.removeItem('condoId');
    }
  };

  const fetchCondosList = async () => {
    try {
      const data = await api.get('/auth/condos');
      setCondos(data);
      // Auto-select first condo if none selected
      if (data.length > 0 && !activeCondoId) {
        selectCondo(data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to retrieve condominiums listing:', err.message);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.get('/auth/profile');
      setUser(data);
      initSocket();
    } catch (err) {
      // Try refresh token rotation before logging out
      try {
        const refreshData = await api.post('/auth/refresh');
        localStorage.setItem('token', refreshData.token);
        // Retry fetch profile
        const retryUser = await api.get('/auth/profile');
        setUser(retryUser);
        initSocket();
      } catch (refreshErr) {
        console.warn('Authentication token expired / login required.');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    if (userData.condominiumId) {
      selectCondo(userData.condominiumId.toString());
    }
    initSocket();
    showToast('Welcome back to Nestly!', 'success');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed: ', err.message);
    }
    localStorage.removeItem('token');
    setUser(null);
    disconnectSocket();
    showToast('Logged out successfully.');
  };

  useEffect(() => {
    updateBodyThemeClass(theme);
    fetchCondosList();
    
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
    return () => disconnectSocket();
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      condos,
      activeCondoId,
      selectCondo,
      theme,
      toggleTheme,
      loading,
      toasts,
      showToast,
      login,
      logout,
      fetchProfile
    }}>
      {children}
      
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div>{toast.message}</div>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
