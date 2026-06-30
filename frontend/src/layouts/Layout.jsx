import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';
import { Home as HomeIcon, ShoppingBag, MessageSquare, User, Bell, ChevronDown } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, condos, activeCondoId, selectCondo, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
        {user && (
          <div className="notification-dropdown-container" ref={dropdownRef}>
            <button 
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            
            {notifDropdownOpen && (
              <div className="notification-dropdown">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'var(--bg-tertiary)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      Mark all as read
                    </button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
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
