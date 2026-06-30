import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { Search, ShoppingBag, Eye, Tag, Utensils, Wrench, Megaphone, HelpCircle, Truck } from 'lucide-react';

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';

  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { condos, activeCondoId, showToast } = useApp();

  const getActiveCondoName = () => {
    const selected = condos.find(c => c.id.toString() === activeCondoId);
    return selected ? selected.name : 'Your Condominium';
  };

  const getCategoryDetails = () => {
    switch (category) {
      case 'food':
        return {
          title: 'Food & Drinks',
          desc: 'Homemade meals, fresh bakeries, and organic drinks from neighbors.',
          color: 'var(--color-food)',
          icon: <Utensils size={28} />
        };
      case 'services':
        return {
          title: 'Home Services',
          desc: 'Aircon servicing, handyman repairs, and professional cleaners.',
          color: 'var(--color-service)',
          icon: <Wrench size={28} />
        };
      case 'marketplace':
        return {
          title: 'Buy & Sell',
          desc: 'Secondhand items, electronics, clothes, and home accessories.',
          color: 'var(--color-buysell)',
          icon: <ShoppingBag size={28} />
        };
      case 'runner':
        return {
          title: 'Runner Errands',
          desc: 'Hire resident couriers for 7-Eleven runs or parcel delivery.',
          color: 'var(--color-runner)',
          icon: <Truck size={28} />
        };
      case 'lost_and_found':
        return {
          title: 'Lost & Found',
          desc: 'Find lost items or submit found objects in the building.',
          color: 'var(--color-lostfound)',
          icon: <HelpCircle size={28} />
        };
      case 'announcements':
        return {
          title: 'Community Board',
          desc: 'Official condominium updates, alerts, and notice boards.',
          color: 'var(--color-community)',
          icon: <Megaphone size={28} />
        };
      default:
        return {
          title: 'All Active Directories',
          desc: 'Browse all local community directory listings in your building.',
          color: 'var(--primary)',
          icon: <ShoppingBag size={28} />
        };
    }
  };

  const catDetails = getCategoryDetails();

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = '';
      if (category) query += `category=${category}`;
      if (search) query += `${query ? '&' : ''}search=${encodeURIComponent(search)}`;

      const endpoint = `/listings${query ? `?${query}` : ''}`;
      const data = await api.get(endpoint);
      setListings(data);
    } catch (err) {
      showToast(err.message || 'Failed to retrieve listings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="animated-fade-in">
      
      {/* Category Specific Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: catDetails.color,
          border: `1px solid rgba(0,0,0,0.05)`
        }}>
          {catDetails.icon}
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.15rem' }}>{catDetails.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{catDetails.desc}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="premium-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          gap: '0.75rem',
          flexDirection: 'column'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.5rem', background: 'var(--bg-primary)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${catDetails.title.toLowerCase()}...`}
            />
            <Search size={16} style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
          </div>

          {/* Category Select */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' }}>
            <select
              className="form-input"
              style={{ background: 'var(--bg-primary)', cursor: 'pointer' }}
              value={category}
              onChange={(e) => setSearchParams({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="food">Food & Drinks</option>
              <option value="services">Home Services</option>
              <option value="marketplace">Buy & Sell</option>
              <option value="runner">Delivery/Runner</option>
              <option value="lost_and_found">Lost & Found</option>
              <option value="announcements">Community Board</option>
            </select>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Loading active records from {getActiveCondoName()}...
        </div>
      ) : listings.length === 0 ? (
        <div className="premium-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-secondary)' }}>
          <ShoppingBag size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem' }}>No listings here</h3>
          <p style={{ marginTop: '0.25rem', fontSize: '0.78rem' }}>Be the first verified resident to post a listing in this category!</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {listings.map((item) => (
            <div key={item.id} className="premium-card" style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              padding: '1rem'
            }}>
              {/* Product Thumbnail */}
              <img
                src={item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                alt={item.title}
                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
              />

              {/* Product Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  lineHeight: '1.4',
                  marginBottom: '0.5rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ฿{Number(item.price).toLocaleString()}
                  </div>

                  <Link to={`/listings/${item.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', borderRadius: '8px' }}>
                    <Eye size={12} />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
