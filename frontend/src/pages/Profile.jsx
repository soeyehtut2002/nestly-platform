import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';
import { User, Mail, Home, Phone, ShieldCheck, Shield, ChevronRight, LogOut, FileText, Edit, Save, X } from 'lucide-react';

const Profile = () => {
  const { user, setUser, condos, logout, showToast } = useApp();
  const navigate = useNavigate();

  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user ? user.fullName : '');
  const [editPhone, setEditPhone] = useState(user && user.phoneNumber ? user.phoneNumber : '');
  const [editAvatar, setEditAvatar] = useState(user && user.avatarUrl ? user.avatarUrl : '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Please log in to view your profile settings.</h3>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Go to Login
        </button>
      </div>
    );
  }

  const getCondoName = () => {
    const condo = condos.find((c) => c.id === user.condominiumId);
    return condo ? condo.name : 'Unknown Condo';
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.put('/users/profile', {
        fullName: editName,
        phoneNumber: editPhone
      });
      if (editAvatar && editAvatar !== user.avatarUrl) {
        await api.post('/users/avatar', { avatarUrl: editAvatar });
      }
      setUser({
        ...user,
        fullName: editName,
        phoneNumber: editPhone,
        avatarUrl: editAvatar
      });
      showToast('Profile updated successfully.', 'success');
      setIsEditing(false);
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Uploading avatar to Cloudinary...', 'info');
      const url = await api.uploadImage(file);
      setEditAvatar(url);
      showToast('Avatar uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Avatar upload failed.', 'error');
    }
  };

  const handleLogoutClick = () => {
    logout();
    showToast('You have logged out from your Nestly session.');
    navigate('/');
  };

  return (
    <div className="animated-fade-in" style={{ maxWidth: '440px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Profile Header card */}
      <div className="premium-card" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
        {!isEditing ? (
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setIsEditing(true)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
              title="Edit Profile"
            >
              <Edit size={18} />
            </button>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              overflow: 'hidden',
              margin: '0 auto 1rem',
              background: 'rgba(0, 122, 83, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={36} style={{ color: 'var(--primary)' }} />
              )}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>{user.fullName}</h2>
            <span className="badge badge-active" style={{ fontSize: '0.65rem' }}>{user.role}</span>
            
            <div style={{ 
              marginTop: '1.25rem', 
              borderTop: '1px solid var(--border-glass)', 
              paddingTop: '1rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Home size={16} style={{ color: 'var(--primary)' }} />
                <span>Room {user.roomNumber} &bull; {getCondoName()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <Phone size={16} />
                <span>{user.phoneNumber || 'No phone number provided'}</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Edit Profile</h3>
            
            <div className="form-group" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto 0.5rem',
                background: 'rgba(0, 122, 83, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {editAvatar ? (
                  <img src={editAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={30} style={{ color: 'var(--primary)' }} />
                )}
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                id="avatar-upload-file" 
                style={{ display: 'none' }} 
              />
              <label htmlFor="avatar-upload-file" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                Upload Avatar Image
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="e.g. 0812345678"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.6rem', gap: '0.4rem' }} disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ padding: '0.6rem', gap: '0.4rem' }}>
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Menu Options Group */}
      <div className="premium-card" style={{ padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        
        {/* Seller Panel or Registration */}
        <div 
          onClick={() => navigate('/seller-dashboard')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem', 
            cursor: 'pointer',
            borderRadius: '10px',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {user.role === 'SELLER' ? 'Seller Control Panel' : 'Apply as Resident Seller'}
            </span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Administrator Dashboard Link */}
        {(user.role === 'SYSTEM_ADMIN' || user.role === 'CONDO_ADMIN') && (
          <div 
            onClick={() => navigate('/admin')}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1rem', 
              cursor: 'pointer',
              borderRadius: '10px',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Shield size={18} style={{ color: '#e91e63' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Administrator Dashboard
              </span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Chats Shortcut */}
        <div 
          onClick={() => navigate('/chat')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem', 
            cursor: 'pointer',
            borderRadius: '10px',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MessageSquare size={18} style={{ color: '#2196f3' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>My Conversations</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Legal Documents */}
        <div 
          onClick={() => navigate('/legal/terms')}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem', 
            cursor: 'pointer',
            borderRadius: '10px',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Terms & PDPA Guidelines</span>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Logout Action Button */}
      <button 
        onClick={handleLogoutClick} 
        className="btn btn-secondary" 
        style={{ 
          width: '100%', 
          color: '#d32f2f', 
          border: '1px solid rgba(211, 47, 47, 0.2)', 
          background: 'rgba(211, 47, 47, 0.03)',
          justifyContent: 'center',
          gap: '0.6rem',
          padding: '0.85rem'
        }}
      >
        <LogOut size={16} />
        Log Out Session
      </button>

    </div>
  );
};

export default Profile;
