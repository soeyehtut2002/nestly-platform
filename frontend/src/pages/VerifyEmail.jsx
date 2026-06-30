import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';

const VerifyEmail = () => {
  const { showToast } = useApp();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setVerifying(false);
        setErrorMsg('Verification token is missing from the link URL.');
        return;
      }

      try {
        const data = await api.post('/auth/verify-email', { token });
        setSuccess(true);
        showToast(data.message || 'Email verified successfully.', 'success');
      } catch (err) {
        setErrorMsg(err.message || 'Verification failed. The token may be invalid or expired.');
        showToast(err.message || 'Verification failed.', 'error');
      } finally {
        setVerifying(false);
      }
    };

    performVerification();
  }, [token]);

  return (
    <div style={{ maxWidth: '400px', margin: '3rem auto', animation: 'fadeIn 0.4s ease' }}>
      <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Email Verification</h2>

        {verifying ? (
          <div style={{ color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '1.5rem auto', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
            <p>Verifying your email address, please wait...</p>
          </div>
        ) : success ? (
          <div style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#4caf50' }}>✓</div>
            <h3>Verification Successful!</h3>
            <p style={{ marginBottom: '2rem' }}>Your Nestly account is now active and ready.</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '0.8rem', textAlign: 'center' }}>
              Proceed to Login
            </Link>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', color: '#f44336' }}>⚠️</div>
            <h3>Verification Failed</h3>
            <p style={{ marginBottom: '2rem', color: '#ff7961' }}>{errorMsg}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'block', textDecoration: 'none', padding: '0.8rem', textAlign: 'center' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
