import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { Building, Image, Users, Plus, ShieldAlert, Trash2, CheckCircle2, XCircle, Search, Save } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { user, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('condos');

  // Condos State
  const [condos, setCondos] = useState([]);
  const [newCondoName, setNewCondoName] = useState('');
  const [newCondoAddress, setNewCondoAddress] = useState('');
  const [newCondoProvince, setNewCondoProvince] = useState('Bangkok');
  const [condoLoading, setCondoLoading] = useState(false);

  // Banners State
  const [banners, setBanners] = useState([]);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [bannerLoading, setBannerLoading] = useState(false);

  // Users State
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch functions
  const fetchCondos = async () => {
    try {
      const data = await api.get('/admin/condos/all');
      setCondos(data);
    } catch (err) {
      showToast(err.message || 'Failed to load condominiums.', 'error');
    }
  };

  const fetchBanners = async () => {
    try {
      const data = await api.get('/admin/banners');
      setBanners(data);
    } catch (err) {
      try {
        const data = await api.get('/admin/banners');
        setBanners(data);
      } catch (e) {
        showToast(e.message || 'Failed to load banners.', 'error');
      }
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      showToast(err.message || 'Failed to load users list.', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'condos') fetchCondos();
    if (activeTab === 'banners') fetchBanners();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  // Actions
  const handleAddCondo = async (e) => {
    e.preventDefault();
    if (!newCondoName || !newCondoAddress) return;
    setCondoLoading(true);
    try {
      await api.post('/admin/condos', {
        name: newCondoName,
        address: newCondoAddress,
        province: newCondoProvince
      });
      showToast('Condominium building onboarded successfully!', 'success');
      setNewCondoName('');
      setNewCondoAddress('');
      fetchCondos();
    } catch (err) {
      showToast(err.message || 'Failed to onboard condo.', 'error');
    } finally {
      setCondoLoading(false);
    }
  };

  const handleToggleCondo = async (condoId, currentStatus) => {
    try {
      await api.put(`/admin/condos/${condoId}`, { isActive: !currentStatus });
      showToast('Condominium building status updated.', 'success');
      fetchCondos();
    } catch (err) {
      showToast(err.message || 'Failed to toggle condo status.', 'error');
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerImage) return;
    setBannerLoading(true);
    try {
      await api.post('/admin/banners', {
        title: newBannerTitle,
        imageUrl: newBannerImage,
        linkUrl: newBannerLink
      });
      showToast('Banner card added successfully.', 'success');
      setNewBannerTitle('');
      setNewBannerImage('');
      setNewBannerLink('');
      fetchBanners();
    } catch (err) {
      showToast(err.message || 'Failed to create banner.', 'error');
    } finally {
      setBannerLoading(false);
    }
  };

  const handleToggleBanner = async (bannerId, currentStatus) => {
    try {
      await api.put(`/admin/banners/${bannerId}`, { isActive: !currentStatus });
      showToast('Banner status updated successfully.', 'success');
      fetchBanners();
    } catch (err) {
      showToast(err.message || 'Failed to toggle banner.', 'error');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this advertisement banner?')) return;
    try {
      await api.delete(`/admin/banners/${bannerId}`);
      showToast('Banner deleted successfully.', 'success');
      fetchBanners();
    } catch (err) {
      showToast(err.message || 'Failed to delete banner.', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showToast('User role updated successfully.', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user role.', 'error');
    }
  };

  const handleToggleSuspend = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/suspend`, { suspend: !currentStatus });
      showToast(currentStatus ? 'User unsuspended.' : 'User suspended.', 'success');
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user suspension status.', 'error');
    }
  };

  // Filtered Users list
  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animated-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Super Admin SaaS Control Panel</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Global administration panel to onboard condos, manage advertising, and regulate user privileges.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-glass)',
        borderRadius: '10px',
        padding: '0.25rem',
        marginBottom: '1.5rem',
        gap: '0.25rem'
      }}>
        <button
          onClick={() => setActiveTab('condos')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'condos' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'condos' ? 'white' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Building size={16} />
          Condominiums
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'banners' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'banners' ? 'white' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Image size={16} />
          Ad Banners
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'users' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'users' ? 'white' : 'var(--text-secondary)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Users size={16} />
          Users & Admins
        </button>
      </div>

      {/* --- TAB CONTENT: CONDOMINIUMS --- */}
      {activeTab === 'condos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Onboarding form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} style={{ color: 'var(--primary)' }} /> Onboard New Condominium
            </h3>
            
            <form onSubmit={handleAddCondo} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Condo Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Noble Recole Sukhumvit"
                  value={newCondoName}
                  onChange={(e) => setNewCondoName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 15/9 Asoke Road"
                  value={newCondoAddress}
                  onChange={(e) => setNewCondoAddress(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Province</label>
                <select
                  className="form-input"
                  value={newCondoProvince}
                  onChange={(e) => setNewCondoProvince(e.target.value)}
                >
                  <option value="Bangkok">Bangkok</option>
                  <option value="Nonthaburi">Nonthaburi</option>
                  <option value="Pathum Thani">Pathum Thani</option>
                  <option value="Samut Prakan">Samut Prakan</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', height: '42px', justifyContent: 'center' }} disabled={condoLoading}>
                {condoLoading ? 'Adding...' : 'Onboard Condo'}
              </button>
            </form>
          </div>

          {/* Condos List */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Registered Buildings ({condos.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Condo Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Address</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Province</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {condos.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>🏢 {c.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{c.address}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{c.province}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span className={`badge ${c.isActive ? 'badge-active' : ''}`} style={{ background: c.isActive ? 'rgba(0,122,83,0.1)' : 'rgba(211,47,47,0.1)', color: c.isActive ? 'var(--primary)' : '#d32f2f' }}>
                          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleCondo(c.id, c.isActive)}
                          className="btn"
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.75rem',
                            background: c.isActive ? 'rgba(211,47,47,0.06)' : 'rgba(0,122,83,0.06)',
                            color: c.isActive ? '#d32f2f' : 'var(--primary)',
                            border: c.isActive ? '1px solid rgba(211,47,47,0.2)' : '1px solid rgba(0,122,83,0.2)'
                          }}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: AD BANNERS --- */}
      {activeTab === 'banners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Create Banner Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} style={{ color: 'var(--primary)' }} /> Create Advertisement Banner
            </h3>
            <form onSubmit={handleAddBanner} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Banner Title / Caption</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Welcome to Nestly Services!"
                  value={newBannerTitle}
                  onChange={(e) => setNewBannerTitle(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  value={newBannerImage}
                  onChange={(e) => setNewBannerImage(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Link URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. /legal/rules"
                  value={newBannerLink}
                  onChange={(e) => setNewBannerLink(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', height: '42px', justifyContent: 'center' }} disabled={bannerLoading}>
                {bannerLoading ? 'Uploading...' : 'Publish Banner'}
              </button>
            </form>
          </div>

          {/* Banners List */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>Active Ad Banners ({banners.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {banners.map((b) => (
                <div key={b.id} className="premium-card" style={{ padding: '0.75rem', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#eee', marginBottom: '0.75rem' }}>
                    <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{b.title || 'Untitled Banner'}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Link: {b.linkUrl || 'None'}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '0.6rem' }}>
                    <span className={`badge ${b.isActive ? 'badge-active' : ''}`} style={{ background: b.isActive ? 'rgba(0,122,83,0.1)' : 'rgba(211,47,47,0.1)', color: b.isActive ? 'var(--primary)' : '#d32f2f' }}>
                      {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleToggleBanner(b.id, b.isActive)}
                        className="btn"
                        style={{
                          padding: '0.35rem 0.5rem',
                          fontSize: '0.75rem',
                          background: b.isActive ? 'rgba(211,47,47,0.06)' : 'rgba(0,122,83,0.06)',
                          color: b.isActive ? '#d32f2f' : 'var(--primary)',
                          border: b.isActive ? '1px solid rgba(211,47,47,0.15)' : '1px solid rgba(0,122,83,0.15)'
                        }}
                      >
                        {b.isActive ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="btn"
                        style={{
                          padding: '0.35rem',
                          background: 'rgba(211,47,47,0.08)',
                          color: '#d32f2f',
                          border: '1px solid rgba(211,47,47,0.2)'
                        }}
                        title="Delete Banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: USERS & ADMINS --- */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Search bar */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '0.2rem', marginBottom: 0 }}
              placeholder="Search users by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Users Table */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Registered System Users ({filteredUsers.length})</h3>
            
            {usersLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading user directory...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Resident Details</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Condominium</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Room No.</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email} &bull; {u.phoneNumber || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>🏢 {u.condominium ? u.condominium.name : 'System Global'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{u.roomNumber}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: u.role === 'SYSTEM_ADMIN' ? 'rgba(233,30,99,0.1)' : u.role === 'CONDO_ADMIN' ? 'rgba(33,150,243,0.1)' : 'rgba(0,122,83,0.1)',
                              color: u.role === 'SYSTEM_ADMIN' ? '#e91e63' : u.role === 'CONDO_ADMIN' ? '#2196f3' : 'var(--primary)',
                              border: 'none',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="RESIDENT">RESIDENT</option>
                            <option value="SELLER">SELLER</option>
                            <option value="CONDO_ADMIN">CONDO ADMIN</option>
                            <option value="SYSTEM_ADMIN">SYSTEM ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                            className="btn"
                            style={{
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.75rem',
                              background: u.isSuspended ? 'rgba(0,122,83,0.06)' : 'rgba(211,47,47,0.06)',
                              color: u.isSuspended ? 'var(--primary)' : '#d32f2f',
                              border: u.isSuspended ? '1px solid rgba(0,122,83,0.2)' : '1px solid rgba(211,47,47,0.2)'
                            }}
                          >
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
