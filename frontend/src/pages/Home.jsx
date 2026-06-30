import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';
import { 
  Utensils, Wrench, ShoppingBag, Truck, Megaphone, Search, 
  MapPin, Star, Sparkles, ChevronRight 
} from 'lucide-react';

const Home = () => {
  const { user, condos, activeCondoId, showToast } = useApp();
  const navigate = useNavigate();

  const [searchVal, setSearchVal] = useState('');
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getActiveCondoName = () => {
    const selected = condos.find(c => c.id.toString() === activeCondoId);
    return selected ? selected.name : 'Nestly Condo';
  };

  const fetchPopularItems = async () => {
    try {
      const data = await api.get('/listings');
      setPopularItems(data.slice(0, 4));
    } catch (err) {
      console.warn('Failed to load home items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularItems();
  }, [activeCondoId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchVal)}`);
    }
  };

  return (
    <div className="animated-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Search Bar on Top */}
      <form onSubmit={handleSearchSubmit} className="search-bar-mockup">
        <Search size={16} />
        <input 
          type="text" 
          placeholder="Search services, items, shops..." 
          className="search-input-mockup"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </form>

      {/* Greetings Block */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.15rem' }}>
          👋 Hello, {user ? user.fullName.split(' ')[0] : 'Resident'}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Welcome back to {getActiveCondoName()}
        </p>
      </div>

      {/* Hero Welcome banner with Condo image illustration */}
      <div className="hero-box">
        <div className="hero-text-side">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'rgba(0, 122, 83, 0.1)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.58rem',
            fontWeight: 800,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            marginBottom: '0.5rem'
          }}>
            <Sparkles size={8} fill="var(--primary)" />
            Regent Home App
          </div>
          <h2>Everything you need, right here at home.</h2>
          <p>Local marketplace & home runners for verified residents.</p>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400&auto=format&fit=crop" 
          alt="Condo Building" 
          className="hero-image-side"
        />
      </div>

      {/* Quick Access Categories Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
          Quick Access
        </h3>
        
        <div className="category-grid">
          {/* Food & Drinks */}
          <div className="category-item" onClick={() => navigate('/marketplace?category=food')}>
            <div className="category-icon-wrapper" style={{ background: 'var(--color-food)' }}>
              <Utensils size={22} />
            </div>
            <span className="category-title-label">Food & Drinks</span>
            <span className="category-desc-label">Local kitchens</span>
          </div>

          {/* Home Services */}
          <div className="category-item" onClick={() => navigate('/marketplace?category=services')}>
            <div className="category-icon-wrapper" style={{ background: 'var(--color-service)' }}>
              <Wrench size={22} />
            </div>
            <span className="category-title-label">Home Services</span>
            <span className="category-desc-label">Aircon & more</span>
          </div>

          {/* Buy & Sell */}
          <div className="category-item" onClick={() => navigate('/marketplace?category=marketplace')}>
            <div className="category-icon-wrapper" style={{ background: 'var(--color-buysell)' }}>
              <ShoppingBag size={22} />
            </div>
            <span className="category-title-label">Buy & Sell</span>
            <span className="category-desc-label">Second hand</span>
          </div>

          {/* Delivery / Runner */}
          <div className="category-item" onClick={() => navigate('/runners')}>
            <div className="category-icon-wrapper" style={{ background: 'var(--color-runner)' }}>
              <Truck size={22} />
            </div>
            <span className="category-title-label">Delivery/Runner</span>
            <span className="category-desc-label">Send & deliver</span>
          </div>

          {/* Community announcements */}
          <div className="category-item" onClick={() => navigate('/marketplace?category=announcements')}>
            <div className="category-icon-wrapper" style={{ background: 'var(--color-community)' }}>
              <Megaphone size={22} />
            </div>
            <span className="category-title-label">Community</span>
            <span className="category-desc-label">Announcements</span>
          </div>

          {/* Lost & Found */}
          <div className="category-item" onClick={() => navigate('/marketplace?category=lost_and_found')}>
            <div className="category-icon-wrapper" style={{ background: 'var(--color-lostfound)' }}>
              <Search size={22} />
            </div>
            <span className="category-title-label">Lost & Found</span>
            <span className="category-desc-label">Find lost items</span>
          </div>
        </div>
      </div>

      {/* Horizontal Popular Near You scroll */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Popular Near You
          </h3>
          <Link to="/marketplace" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Loading feed...</div>
        ) : popularItems.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', textAlign: 'center' }}>
            No listings available inside this building.
          </div>
        ) : (
          <div className="horizontal-scroll-container">
            {popularItems.map((item) => (
              <div 
                key={item.id} 
                className="scroll-card" 
                onClick={() => navigate(`/listings/${item.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                  alt={item.title} 
                  className="scroll-card-image"
                />
                <div className="scroll-card-info">
                  <div className="scroll-card-title">{item.title}</div>
                  
                  {/* Rating / Star rating details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', margin: '0.15rem 0' }}>
                    <Star size={10} fill="#ffc107" stroke="none" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>4.8</span>
                  </div>

                  <div className="scroll-card-price">฿{Number(item.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Home;
