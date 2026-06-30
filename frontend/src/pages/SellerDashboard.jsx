import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { PlusCircle, ShoppingBag, Eye, Trash2, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SellerDashboard = () => {
  const { user, fetchProfile, showToast } = useApp();
  const navigate = useNavigate();

  // Application Form States
  const [shopName, setShopName] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  
  // Document Upload States
  const [idCardUrl, setIdCardUrl] = useState('');
  const [proofOfResidencyUrl, setProofOfResidencyUrl] = useState('');
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [uploadingResidency, setUploadingResidency] = useState(false);
  const [idCardProgress, setIdCardProgress] = useState(0);
  const [residencyProgress, setResidencyProgress] = useState(0);

  // Listing Form States
  const [showListingForm, setShowListingForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('marketplace');
  const [imageUrl, setImageUrl] = useState('');
  const [legalAffirmation, setLegalAffirmation] = useState(false);
  const [submittingListing, setSubmittingListing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await api.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });
      setImageUrl(url);
      showToast('Image uploaded successfully to Cloudinary!', 'success');
    } catch (err) {
      showToast(err.message || 'Image upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleIdCardUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIdCard(true);
    setIdCardProgress(0);
    try {
      const url = await api.uploadImage(file, (progress) => {
        setIdCardProgress(progress);
      });
      setIdCardUrl(url);
      showToast('ID card document uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'ID Card upload failed.', 'error');
    } finally {
      setUploadingIdCard(false);
    }
  };

  const handleResidencyUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingResidency(true);
    setResidencyProgress(0);
    try {
      const url = await api.uploadImage(file, (progress) => {
        setResidencyProgress(progress);
      });
      setProofOfResidencyUrl(url);
      showToast('Residency document uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Residency document upload failed.', 'error');
    } finally {
      setUploadingResidency(false);
    }
  };

  // Seller Dashboard States
  const [sellerProfile, setSellerProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchSellerProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await api.get('/sellers/profile');
      setSellerProfile(data);
      setMyListings(data.listings || []);
    } catch (err) {
      console.warn('User does not have a seller profile yet.');
      setSellerProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSellerProfile();
  }, [user]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!shopName) return showToast('Please enter a shop name.', 'error');
    if (!agreementSigned) return showToast('You must agree to the Seller Agreement.', 'error');
    if (!idCardUrl || !proofOfResidencyUrl) {
      return showToast('Please upload both your ID Card and Proof of Residency.', 'error');
    }

    setSubmittingApp(true);
    try {
      await api.post('/sellers/apply', {
        shopName,
        agreementSigned,
        idCardUrl,
        proofOfResidencyUrl
      });
      showToast('Application submitted successfully.', 'success');
      await fetchProfile(); // refresh JWT roles in context
      fetchSellerProfile();
    } catch (err) {
      showToast(err.message || 'Application submission failed.', 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!title || !description || !price) {
      return showToast('Please fill in all listing details.', 'error');
    }
    if (!legalAffirmation) {
      return showToast('You must affirm that you are legally allowed to sell this item under Thai law.', 'error');
    }

    setSubmittingListing(true);
    try {
      const defaultImg = category === 'services'
        ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e'
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';

      await api.post('/listings', {
        title,
        description,
        price: parseFloat(price),
        category,
        legalAffirmation,
        images: [imageUrl.trim() || defaultImg]
      });

      showToast('Listing submitted. It will be live after admin moderation.', 'success');
      setShowListingForm(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setLegalAffirmation(false);
      fetchSellerProfile();
    } catch (err) {
      showToast(err.message || 'Failed to create listing.', 'error');
    } finally {
      setSubmittingListing(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${listingId}`);
      showToast('Listing deleted successfully.', 'success');
      fetchSellerProfile();
    } catch (err) {
      showToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  if (loadingProfile) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading Seller Hub...</div>;
  }

  // CASE 1: No profile, or rejected -> Display Seller/Runner Application Form
  if (!sellerProfile || sellerProfile.verificationStatus === 'REJECTED') {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', animation: 'fadeIn 0.4s ease' }}>
        <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Apply for Seller / Runner Verification</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Verify your residency to unlock the Marketplace and Runner boards.
          </p>

          {sellerProfile?.verificationStatus === 'REJECTED' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--accent-red)',
              padding: '1rem',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <strong>Application Rejected:</strong> Your previous application did not match residency records. Please double check details and re-apply below.
            </div>
          )}

          <form onSubmit={handleApply}>
            <div className="form-group">
              <label className="form-label">Shop / Runner Name</label>
              <input
                type="text"
                className="form-input"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Kanya's Bakery, Runner Somchai"
                required
              />
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Proof of Residency Required</h4>
              <p style={{ marginBottom: '0.5rem' }}>
                To comply with security audits, our team will verify your Room Number matches building lease/utility documentation. (Document uploads are processed securely under PDPA).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID Card / Passport</span>
                  <div className="file-upload-zone" style={{ padding: '1rem', fontSize: '0.75rem', marginTop: '0.25rem', border: '1px dashed var(--border-glass)' }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleIdCardUpload}
                      style={{ display: 'none' }}
                      id="idcard-file"
                    />
                    <label htmlFor="idcard-file" style={{ cursor: 'pointer', display: 'block', fontWeight: 600, color: 'var(--primary)' }}>
                      {idCardUrl ? 'Change File' : 'Upload ID File'}
                    </label>
                    {uploadingIdCard ? (
                      <div className="upload-progress-container">
                        <div className="upload-progress-bar" style={{ width: `${idCardProgress}%` }}></div>
                      </div>
                    ) : idCardUrl ? (
                      <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}>✔ Uploaded</div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proof of Condo Unit (Utility Bill)</span>
                  <div className="file-upload-zone" style={{ padding: '1rem', fontSize: '0.75rem', marginTop: '0.25rem', border: '1px dashed var(--border-glass)' }}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleResidencyUpload}
                      style={{ display: 'none' }}
                      id="residency-file"
                    />
                    <label htmlFor="residency-file" style={{ cursor: 'pointer', display: 'block', fontWeight: 600, color: 'var(--primary)' }}>
                      {proofOfResidencyUrl ? 'Change File' : 'Upload Proof File'}
                    </label>
                    {uploadingResidency ? (
                      <div className="upload-progress-container">
                        <div className="upload-progress-bar" style={{ width: `${residencyProgress}%` }}></div>
                      </div>
                    ) : proofOfResidencyUrl ? (
                      <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}>✔ Uploaded</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Agreement Acceptance Checkbox */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-checkbox-container">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={agreementSigned}
                  onChange={(e) => setAgreementSigned(e.target.checked)}
                  required
                />
                <span>
                  I sign the <strong>Seller Agreement</strong> and solemnly declare: <em>"I am legally allowed to sell these products/services under Thai law."</em> I certify I will not offer prohibited items.
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={submittingApp}>
              {submittingApp ? 'Submitting Application...' : 'Submit Verification Request'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CASE 2: Application is PENDING admin review
  if (sellerProfile.verificationStatus === 'PENDING') {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <Clock size={48} style={{ color: 'var(--primary)', marginBottom: '1.25rem' }} />
          <h2>Application Under Review</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: '1.6' }}>
            Thank you, <strong>{user.fullName}</strong>. Your application for <strong>{sellerProfile.shopName}</strong> is pending administrator check. We are reviewing room match filings and legal agreements.
          </p>
          <div style={{
            marginTop: '2rem',
            padding: '0.75rem',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px dashed rgba(245, 158, 11, 0.2)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            Check back soon. Approvals usually complete within 24 hours.
          </div>
        </div>
      </div>
    );
  }

  // CASE 3: Application is APPROVED -> Display Seller Dashboard listing panel
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Seller Hub: {sellerProfile.shopName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} />
            <span>Active Seller Verification - Room {user.roomNumber}</span>
          </div>
        </div>

        <button onClick={() => setShowListingForm(!showListingForm)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <PlusCircle size={18} />
          {showListingForm ? 'Close Form' : 'Create Listing'}
        </button>
      </div>

      {showListingForm && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Add New Listing / Offer</h3>
          
          <form onSubmit={handleCreateListing}>
            <div className="form-group">
              <label className="form-label">Listing Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Homemade Chocolate Chip Cookies"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Price (฿)</label>
                <input
                  type="number"
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="120"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="food">Food & Drinks</option>
                  <option value="services">Home Services</option>
                  <option value="marketplace">Buy & Sell</option>
                  <option value="runner">Delivery/Runner</option>
                  <option value="announcements">Community Board</option>
                  <option value="lost_and_found">Lost & Found</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Offer Details</label>
              <textarea
                className="form-input form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide recipe details, sizing, repair durations, or contact schedule."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Listing Image (Cloudinary Mock Integration)</label>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-glass)' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  id="listing-image-file"
                />
                <label htmlFor="listing-image-file" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-block', marginBottom: '0.5rem' }}>
                  Select Image File
                </label>
                
                {uploading ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Uploading: {uploadProgress}%</div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--border-glass)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.15s ease' }}></div>
                    </div>
                  </div>
                ) : imageUrl ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>✔ Image uploaded to Cloudinary</div>
                    <img src={imageUrl} alt="Upload preview" style={{ maxWidth: '100px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select an image file to upload.</div>
                )}
              </div>
            </div>

            {/* Legal affirmation checkmark */}
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
                  I certify that: <strong>"I am legally allowed to sell these products/services under Thai law."</strong> I confirm this listing contains no prohibited items.
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={submittingListing}>
              {submittingListing ? 'Submitting Listing...' : 'Submit for Moderation'}
            </button>
          </form>
        </div>
      )}

      {/* Listing management table */}
      <h2>My Listings</h2>
      {myListings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          <ShoppingBag size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3>No listings posted</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Tap the 'Create Listing' button to list your first offer!</p>
        </div>
      ) : (
        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'var(--surface-glass)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-glass)'
          }}>
            <thead>
              <tr style={{ background: 'rgba(17, 24, 39, 0.4)', textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem' }}>Listing</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Price</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myListings.map((list) => (
                <tr key={list.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{list.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {list.id}</div>
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{list.category}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>฿{Number(list.price).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${list.status.toLowerCase()}`}>
                      {list.status === 'PENDING_APPROVAL' ? 'Pending Approval' : list.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {list.status === 'ACTIVE' && (
                        <Link to={`/listings/${list.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                          <Eye size={12} />
                        </Link>
                      )}
                      <button onClick={() => handleDeleteListing(list.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-red)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
