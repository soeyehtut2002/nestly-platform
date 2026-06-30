import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';

const ForgotPassword = () => {
  const { condos, activeCondoId, selectCondo, showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [selectedCondo, setSelectedCondo] = useState(activeCondoId);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCondo) {
      return showToast('Please select your condominium building.', 'error');
    }

    if (!email) {
      return showToast('Please enter your email address.', 'error');
    }

    setLoading(true);
    selectCondo(selectedCondo);

    try {
      const data = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      showToast(data.message || 'Password reset email sent (check developer server console).', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to process password reset request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '3rem auto', animation: 'fadeIn 0.4s ease' }}>
      <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Reset Password</h2>
        
        {success ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
            <p style={{ marginBottom: '1.5rem' }}>
              If an account matches <strong>{email}</strong>, a password reset link has been generated.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              For development, check the backend node server console output to view and click the reset link!
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '0.8rem', textAlign: 'center' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Enter your email and building to retrieve a secure password reset link.
            </p>

            <div className="form-group">
              <label className="form-label">Condominium Building</label>
              <select
                className="form-input"
                value={selectedCondo}
                onChange={(e) => setSelectedCondo(e.target.value)}
                required
              >
                <option value="">-- Choose Building --</option>
                {condos.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    🏢 {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@email.com"
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
              style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Log in here
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
