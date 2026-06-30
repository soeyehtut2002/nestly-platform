import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';

const ResetPassword = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      return showToast('Password reset token is missing from the URL.', 'error');
    }

    if (password.length < 8) {
      return showToast('Password must be at least 8 characters long.', 'error');
    }

    if (password !== confirmPassword) {
      return showToast('Passwords do not match.', 'error');
    }

    setLoading(true);

    try {
      const data = await api.post('/auth/reset-password', {
        token,
        newPassword: password
      });
      setSuccess(true);
      showToast(data.message || 'Password reset successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reset password. The link may have expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '3rem auto', animation: 'fadeIn 0.4s ease' }}>
      <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>New Password</h2>

        {!token ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <p>Invalid Reset Link</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '2rem' }}>
              The password reset token is missing from the URL. Please request a new link.
            </p>
            <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '0.8rem', textAlign: 'center' }}>
              Request New Link
            </Link>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <p style={{ marginBottom: '1.5rem' }}>Your password has been successfully updated.</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '0.8rem', textAlign: 'center' }}>
              Proceed to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
              style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
