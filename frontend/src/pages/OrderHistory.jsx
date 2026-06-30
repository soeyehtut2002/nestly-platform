import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderHistory = () => {
  const { user, showToast } = useApp();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const data = await api.get('/chats');
        setChats(data);
      } catch (err) {
        showToast(err.message || 'Failed to load order history.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, []);

  // Map chats into mock/real transactional orders
  const purchases = chats
    .filter(c => c.buyerId === user?.id)
    .map(c => ({
      id: c.id,
      date: new Date(c.createdAt).toLocaleDateString(),
      itemName: c.seller?.shopName ? `${c.seller.shopName} Special` : 'Neighborhood Product/Service',
      partnerName: c.seller?.fullName,
      roomNumber: c.seller?.roomNumber,
      status: 'IN_DISCUSSION',
      type: 'Purchase'
    }));

  const sales = chats
    .filter(c => c.sellerId === user?.id)
    .map(c => ({
      id: c.id,
      date: new Date(c.createdAt).toLocaleDateString(),
      itemName: 'Your Listing Item',
      partnerName: c.buyer?.fullName,
      roomNumber: c.buyer?.roomNumber,
      status: 'IN_DISCUSSION',
      type: 'Sale'
    }));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_DISCUSSION':
        return (
          <span className="badge" style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> In Discussion
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle size={12} /> Completed
          </span>
        );
      default:
        return null;
    }
  };

  const currentOrders = activeTab === 'purchases' ? purchases : sales;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading transaction history...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <Link to="/profile" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
        <ArrowLeft size={16} />
        Back to Profile
      </Link>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag />
          Transaction & Order History
        </h2>

        {/* Tabs switcher */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('purchases')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'purchases' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              paddingBottom: '0.5rem',
              borderBottom: activeTab === 'purchases' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            My Purchases ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'sales' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              paddingBottom: '0.5rem',
              borderBottom: activeTab === 'sales' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            My Sales ({sales.length})
          </button>
        </div>

        {currentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Truck size={40} style={{ marginBottom: '1rem', strokeWidth: 1.5 }} />
            <p>No transactions recorded yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Deals are made directly via chat when buying or selling items.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '1.25rem',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{order.date}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{order.itemName}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {order.type === 'Purchase' ? 'Seller' : 'Buyer'}: <strong>{order.partnerName}</strong> (Room {order.roomNumber})
                  </div>
                </div>

                <Link to="/chat" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  Open Chat
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
