import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'users' | 'jobs'
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pagination for users & jobs
  const [userPage, setUserPage] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [jobPage, setJobPage] = useState(0);
  const [jobTotalPages, setJobTotalPages] = useState(0);

  // Status updating
  const [actionPendingId, setActionPendingId] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers(targetPage, 15);
      setUsers(data.content || []);
      setUserPage(data.number || 0);
      setUserTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load platform users.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAllJobs(targetPage, 15);
      setJobs(data.content || []);
      setJobPage(data.number || 0);
      setJobTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load platform jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'metrics') {
      fetchMetrics();
    } else if (activeTab === 'users') {
      fetchUsers(0);
    } else if (activeTab === 'jobs') {
      fetchJobs(0);
    }
  }, [activeTab, fetchMetrics, fetchUsers, fetchJobs]);

  const handleToggleUserActive = async (user) => {
    setActionPendingId(user.id);
    setError('');
    setSuccessMsg('');
    try {
      if (user.active) {
        await adminApi.deactivateUser(user.id);
        setSuccessMsg(`Account for "${user.name}" (${user.email}) has been deactivated.`);
      } else {
        await adminApi.activateUser(user.id);
        setSuccessMsg(`Account for "${user.name}" (${user.email}) has been activated.`);
      }
      fetchUsers(userPage);
    } catch (err) {
      setError(err.message || 'Failed to toggle user activation status.');
    } finally {
      setActionPendingId(null);
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to permanently remove job "#${job.id} - ${job.title}"?`)) {
      return;
    }
    setActionPendingId(job.id);
    setError('');
    setSuccessMsg('');
    try {
      await adminApi.deleteJob(job.id);
      setSuccessMsg(`Job "#${job.id} - ${job.title}" was removed by admin.`);
      fetchJobs(jobPage);
    } catch (err) {
      setError(err.message || 'Failed to remove job.');
    } finally {
      setActionPendingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h2>Platform Administration</h2>
          <p>Supervise platform metrics, user accounts, and moderated job postings</p>
        </div>

        <div className="nav-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            📊 System Metrics
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            🛡️ Job Moderation
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" role="status">
          <span className="alert-icon">✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: System Metrics ────────────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <>
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Gathering platform metrics...</p>
            </div>
          )}

          {!loading && metrics && (
            <div className="metrics-dashboard">
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">👥</div>
                  <div className="metric-value">{metrics.totalUsers}</div>
                  <div className="metric-label">Total Users</div>
                  <div className="metric-subtext">
                    {metrics.activeUsers} active ({metrics.totalStudents} students, {metrics.totalCompanies} employers)
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">💼</div>
                  <div className="metric-value">{metrics.totalJobs}</div>
                  <div className="metric-label">Total Job Postings</div>
                  <div className="metric-subtext">
                    {metrics.openJobs} currently open &bull; {metrics.closedJobs} closed
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">📄</div>
                  <div className="metric-value">{metrics.totalApplications}</div>
                  <div className="metric-label">Job Applications</div>
                  <div className="metric-subtext">
                    {metrics.pendingApplications} in review status
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ maxWidth: '100%', marginTop: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-h)' }}>Platform Health & Summary</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Active Ratio</span>
                    <span className="detail-value">
                      {metrics.totalUsers > 0
                        ? `${Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}% active accounts`
                        : '100%'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Open Opportunities</span>
                    <span className="detail-value">
                      {metrics.openJobs} active listings
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Student / Employer Ratio</span>
                    <span className="detail-value">
                      {metrics.totalCompanies > 0
                        ? `${(metrics.totalStudents / metrics.totalCompanies).toFixed(1)} students per employer`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: User Management ───────────────────────────────────────── */}
      {activeTab === 'users' && (
        <>
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading registered accounts...</p>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="empty-state">
              <p>No registered users found.</p>
            </div>
          )}

          {!loading && users.length > 0 && (
            <>
              <div className="applications-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name & Email</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Registered On</th>
                      <th>Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><strong>#{u.id}</strong></td>
                        <td>
                          <div className="table-job-info">
                            <strong>{u.name}</strong>
                            <span className="table-subtext">✉️ {u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'ROLE_STUDENT'
                                ? 'badge-student'
                                : u.role === 'ROLE_COMPANY'
                                ? 'badge-company'
                                : 'badge-admin'
                            }`}
                          >
                            {u.role ? u.role.replace('ROLE_', '') : 'USER'}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge">
                            <span
                              className="status-dot"
                              style={{ background: u.active ? '#22c55e' : '#ef4444' }}
                            ></span>
                            {u.active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          {u.role !== 'ROLE_ADMIN' ? (
                            <button
                              type="button"
                              className={u.active ? 'btn-danger-outline' : 'btn btn-secondary btn-sm'}
                              onClick={() => handleToggleUserActive(u)}
                              disabled={actionPendingId === u.id}
                            >
                              {actionPendingId === u.id
                                ? 'Processing...'
                                : u.active
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                          ) : (
                            <span className="table-subtext">Protected Admin</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {userTotalPages > 1 && (
                <nav className="pagination-bar" aria-label="Users pagination">
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn"
                    onClick={() => fetchUsers(userPage - 1)}
                    disabled={userPage === 0}
                  >
                    &larr; Previous
                  </button>
                  <span className="page-indicator">
                    Page {userPage + 1} of {userTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn"
                    onClick={() => fetchUsers(userPage + 1)}
                    disabled={userPage >= userTotalPages - 1}
                  >
                    Next &rarr;
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}

      {/* ─── TAB 3: Job Moderation ────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <>
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading jobs for moderation...</p>
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="empty-state">
              <p>No job postings to moderate.</p>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <>
              <div className="applications-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Title & Company</th>
                      <th>Category & Location</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Posted On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id}>
                        <td><strong>#{j.id}</strong></td>
                        <td>
                          <div className="table-job-info">
                            <strong>{j.title}</strong>
                            <span className="table-subtext">🏢 {j.companyName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="table-job-info">
                            <span>{j.category}</span>
                            <span className="table-subtext">📍 {j.location}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`emp-badge emp-${(j.employmentType || 'full_time').toLowerCase()}`}>
                            {j.employmentType?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${j.status === 'OPEN' ? 'badge-hired' : 'badge-rejected'}`}>
                            {j.status}
                          </span>
                        </td>
                        <td>{formatDate(j.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-danger-outline"
                            onClick={() => handleDeleteJob(j)}
                            disabled={actionPendingId === j.id}
                          >
                            {actionPendingId === j.id ? 'Removing...' : 'Remove Job'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {jobTotalPages > 1 && (
                <nav className="pagination-bar" aria-label="Jobs pagination">
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn"
                    onClick={() => fetchJobs(jobPage - 1)}
                    disabled={jobPage === 0}
                  >
                    &larr; Previous
                  </button>
                  <span className="page-indicator">
                    Page {jobPage + 1} of {jobTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary pagination-btn"
                    onClick={() => fetchJobs(jobPage + 1)}
                    disabled={jobPage >= jobTotalPages - 1}
                  >
                    Next &rarr;
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
