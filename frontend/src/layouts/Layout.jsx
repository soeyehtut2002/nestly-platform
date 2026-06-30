import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Home as HomeIcon, ShoppingBag, MessageSquare, User, Bell, ChevronDown } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, condos, activeCondoId, selectCondo, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCondoChange = (e) => {
    selectCondo(e.target.value);
    // Refresh page to load isolated data
    window.location.reload();
  };

  const getActiveCondoName = () => {
    const selected = condos.find(c => c.id.toString() === activeCondoId);
    return selected ? selected.name : 'Choose Condominium';
  };

  return (
    <div className="app-container">
      {/* Mobile-Chassis Mobile Header */}
      <header className="mobile-header">
        <div>
          <div className="mobile-logo-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            Nestly
          </div>
          {/* Condominium selector underneath logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              🏢 {getActiveCondoName().split(' ')[0]}
            </span>
            <select
              value={activeCondoId}
              onChange={handleCondoChange}
              disabled={!!user}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.6rem',
                color: 'var(--primary)',
                fontWeight: 700,
                outline: 'none',
                cursor: !!user ? 'not-allowed' : 'pointer',
                padding: 0
              }}
            >
              {condos.map(c => (
                <option key={c.id} value={c.id.toString()}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notification Bell */}
        <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <Bell size={20} />
        </button>
      </header>

      {/* Main Content Area constrained to mobile layout (480px) */}
      <main className="main-content">
        {children}
      </main>

      {/* Sticky Bottom Navigation Bar (Mockup Style) */}
      <nav className="bottom-nav-bar">
        <div className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          <HomeIcon size={20} />
          <span>Home</span>
        </div>

        <div className={`bottom-nav-item ${location.pathname === '/marketplace' ? 'active' : ''}`} onClick={() => navigate('/marketplace')}>
          <ShoppingBag size={20} />
          <span>Market</span>
        </div>

        <div className={`bottom-nav-item ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => {
          if (!user) {
            navigate('/login');
          } else {
            navigate('/chat');
          }
        }}>
          <MessageSquare size={20} />
          <span>Messages</span>
        </div>

        <div className={`bottom-nav-item ${location.pathname === '/profile' || location.pathname === '/login' || location.pathname === '/register' ? 'active' : ''}`} onClick={() => {
          if (!user) {
            navigate('/login');
          } else {
            navigate('/profile');
          }
        }}>
          <User size={20} />
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
