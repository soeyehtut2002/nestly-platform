import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../contexts/AppContext';
import { Shield, Users, ShoppingBag, ShieldAlert, FileText, Check, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, showToast } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('sellers');
  const [loading, setLoading] = useState(true);

  // Queues data states
  const [pendingSellers, setPendingSellers] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modal / Inputs state for actions
  const [actionReason, setActionReason] = useState('');

  const fetchTabDetails = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sellers') {
        const data = await api.get('/admin/sellers/pending');
        setPendingSellers(data);
      } else if (activeTab === 'listings') {
        const data = await api.get('/admin/listings/pending');
        setPendingListings(data);
      } else if (activeTab === 'reports') {
        const data = await api.get('/admin/reports');
        setReports(data);
      } else if (activeTab === 'logs') {
        const data = await api.get('/admin/audit-logs');
        setAuditLogs(data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch admin queue details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'SYSTEM_ADMIN' && user.role !== 'CONDO_ADMIN')) {
      showToast('Access denied: Administrator role required.', 'error');
      navigate('/');
      return;
    }
    fetchTabDetails();
  }, [activeTab]);

  const handleVerifySeller = async (sellerId, approve) => {
    const status = approve ? 'APPROVED' : 'REJECTED';
    const reason = actionReason || (approve ? 'Room verification matches occupancy records.' : 'Room occupant verification failed.');
    
    try {
      await api.put(`/admin/sellers/${sellerId}/verify`, { status, reason });
      showToast(`Seller application ${status.toLowerCase()} successfully.`, 'success');
      setActionReason('');
      fetchTabDetails();
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    }
  };

  const handleModerateListing = async (listingId, approve) => {
    const status = approve ? 'ACTIVE' : 'REJECTED';
    const reason = actionReason || (approve ? 'Listing contents comply with guidelines.' : 'Inappropriate category or prohibited items.');

    try {
      await api.put(`/admin/listings/${listingId}/moderate`, { status, reason });
      showToast(`Listing ${approve ? 'approved and published' : 'rejected'}.`, 'success');
      setActionReason('');
      fetchTabDetails();
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    const status = action === 'dismiss' ? 'DISMISSED' : 'RESOLVED';
    const notes = actionReason || 'Report processed by administrator.';

    try {
      await api.put(`/admin/reports/${reportId}/resolve`, { status, notes });
      showToast(`Report updated to ${status.toLowerCase()}.`, 'success');
      setActionReason('');
      fetchTabDetails();
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    }
  };

  const handleSuspendUser = async (userId, suspend) => {
    const reason = actionReason || 'Violated community policies / repeated report complaints.';
    try {
      await api.put(`/admin/users/${userId}/suspend`, { suspend, reason });
      showToast(`User account ${suspend ? 'suspended' : 'unsuspended'} successfully.`, 'success');
      setActionReason('');
      fetchTabDetails();
    } catch (err) {
      showToast(err.message || 'Suspension toggle failed.', 'error');
    }
  };

  if (!user || (user.role !== 'SYSTEM_ADMIN' && user.role !== 'CONDO_ADMIN')) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Access Denied.</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Shield size={32} style={{ color: 'var(--secondary)' }} />
        <div>
          <h1>Administrator Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage seller verifications, listing moderation queues, and abuse logs.</p>
        </div>
      </div>

      {/* Admin navigation tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('sellers')}
          className={`btn ${activeTab === 'sellers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <Users size={16} />
          Pending Sellers ({activeTab === 'sellers' && !loading ? pendingSellers.length : '*'})
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <ShoppingBag size={16} />
          Listing Queue ({activeTab === 'listings' && !loading ? pendingListings.length : '*'})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <ShieldAlert size={16} />
          Abuse Reports ({activeTab === 'reports' && !loading ? reports.filter(r => r.status === 'OPEN').length : '*'})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <FileText size={16} />
          System Audit Logs
        </button>
      </div>

      {/* Action Reason input box */}
      {(activeTab === 'sellers' || activeTab === 'listings' || activeTab === 'reports') && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'rgba(245,158,11,0.02)' }}>
          <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={12} style={{ color: 'var(--primary)' }} />
            Action Notes / Reason (Appended to Audit log and notifications)
          </label>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', padding: '0.5rem 0.75rem', marginTop: '0.25rem', fontSize: '0.85rem' }}
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Type reason here before clicking Approve/Reject/Suspend..."
          />
        </div>
      )}

      {/* Tab Contents */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading panel files...</div>
      ) : (
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          
          {/* TAB 1: Pending Sellers */}
          {activeTab === 'sellers' && (
            <>
              <h3>Pending Seller Registrations</h3>
              {pendingSellers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>No pending seller applications.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>User Info</th>
                      <th style={{ padding: '0.75rem' }}>Shop / Runner Name</th>
                      <th style={{ padding: '0.75rem' }}>Filing Proofs</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSellers.map(seller => (
                      <tr key={seller.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{seller.user.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{seller.user.email} | Room {seller.user.roomNumber}</div>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{seller.shopName}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <div>Thai ID / Passport: <span style={{ color: 'var(--secondary)' }}>Uploaded</span></div>
                          <div>Room utility lease: <span style={{ color: 'var(--secondary)' }}>Uploaded</span></div>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleVerifySeller(seller.id, true)} className="btn btn-secondary" style={{ color: 'var(--secondary)', padding: '0.35rem' }} title="Approve">
                              <Check size={16} />
                            </button>
                            <button onClick={() => handleVerifySeller(seller.id, false)} className="btn btn-secondary" style={{ color: 'var(--accent-red)', padding: '0.35rem' }} title="Reject">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* TAB 2: Pending Listings */}
          {activeTab === 'listings' && (
            <>
              <h3>Listing Moderation Queue</h3>
              {pendingListings.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>No listings awaiting moderation.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Details</th>
                      <th style={{ padding: '0.75rem' }}>Seller Shop</th>
                      <th style={{ padding: '0.75rem' }}>Price</th>
                      <th style={{ padding: '0.75rem' }}>Category</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingListings.map(list => (
                      <tr key={list.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{list.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{list.description}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div>{list.seller.shopName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room {list.seller.user.roomNumber}</div>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>฿{Number(list.price).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{list.category}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleModerateListing(list.id, true)} className="btn btn-secondary" style={{ color: 'var(--secondary)', padding: '0.35rem' }} title="Approve Listing">
                              <Check size={16} />
                            </button>
                            <button onClick={() => handleModerateListing(list.id, false)} className="btn btn-secondary" style={{ color: 'var(--accent-red)', padding: '0.35rem' }} title="Reject Listing">
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* TAB 3: Abuse Reports */}
          {activeTab === 'reports' && (
            <>
              <h3>Abuse Complaints</h3>
              {reports.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>No reports logged.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Target</th>
                      <th style={{ padding: '0.75rem' }}>Complainant</th>
                      <th style={{ padding: '0.75rem' }}>Reason</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem' }}>
                          {report.reportedListing ? (
                            <div>
                              <span>Listing: </span><strong>{report.reportedListing.title}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> (ID: {report.reportedListing.id}, Status: {report.reportedListing.status})</span>
                            </div>
                          ) : (
                            <div>
                              <span>User: </span><strong>{report.reportedUser?.fullName}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> ({report.reportedUser?.email})</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{report.reporter?.fullName || 'Deleted user'}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{report.reason}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`badge badge-${report.status.toLowerCase()}`}>{report.status}</span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          {report.status === 'OPEN' ? (
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {report.reportedUser && (
                                <button onClick={() => handleSuspendUser(report.reportedUserId, !report.reportedUser.isSuspended)} className="btn btn-secondary" style={{ padding: '0.35rem', color: 'var(--primary)', fontSize: '0.75rem' }}>
                                  {report.reportedUser.isSuspended ? 'Unsuspend' : 'Suspend User'}
                                </button>
                              )}
                              <button onClick={() => handleResolveReport(report.id, 'resolve')} className="btn btn-secondary" style={{ color: 'var(--secondary)', padding: '0.35rem' }} title="Resolve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => handleResolveReport(report.id, 'dismiss')} className="btn btn-secondary" style={{ color: 'var(--text-muted)', padding: '0.35rem' }} title="Dismiss">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* TAB 4: System Audit Logs */}
          {activeTab === 'logs' && (
            <>
              <h3>Immutable Security Audit Logs</h3>
              {auditLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>No audit actions logged.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem' }}>Admin User</th>
                      <th style={{ padding: '0.75rem' }}>Action Type</th>
                      <th style={{ padding: '0.75rem' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{log.admin?.fullName || 'System'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{log.actionType}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
