import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { Truck, PlusCircle, AlertCircle, ShoppingBag, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RunnerBoard = () => {
  const [errands, setErrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [legalAffirmation, setLegalAffirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user, showToast } = useApp();
  const navigate = useNavigate();

  const fetchErrands = async () => {
    setLoading(true);
    try {
      // Runner jobs are listings under 'runner' category
      const data = await api.get('/listings?category=runner');
      setErrands(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch errand board.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrands();
  }, []);

  const handleCreateErrand = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Please log in to request a runner.', 'error');
      navigate('/login');
      return;
    }

    // Verify if user is an approved seller/runner. In our platform, request posting requires a standard account,
    // but the runner job is open. Wait, since it is a listing, we create it in listings table.
    // However, the rule was "Only verified sellers can create listings."
    // Wait, to allow residents to request runners, can we make residents able to create 'runner' listings,
    // or does the seller account handle runner profiles?
    // In our implementation plan:
    // "Only verified sellers can create listings."
    // Let's see: if residents can request, they might need verified status too, OR we can allow standard residents to post runner requests.
    // In our backend controller `listingController.js`:
    // `const seller = await prisma.seller.findUnique({ where: { userId } }); if (!seller || seller.verificationStatus !== 'APPROVED') { return res.status(403).json({ error: 'Only verified sellers can create listings.' }); }`
    // Ah! To make it work, the user needs to apply for a seller profile.
    // Let's tell the user they need a verified resident seller profile to post a job on the board, OR we can handle it nicely in the UI.
    // Actually, in a condominium ecosystem, verified residents (approved sellers) post services, and runners apply to do errands.
    // Let's check: if they have role `SELLER`, they can post. If not, they can apply. Let's make this clear.
    
    if (user.role !== 'SELLER' && user.role !== 'SYSTEM_ADMIN' && user.role !== 'CONDO_ADMIN') {
      return showToast('Please register/verify your Seller/Runner profile in the Seller Panel to post requests.', 'error');
    }

    if (!legalAffirmation) {
      return showToast('You must certify your request is legal under Thai law.', 'error');
    }

    setSubmitting(true);
    try {
      await api.post('/listings', {
        title,
        description,
        price,
        category: 'runner',
        legalAffirmation,
        images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d'] // mock runner box image
      });
      showToast('Errand post submitted successfully. It will be live after admin moderation.', 'success');
      setShowForm(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setLegalAffirmation(false);
      fetchErrands();
    } catch (err) {
      showToast(err.message || 'Failed to post errand.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactPoster = async (errand) => {
    if (!user) {
      showToast('Please log in to accept jobs.', 'error');
      navigate('/login');
      return;
    }
    try {
      await api.post('/chats/start', { sellerId: errand.seller.user.id });
      navigate('/chat');
    } catch (err) {
      showToast(err.message || 'Could not start chat.', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Delivery Runner Board</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Get packages collected or convenience store items bought by neighbor runners.</p>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <PlusCircle size={18} />
          {showForm ? 'View Active Erranas' : 'Request a Runner'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Post Errand Request</h3>
          
          <form onSubmit={handleCreateErrand}>
            <div className="form-group">
              <label className="form-label">Task Summary (e.g., "7-11 errand: milk and bread")</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Buy grocery items, collect juristic office mail"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Errand details (items, floor room instructions)</label>
              <textarea
                className="form-input form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="List items, specify brand preferences, and write down room delivery details."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tip/Runner Fee (฿)</label>
              <input
                type="number"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="40"
                required
              />
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <label className="form-checkbox-container">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={legalAffirmation}
                  onChange={(e) => setLegalAffirmation(e.target.checked)}
                  required
                />
                <span>
                  I certify that this delivery errand does not involve any illegal goods (alcohol/drugs/weapons) under Thai laws.
                </span>
              </label>
            </div>

            {user && user.role !== 'SELLER' && user.role !== 'SYSTEM_ADMIN' && user.role !== 'CONDO_ADMIN' && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--accent-red)',
                marginBottom: '1rem'
              }}>
                Please note: You need to complete verification in the <strong>Apply to Sell</strong> dashboard before posting errand listings.
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Post Request'}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Active board cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading board...</div>
          ) : errands.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <Truck size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>No errand requests active</h3>
              <p style={{ marginTop: '0.5rem' }}>Need something? Tap 'Request a Runner' to ask your neighbors for help!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {errands.map((errand) => (
                <div key={errand.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Posted: {new Date(errand.createdAt).toLocaleDateString()}
                    </span>
                    <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>Active Errand</span>
                  </div>

                  <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>{errand.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1 }}>
                    {errand.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <MapPin size={12} />
                    <span>Regent Home - Room {errand.seller?.user?.roomNumber}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-glass)',
                    paddingTop: '0.75rem',
                    marginTop: 'auto'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offered Tip</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
                        ฿{Number(errand.price).toLocaleString()}
                      </div>
                    </div>

                    <button onClick={() => handleContactPoster(errand)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      Accept & Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RunnerBoard;
