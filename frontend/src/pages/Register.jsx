import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';

const Register = () => {
  const { condos, activeCondoId, selectCondo, login, showToast } = useApp();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCondo, setSelectedCondo] = useState(activeCondoId);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCondo) {
      return showToast('Please select your condominium building.', 'error');
    }

    if (!fullName || !email || !password || !roomNumber) {
      return showToast('Please fill in all required fields.', 'error');
    }

    if (password.length < 8) {
      return showToast('Password must be at least 8 characters long.', 'error');
    }

    if (!pdpaConsent) {
      return showToast('You must consent to the PDPA terms to register.', 'error');
    }

    setLoading(true);
    // Explicitly update tenant context before request
    selectCondo(selectedCondo);

    try {
      const data = await api.post('/auth/register', {
        fullName,
        email,
        password,
        roomNumber,
        phoneNumber,
        pdpaConsent
      });

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', animation: 'fadeIn 0.4s ease' }}>
      <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Join Nestly</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          Connect securely with verified neighbors in your building.
        </p>

        <form onSubmit={handleSubmit}>
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
                  🏢 {c.name} ({c.province})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Somchai Saetang"
              required
            />
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

          <div className="form-group">
            <label className="form-label">Password (Min. 8 characters)</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-input"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 402/89"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                type="tel"
                className="form-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0812345678"
              />
            </div>
          </div>

          {/* PDPA consent */}
          <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
            <label className="form-checkbox-container">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={pdpaConsent}
                onChange={(e) => setPdpaConsent(e.target.checked)}
                required
              />
              <span>
                I consent to Nestly collecting, processing, and validating my room number for building safety purposes in compliance with the <Link to="/legal/privacy" style={{ color: 'var(--primary)', textDecoration: 'underline' }} target="_blank">PDPA Thailand terms</Link>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
            style={{ width: '100%', padding: '0.8rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
