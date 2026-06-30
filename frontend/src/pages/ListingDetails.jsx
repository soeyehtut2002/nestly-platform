import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { api } from '../services/api';
import { ShieldAlert, MessageSquare, AlertTriangle, Star, CheckCircle, ArrowLeft, Heart } from 'lucide-react';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useApp();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/listings/${id}`);
      setListing(data);
      if (user) {
        const favs = await api.get('/listings/favorites');
        setIsFavorited(favs.some(f => f.id === id));
      }
    } catch (err) {
      showToast(err.message || 'Failed to retrieve listing details.', 'error');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('Please log in to favorite listings.', 'error');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/listings/${id}/favorite`, {});
      setIsFavorited(res.favorited);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update favorite status.', 'error');
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      showToast('Please log in to chat with the seller.', 'error');
      navigate('/login');
      return;
    }

    try {
      const chat = await api.post('/chats/start', { sellerId: listing.seller.user.id });
      navigate('/chat');
    } catch (err) {
      showToast(err.message || 'Could not start conversation.', 'error');
    }
  };

  const handleReportAbuse = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to report listings.', 'error');
      return;
    }

    if (!reportReason) {
      return showToast('Please select or specify a reason.', 'error');
    }

    setSubmittingReport(true);
    try {
      await api.post('/admin/report', {
        reportedListingId: listing.id,
        reason: reportReason
      });
      showToast('Listing reported successfully. Admins will review it shortly.', 'success');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err) {
      showToast(err.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to submit a review.', 'error');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        sellerId: listing.seller.id,
        rating: reviewRating,
        reviewText: reviewText
      });
      showToast('Review submitted successfully!', 'success');
      setReviewText('');
      setReviewRating(5);
      fetchListing(); // Refresh to update average rating and list
    } catch (err) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading details...</div>;
  }

  if (!listing) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Listing not found.</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Back button */}
      <Link to="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
        <ArrowLeft size={16} />
        Back to Marketplace
      </Link>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        alignItems: 'start'
      }}>
        {/* Images & Reporting Panel */}
        <div>
          <div className="glass-panel" style={{ overflow: 'hidden', height: '350px', marginBottom: '1rem' }}>
            <img
              src={listing.images && listing.images[0] ? listing.images[0] : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <button onClick={() => setReportModalOpen(true)} className="btn btn-secondary" style={{ width: '100%', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.25)', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            Report Abuse / Illegal Content
          </button>
        </div>

        {/* Core Product Information */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="badge badge-active">{listing.category}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-amber)' }}>
              <Star size={16} fill="var(--text-amber)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {listing.seller?.reviews?.length > 0
                  ? (listing.seller.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.seller.reviews.length).toFixed(1)
                  : 'N/A'
                }
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({listing.seller?.reviews?.length} reviews)
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#fff' }}>{listing.title}</h2>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem' }}>
            ฿{Number(listing.price).toLocaleString()}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
            {listing.description}
          </p>

          {/* Legal disclaimer regarding transaction ownership */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem'
          }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', marginBottom: '0.4rem' }}>
              <AlertTriangle size={14} />
              Intermediary Platform Disclaimer
            </h4>
            <p>
              This listing is posted by an independent resident. Nestly is not the seller and is not responsible for payment processing, product delivery, or item disputes. Arrange cash/PromptPay and pickup directly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleContactSeller} className="btn btn-primary" style={{ flex: 1, padding: '0.8rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} />
              Chat with Seller
            </button>
            <button onClick={handleToggleFavorite} className="btn btn-secondary" style={{ padding: '0.8rem', width: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }} title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}>
              <Heart size={20} fill={isFavorited ? 'var(--accent-red)' : 'none'} color={isFavorited ? 'var(--accent-red)' : 'currentColor'} />
            </button>
          </div>
        </div>
      </div>

      {/* Seller & Verification Details & Reviews Section */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>About the Seller</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Shop Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--primary)' }}>{listing.seller?.shopName}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              <div>Resident Owner: <strong>{listing.seller?.user?.fullName}</strong></div>
              <div>Room: <strong>{listing.seller?.user?.roomNumber}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '0.5rem' }}>
                <CheckCircle size={16} />
                <span>Verified Resident Seller</span>
              </div>
            </div>
          </div>

          {/* Reviews Card */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3>Customer Reviews</h3>
            
            {listing.seller?.reviews?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                No reviews yet. Transactions occur directly between neighbors.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                {listing.seller?.reviews?.map((r) => (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.reviewer?.fullName || 'Anonymous Resident'}</span>
                      <div style={{ display: 'flex', gap: '0.1rem', color: 'var(--text-amber)' }}>
                        {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="var(--text-amber)" />)}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.reviewText}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Write a Review Form */}
            {user && listing.seller && user.id !== listing.seller.user.id && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.25rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: '#fff' }}>Write a Review</h4>
                <form onSubmit={handleSubmitReview}>
                  <div className="star-rating-input" style={{ color: 'var(--text-amber)' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={22}
                        className="star-icon"
                        fill={star <= reviewRating ? 'var(--text-amber)' : 'none'}
                        color="var(--text-amber)"
                        onClick={() => setReviewRating(star)}
                      />
                    ))}
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <textarea
                      className="form-input"
                      style={{ 
                        width: '100%', 
                        height: '80px', 
                        borderRadius: 'var(--radius-sm)', 
                        padding: '0.5rem', 
                        background: 'var(--bg-primary)', 
                        border: '1px solid rgba(0,0,0,0.08)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem'
                      }}
                      placeholder="Write your experience with this neighbor..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      maxLength={500}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }} disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Abuse Report Modal Popup */}
      {reportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-red)' }}>Report Listing</h3>
            
            <form onSubmit={handleReportAbuse}>
              <div className="form-group">
                <label className="form-label">Reason for reporting</label>
                <select
                  className="form-input"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                >
                  <option value="">-- Select Reason --</option>
                  <option value="Illegal products/services under Thai law">Illegal products/services under Thai law</option>
                  <option value="Copyright infringement / Counterfeit">Copyright infringement / Counterfeit</option>
                  <option value="Weapons or Drugs">Weapons or Drugs</option>
                  <option value="Adult content / Gambling">Adult content / Gambling</option>
                  <option value="Fraudulent seller / Scam listing">Fraudulent seller / Scam listing</option>
                  <option value="Not a condo resident / Off-site seller">Not a condo resident / Off-site seller</option>
                  <option value="Other / Rules violation">Other / Rules violation</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReportModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={submittingReport}>
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
