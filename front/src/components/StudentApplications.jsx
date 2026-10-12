import { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../services/api';

export default function StudentApplications({ onExploreJobs }) {
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'interviews'
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await studentApi.getApplicationStats();
      if (data) {
        setStats({
          total: Number(data.total) || 0,
          applied: Number(data.applied) || 0,
          shortlisted: Number(data.shortlisted) || 0,
          hired: Number(data.hired) || 0,
          rejected: Number(data.rejected) || 0,
        });
      }
    } catch (err) {
      console.warn('Failed to load application stats from server:', err);
    }
  }, []);

  const fetchApplications = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError('');

    try {
      const data = await studentApi.getMyApplications(targetPage, 10);
      setApplications(data.content || []);
      setPage(data.number || 0);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load your applications.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentApi.getInterviews(0, 50);
      setInterviews(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load your scheduled interviews.');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'applications') {
      await Promise.all([fetchApplications(page), fetchStats()]);
    } else {
      await fetchInterviews();
    }
    setRefreshing(false);
  }, [fetchApplications, fetchStats, fetchInterviews, page, activeTab]);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications(0);
      fetchStats();
    } else if (activeTab === 'interviews') {
      fetchInterviews();
    }
  }, [activeTab, fetchApplications, fetchStats, fetchInterviews]);

  const handleWithdraw = async (id, jobTitle) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for "${jobTitle}"?`)) {
      return;
    }

    setWithdrawingId(id);
    setActionSuccess('');
    setError('');

    try {
      await studentApi.withdrawApplication(id);
      setActionSuccess(`Application for "${jobTitle}" withdrawn successfully.`);
      fetchApplications(page);
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'APPLIED').toUpperCase();
    const classMap = {
      APPLIED: 'badge-applied',
      SHORTLISTED: 'badge-shortlisted',
      HIRED: 'badge-hired',
      REJECTED: 'badge-rejected',
    };
    return <span className={`badge ${classMap[s] || 'badge-applied'}`}>{s}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="section-container">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="section-header">
        <div>
          <h2>Student Career Center</h2>
          <p>Track your real-time job applications, review statuses, and scheduled interviews</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="nav-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              My Applications ({stats.total})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('interviews')}
            >
              Scheduled Interviews ({interviews.length})
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={refreshAll}
            disabled={loading || refreshing}
            title="Refresh career data"
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onExploreJobs}>
            Explore Jobs &rarr;
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon">✓</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: APPLICATIONS ───────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <>
          {/* 1. Application Statistics Summary Cards */}
          <div className="student-stats-grid">
            <div className="student-stat-card stat-total">
              <div className="stat-icon-wrapper">📋</div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Jobs Applied</div>
              <div className="stat-subtext">Across all companies</div>
            </div>

            <div className="student-stat-card stat-applied">
              <div className="stat-icon-wrapper">⏳</div>
              <div className="stat-number">{stats.applied}</div>
              <div className="stat-label">Awaiting Review</div>
              <div className="stat-subtext">Submitted & pending</div>
            </div>

            <div className="student-stat-card stat-shortlisted">
              <div className="stat-icon-wrapper">⭐</div>
              <div className="stat-number">{stats.shortlisted}</div>
              <div className="stat-label">Shortlisted</div>
              <div className="stat-subtext">Interview stage</div>
            </div>

            <div className="student-stat-card stat-hired">
              <div className="stat-icon-wrapper">🎉</div>
              <div className="stat-number">{stats.hired}</div>
              <div className="stat-label">Hired</div>
              <div className="stat-subtext">Offers accepted</div>
            </div>

            <div className="student-stat-card stat-rejected">
              <div className="stat-icon-wrapper">✕</div>
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
              <div className="stat-subtext">Not selected</div>
            </div>
          </div>

          {/* 2. Application Progress Listings */}
          {loading && !refreshing && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading your applications...</p>
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Applications Submitted Yet</h3>
              <p>You haven't applied for any positions yet. Explore open job opportunities and start applying today!</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onExploreJobs}
                style={{ marginTop: '1.25rem' }}
              >
                Browse Open Jobs
              </button>
            </div>
          )}

          {!loading && applications.length > 0 && (
            <div className="applications-progress-list">
              {applications.map((app) => {
                const isApplied = true;
                const isShortlisted = app.status === 'SHORTLISTED' || app.status === 'HIRED';
                const isHired = app.status === 'HIRED';
                const isRejected = app.status === 'REJECTED';

                return (
                  <div className={`application-progress-card ${isRejected ? 'card-rejected' : isHired ? 'card-hired' : ''}`} key={app.id}>
                    {/* Header Row */}
                    <div className="app-card-header">
                      <div className="app-card-title-group">
                        <h3 className="app-card-title">{app.jobTitle}</h3>
                        <div className="app-card-company-bar">
                          <span className="app-card-company">🏢 {app.companyName || 'Employer Partner'}</span>
                          {app.jobLocation && (
                            <span className="app-card-location">📍 {app.jobLocation}</span>
                          )}
                        </div>
                      </div>

                      <div className="app-card-header-right">
                        {getStatusBadge(app.status)}
                        <span className="app-card-date">Submitted on {formatDate(app.appliedAt)}</span>
                      </div>
                    </div>

                    {/* Progress Tracker Section */}
                    <div className="app-card-progress-section">
                      {isRejected ? (
                        <div className="rejection-notice-box">
                          <div className="rejection-icon">✕</div>
                          <div className="rejection-text-content">
                            <span className="rejection-title">Application Status: Not Selected</span>
                            <span className="rejection-desc">
                              The company has decided not to move forward with this application. Don't be discouraged — continue exploring matching roles!
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="progress-timeline-wrapper">
                          <div className="progress-timeline-track">
                            {/* Step 1: Applied */}
                            <div className={`timeline-step ${isApplied ? 'step-completed' : ''}`}>
                              <div className="timeline-node">
                                <span className="node-icon">✓</span>
                              </div>
                              <div className="timeline-label-group">
                                <span className="node-title">Applied</span>
                                <span className="node-sub">Application received</span>
                              </div>
                            </div>

                            <div className={`timeline-connector ${isShortlisted ? 'connector-active' : ''}`}></div>

                            {/* Step 2: Shortlisted */}
                            <div className={`timeline-step ${isShortlisted ? 'step-completed' : 'step-pending'}`}>
                              <div className="timeline-node">
                                <span className="node-icon">{isShortlisted ? '✓' : '2'}</span>
                              </div>
                              <div className="timeline-label-group">
                                <span className="node-title">Shortlisted</span>
                                <span className="node-sub">Profile under review</span>
                              </div>
                            </div>

                            <div className={`timeline-connector ${isHired ? 'connector-active' : ''}`}></div>

                            {/* Step 3: Hired */}
                            <div className={`timeline-step ${isHired ? 'step-completed' : 'step-pending'}`}>
                              <div className="timeline-node">
                                <span className="node-icon">{isHired ? '✓' : '3'}</span>
                              </div>
                              <div className="timeline-label-group">
                                <span className="node-title">Hired</span>
                                <span className="node-sub">Offer accepted</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Note & Actions */}
                    <div className="app-card-footer">
                      <div className="app-card-note">
                        {app.coverLetter ? (
                          <div>
                            <span className="note-label">Cover Note:</span>
                            <span className="note-text">"{app.coverLetter}"</span>
                          </div>
                        ) : (
                          <span className="note-muted">No additional cover note provided</span>
                        )}
                      </div>

                      <div className="app-card-actions">
                        {app.status === 'APPLIED' && (
                          <button
                            type="button"
                            className="btn-danger-outline btn-sm"
                            onClick={() => handleWithdraw(app.id, app.jobTitle)}
                            disabled={withdrawingId === app.id}
                          >
                            {withdrawingId === app.id ? 'Withdrawing...' : 'Withdraw Application'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <nav className="pagination-bar" aria-label="Applications pagination" style={{ marginTop: '2rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn"
                    onClick={() => fetchApplications(page - 1)}
                    disabled={page === 0}
                  >
                    &larr; Previous
                  </button>
                  <span className="page-indicator">
                    Page {page + 1} of {totalPages} ({totalElements} applications)
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn"
                    onClick={() => fetchApplications(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next &rarr;
                  </button>
                </nav>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: SCHEDULED INTERVIEWS ───────────────────────────────────── */}
      {activeTab === 'interviews' && (
        <div className="student-interviews-container">
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading scheduled interviews...</p>
            </div>
          )}

          {!loading && interviews.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🗓️</div>
              <h3>No Scheduled Interviews</h3>
              <p>When employers shortlist your applications and schedule interview rounds, you will see all session details here.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('applications')}
                style={{ marginTop: '1rem' }}
              >
                View My Applications
              </button>
            </div>
          )}

          {!loading && interviews.length > 0 && (
            <div className="interviews-grid">
              {interviews.map((iv) => {
                const isCancelled = iv.status === 'CANCELLED';
                const isCompleted = iv.status === 'COMPLETED';
                const isUpcoming = iv.status === 'SCHEDULED';

                return (
                  <div
                    key={iv.id}
                    className={`interview-card ${isCancelled ? 'interview-cancelled' : isCompleted ? 'interview-completed' : 'interview-upcoming'}`}
                  >
                    <div className="interview-card-header">
                      <div>
                        <span className="interview-company-name">🏢 {iv.companyName}</span>
                        <h3 className="interview-job-title">{iv.jobTitle}</h3>
                      </div>
                      <span
                        className={`badge ${
                          isUpcoming ? 'badge-applied' : isCompleted ? 'badge-hired' : 'badge-rejected'
                        }`}
                      >
                        {iv.status}
                      </span>
                    </div>

                    <div className="interview-meta-details">
                      <div className="interview-detail-item">
                        <span className="detail-icon">📅</span>
                        <div>
                          <strong>Date & Time</strong>
                          <p>{formatDateTime(iv.scheduledAt)}</p>
                        </div>
                      </div>

                      <div className="interview-detail-item">
                        <span className="detail-icon">💻</span>
                        <div>
                          <strong>Interview Mode</strong>
                          <p>{iv.mode}</p>
                        </div>
                      </div>
                    </div>

                    {(iv.locationOrLink || iv.meetingLink) && (
                      <div className="interview-link-box">
                        <span className="link-label">Meeting Location / URL:</span>
                        {(iv.locationOrLink || iv.meetingLink).startsWith('http') ? (
                          <a
                            href={iv.locationOrLink || iv.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm join-btn"
                          >
                            🚀 Join Meeting Online
                          </a>
                        ) : (
                          <p className="location-text">📍 {iv.locationOrLink || iv.meetingLink}</p>
                        )}
                      </div>
                    )}

                    {iv.notes && (
                      <div className="interview-notes-box">
                        <span className="notes-heading">Instructions from Employer:</span>
                        <p className="notes-content">{iv.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
