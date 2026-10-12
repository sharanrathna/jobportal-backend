import { useState, useEffect, useCallback } from 'react';
import { companyApi, interviewApi } from '../services/api';

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'applicants' | 'interviews' | 'analytics' | 'post-job'
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Post Job Form State
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    employmentType: 'FULL_TIME',
    salaryRange: '',
    requirements: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submittingJob, setSubmittingJob] = useState(false);

  // Status updating
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Interview Modal State
  const [interviewModal, setInterviewModal] = useState({
    isOpen: false,
    mode: 'CREATE', // 'CREATE' | 'EDIT'
    applicationId: null,
    interviewId: null,
    candidateName: '',
    jobTitle: '',
    formData: {
      scheduledAt: '',
      mode: 'VIDEO',
      meetingLink: '',
      notes: '',
      status: 'SCHEDULED',
    },
    submitting: false,
  });

  // Fetch Company Jobs
  const fetchMyJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await companyApi.getMyJobs(0, 50);
      setJobs(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load your posted jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Company Applicants
  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await companyApi.getAllApplications(0, 50);
      setApplications(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load job applicants.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Company Interviews
  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await interviewApi.getCompanyInterviews(0, 50);
      setInterviews(data.content || []);
    } catch (err) {
      setError(err.message || 'Failed to load scheduled interviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Recruiter Analytics
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await companyApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load recruiter analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchMyJobs();
    } else if (activeTab === 'applicants') {
      fetchApplicants();
    } else if (activeTab === 'interviews') {
      fetchInterviews();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, fetchMyJobs, fetchApplicants, fetchInterviews, fetchAnalytics]);

  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateJobForm = () => {
    const errs = {};
    if (!jobFormData.title.trim()) errs.title = 'Job title is required';
    if (!jobFormData.description.trim()) errs.description = 'Description is required';
    if (!jobFormData.category.trim()) errs.category = 'Category is required';
    if (!jobFormData.location.trim()) errs.location = 'Location is required';
    if (!jobFormData.employmentType) errs.employmentType = 'Employment type is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!validateJobForm()) return;

    setSubmittingJob(true);
    setError('');
    setSuccessMsg('');

    try {
      await companyApi.createJob(jobFormData);
      setSuccessMsg(`Job "${jobFormData.title}" posted successfully!`);
      setJobFormData({
        title: '',
        description: '',
        category: '',
        location: '',
        employmentType: 'FULL_TIME',
        salaryRange: '',
        requirements: '',
      });
      setActiveTab('jobs');
      fetchMyJobs();
    } catch (err) {
      setError(err.message || 'Failed to post job.');
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleToggleJobStatus = async (job) => {
    setError('');
    setSuccessMsg('');
    try {
      if (job.status === 'OPEN') {
        await companyApi.closeJob(job.id);
        setSuccessMsg(`Job "${job.title}" marked as CLOSED.`);
      } else {
        await companyApi.reopenJob(job.id);
        setSuccessMsg(`Job "${job.title}" REOPENED.`);
      }
      fetchMyJobs();
    } catch (err) {
      setError(err.message || 'Failed to update job status.');
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to delete "${job.title}"? This cannot be undone.`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      await companyApi.deleteJob(job.id);
      setSuccessMsg(`Job "${job.title}" deleted.`);
      fetchMyJobs();
    } catch (err) {
      setError(err.message || 'Failed to delete job.');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingAppId(appId);
    setError('');
    setSuccessMsg('');
    try {
      await companyApi.updateApplicationStatus(appId, newStatus);
      setSuccessMsg(`Applicant status updated to ${newStatus}.`);
      fetchApplicants();
    } catch (err) {
      setError(err.message || 'Failed to update applicant status.');
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Interview Management
  const openScheduleModal = (app) => {
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setInterviewModal({
      isOpen: true,
      mode: 'CREATE',
      applicationId: app.id,
      interviewId: null,
      candidateName: app.studentName,
      jobTitle: app.jobTitle,
      formData: {
        scheduledAt: localIso,
        mode: 'VIDEO',
        meetingLink: 'https://meet.google.com/',
        notes: 'Please come prepared to discuss your past projects and technical experience.',
        status: 'SCHEDULED',
      },
      submitting: false,
    });
  };

  const openEditInterviewModal = (interview) => {
    let localIso = '';
    if (interview.scheduledAt) {
      const dt = new Date(interview.scheduledAt);
      localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    }

    setInterviewModal({
      isOpen: true,
      mode: 'EDIT',
      applicationId: interview.applicationId,
      interviewId: interview.id,
      candidateName: interview.studentName,
      jobTitle: interview.jobTitle,
      formData: {
        scheduledAt: localIso,
        mode: interview.mode || 'VIDEO',
        meetingLink: interview.meetingLink || '',
        notes: interview.notes || '',
        status: interview.status || 'SCHEDULED',
      },
      submitting: false,
    });
  };

  const closeInterviewModal = () => {
    setInterviewModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleInterviewFormChange = (e) => {
    const { name, value } = e.target;
    setInterviewModal((prev) => ({
      ...prev,
      formData: { ...prev.formData, [name]: value },
    }));
  };

  const handleSaveInterview = async (e) => {
    e.preventDefault();
    setInterviewModal((prev) => ({ ...prev, submitting: true }));
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        scheduledAt: new Date(interviewModal.formData.scheduledAt).toISOString(),
        mode: interviewModal.formData.mode,
        locationOrLink: interviewModal.formData.meetingLink || interviewModal.formData.locationOrLink || 'Online',
        notes: interviewModal.formData.notes,
        status: interviewModal.formData.status,
      };

      if (interviewModal.mode === 'CREATE') {
        await interviewApi.scheduleInterview(interviewModal.applicationId, payload);
        setSuccessMsg(`Interview scheduled successfully with ${interviewModal.candidateName}! Candidate status updated to SHORTLISTED.`);
      } else {
        await interviewApi.updateInterview(interviewModal.interviewId, payload);
        setSuccessMsg(`Interview updated successfully!`);
      }

      closeInterviewModal();
      if (activeTab === 'interviews') {
        fetchInterviews();
      } else if (activeTab === 'applicants') {
        fetchApplicants();
      }
    } catch (err) {
      setError(err.message || 'Failed to save interview.');
    } finally {
      setInterviewModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleCancelInterview = async (interview) => {
    if (!window.confirm(`Are you sure you want to cancel the interview with "${interview.studentName}"?`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      await interviewApi.cancelInterview(interview.id);
      setSuccessMsg(`Interview with ${interview.studentName} has been cancelled.`);
      fetchInterviews();
    } catch (err) {
      setError(err.message || 'Failed to cancel interview.');
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
      <div className="section-header">
        <div>
          <h2>Employer Dashboard</h2>
          <p>Manage job openings, candidate pipelines, interviews, and hiring analytics</p>
        </div>

        <div className="nav-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            My Jobs ({jobs.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'applicants' ? 'active' : ''}`}
            onClick={() => setActiveTab('applicants')}
          >
            Review Applicants ({applications.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'interviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('interviews')}
          >
            Interviews
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Recruiter Analytics
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'post-job' ? 'active' : ''}`}
            onClick={() => setActiveTab('post-job')}
          >
            + Post Job
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

      {/* ─── TAB 1: My Jobs ──────────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <>
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading your posted jobs...</p>
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No Jobs Posted Yet</h3>
              <p>You haven't posted any jobs. Create your first opening to attract candidates!</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('post-job')}
                style={{ marginTop: '1rem' }}
              >
                Post a Job Now
              </button>
            </div>
          )}

          {!loading && jobs.length > 0 && (
            <div className="applications-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Title & Location</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="table-job-info">
                          <strong>{job.title}</strong>
                          <span className="table-subtext">📍 {job.location}</span>
                        </div>
                      </td>
                      <td>{job.category}</td>
                      <td>
                        <span className={`emp-badge emp-${(job.employmentType || 'full_time').toLowerCase()}`}>
                          {job.employmentType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${job.status === 'OPEN' ? 'badge-hired' : 'badge-rejected'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleJobStatus(job)}
                          >
                            {job.status === 'OPEN' ? 'Close' : 'Reopen'}
                          </button>
                          <button
                            type="button"
                            className="btn-danger-outline"
                            onClick={() => handleDeleteJob(job)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── TAB 2: Review Applicants ────────────────────────────────────── */}
      {activeTab === 'applicants' && (
        <>
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading applicant submissions...</p>
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No Applicants Yet</h3>
              <p>Applications received from candidates will appear here for your review.</p>
            </div>
          )}

          {!loading && applications.length > 0 && (
            <div className="applications-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Applied For</th>
                    <th>Cover Letter</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="table-job-info">
                          <strong>{app.studentName}</strong>
                          <span className="table-subtext">✉️ {app.studentEmail}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-job-info">
                          <strong>{app.jobTitle}</strong>
                          <span className="table-subtext">📍 {app.jobLocation}</span>
                        </div>
                      </td>
                      <td>
                        {app.coverLetter ? (
                          <span className="table-cover-letter" title={app.coverLetter}>
                            {app.coverLetter.length > 60
                              ? `${app.coverLetter.substring(0, 60)}...`
                              : app.coverLetter}
                          </span>
                        ) : (
                          <span className="table-subtext">None provided</span>
                        )}
                      </td>
                      <td>{formatDate(app.appliedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span className={`badge badge-${(app.status || 'applied').toLowerCase()}`}>
                            {app.status}
                          </span>
                          <select
                            className="status-select"
                            value={app.status || 'APPLIED'}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            disabled={updatingAppId === app.id}
                          >
                            <option value="APPLIED">APPLIED</option>
                            <option value="SHORTLISTED">SHORTLISTED</option>
                            <option value="HIRED">HIRED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openScheduleModal(app)}
                          title="Schedule an interview session with this candidate"
                        >
                          🗓️ Schedule Interview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── TAB 3: Interviews ───────────────────────────────────────────── */}
      {activeTab === 'interviews' && (
        <>
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading scheduled interviews...</p>
            </div>
          )}

          {!loading && interviews.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🗓️</div>
              <h3>No Interviews Scheduled Yet</h3>
              <p>Review applicants and click "Schedule Interview" to set up meetings.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveTab('applicants')}
                style={{ marginTop: '1rem' }}
              >
                Review Applicants
              </button>
            </div>
          )}

          {!loading && interviews.length > 0 && (
            <div className="applications-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job Title</th>
                    <th>Date & Time</th>
                    <th>Mode & Link</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-job-info">
                          <strong>{item.studentName}</strong>
                          <span className="table-subtext">✉️ {item.studentEmail}</span>
                        </div>
                      </td>
                      <td>{item.jobTitle}</td>
                      <td>
                        <strong>{formatDateTime(item.scheduledAt)}</strong>
                      </td>
                      <td>
                        <span className="emp-badge emp-remote">{item.mode}</span>
                        {(item.locationOrLink || item.meetingLink) && (
                          <div style={{ marginTop: '0.25rem' }}>
                            {(item.locationOrLink || item.meetingLink).startsWith('http') ? (
                              <a
                                href={item.locationOrLink || item.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="meeting-link"
                              >
                                🔗 Join Meeting
                              </a>
                            ) : (
                              <span className="table-subtext">📍 {item.locationOrLink || item.meetingLink}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="table-subtext" title={item.notes}>
                          {item.notes ? (item.notes.length > 40 ? `${item.notes.substring(0, 40)}...` : item.notes) : '—'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === 'SCHEDULED'
                              ? 'badge-applied'
                              : item.status === 'COMPLETED'
                              ? 'badge-hired'
                              : 'badge-rejected'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditInterviewModal(item)}
                          >
                            Edit
                          </button>
                          {item.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              className="btn-danger-outline btn-sm"
                              onClick={() => handleCancelInterview(item)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── TAB 4: Recruiter Analytics ──────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="analytics-view-container">
          {loading && (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Computing real-time recruiter analytics...</p>
            </div>
          )}

          {!loading && analytics && (
            <>
              {/* Primary KPI Grid */}
              <div className="analytics-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Total Job Postings</span>
                    <span className="kpi-icon">💼</span>
                  </div>
                  <div className="kpi-value">{analytics.totalJobs}</div>
                  <div className="kpi-subtitle">
                    <span className="kpi-badge open">{analytics.openJobs} Open</span>
                    <span className="kpi-badge closed">{analytics.closedJobs} Closed</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Total Candidates</span>
                    <span className="kpi-icon">👥</span>
                  </div>
                  <div className="kpi-value">{analytics.totalApplicants}</div>
                  <div className="kpi-subtitle">Across all active postings</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Hired Candidates</span>
                    <span className="kpi-icon">🎉</span>
                  </div>
                  <div className="kpi-value">{analytics.hiredCount}</div>
                  <div className="kpi-subtitle">Successfully recruited</div>
                </div>

                <div className="kpi-card highlight">
                  <div className="kpi-header">
                    <span className="kpi-title">Hiring Conversion Rate</span>
                    <span className="kpi-icon">📈</span>
                  </div>
                  <div className="kpi-value">{analytics.hiringConversionRate.toFixed(1)}%</div>
                  <div className="kpi-subtitle">Hired ÷ Total Applicants</div>
                </div>
              </div>

              {/* Status Breakdown Section */}
              <div className="dashboard-card" style={{ marginTop: '1.5rem' }}>
                <h3>Candidate Pipeline Funnel</h3>
                <p className="section-subtitle">Real-time status breakdown for your job openings</p>

                <div className="funnel-stats-row">
                  <div className="funnel-item">
                    <div className="funnel-num">{analytics.appliedCount}</div>
                    <div className="funnel-label">Applied (Under Review)</div>
                  </div>
                  <div className="funnel-divider">&rarr;</div>
                  <div className="funnel-item">
                    <div className="funnel-num text-purple">{analytics.shortlistedCount}</div>
                    <div className="funnel-label">Shortlisted / Interviewing</div>
                  </div>
                  <div className="funnel-divider">&rarr;</div>
                  <div className="funnel-item">
                    <div className="funnel-num text-green">{analytics.hiredCount}</div>
                    <div className="funnel-label">Hired</div>
                  </div>
                  <div className="funnel-divider">&bull;</div>
                  <div className="funnel-item">
                    <div className="funnel-num text-red">{analytics.rejectedCount}</div>
                    <div className="funnel-label">Rejected</div>
                  </div>
                </div>
              </div>

              {/* Applicants per Job Breakdown Table */}
              <div className="dashboard-card" style={{ marginTop: '1.5rem' }}>
                <h3>Applicant Distribution per Job</h3>
                <p className="section-subtitle">Engagement and candidate response volume per posting</p>

                {(!analytics.jobMetrics || analytics.jobMetrics.length === 0) ? (
                  <p className="note-muted">No job postings created yet.</p>
                ) : (
                  <div className="applications-table-wrapper" style={{ marginTop: '1rem' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Job Title</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Applicants Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.jobMetrics.map((jm) => (
                          <tr key={jm.jobId}>
                            <td>
                              <strong>{jm.jobTitle}</strong>
                            </td>
                            <td>📍 {jm.jobLocation}</td>
                            <td>
                              <span className={`badge ${jm.status === 'OPEN' ? 'badge-hired' : 'badge-rejected'}`}>
                                {jm.status}
                              </span>
                            </td>
                            <td>
                              <span className="applicant-count-pill">
                                {jm.applicantCount} {jm.applicantCount === 1 ? 'applicant' : 'applicants'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 5: Post Job Form ────────────────────────────────────────── */}
      {activeTab === 'post-job' && (
        <div className="form-card-container">
          <form onSubmit={handleCreateJob} className="job-create-form" noValidate>
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="job-title">Job Title *</label>
                <input
                  id="job-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Lead Frontend Architect"
                  value={jobFormData.title}
                  onChange={handleJobFormChange}
                  className={formErrors.title ? 'input-error' : ''}
                  disabled={submittingJob}
                />
                {formErrors.title && <span className="field-error">{formErrors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="job-category">Category *</label>
                <input
                  id="job-category"
                  name="category"
                  type="text"
                  placeholder="e.g. Engineering, Marketing, Design"
                  value={jobFormData.category}
                  onChange={handleJobFormChange}
                  className={formErrors.category ? 'input-error' : ''}
                  disabled={submittingJob}
                />
                {formErrors.category && <span className="field-error">{formErrors.category}</span>}
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label htmlFor="job-location">Location *</label>
                <input
                  id="job-location"
                  name="location"
                  type="text"
                  placeholder="e.g. Austin, TX or Remote"
                  value={jobFormData.location}
                  onChange={handleJobFormChange}
                  className={formErrors.location ? 'input-error' : ''}
                  disabled={submittingJob}
                />
                {formErrors.location && <span className="field-error">{formErrors.location}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="job-emp-type">Employment Type *</label>
                <select
                  id="job-emp-type"
                  name="employmentType"
                  value={jobFormData.employmentType}
                  onChange={handleJobFormChange}
                  disabled={submittingJob}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="job-salary">Salary Range (optional)</label>
                <input
                  id="job-salary"
                  name="salaryRange"
                  type="text"
                  placeholder="e.g. $100,000 - $130,000"
                  value={jobFormData.salaryRange}
                  onChange={handleJobFormChange}
                  disabled={submittingJob}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="job-desc">Job Description *</label>
              <textarea
                id="job-desc"
                name="description"
                rows={5}
                placeholder="Describe responsibilities, day-to-day work, and impact..."
                value={jobFormData.description}
                onChange={handleJobFormChange}
                className={formErrors.description ? 'input-error' : ''}
                disabled={submittingJob}
              />
              {formErrors.description && <span className="field-error">{formErrors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="job-reqs">Requirements & Qualifications (optional)</label>
              <textarea
                id="job-reqs"
                name="requirements"
                rows={4}
                placeholder="List technical stack requirements, years of experience, credentials..."
                value={jobFormData.requirements}
                onChange={handleJobFormChange}
                disabled={submittingJob}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submittingJob}>
                {submittingJob ? 'Publishing Job...' : 'Publish Job Opportunity'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveTab('jobs')}
                disabled={submittingJob}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Interview Schedule / Edit Modal ─────────────────────────────── */}
      {interviewModal.isOpen && (
        <div className="modal-backdrop" onClick={closeInterviewModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="interview-modal-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="interview-modal-title">
                  {interviewModal.mode === 'CREATE' ? 'Schedule Interview Session' : 'Update Interview Details'}
                </h3>
                <p className="modal-subtitle">
                  Candidate: {interviewModal.candidateName} &bull; Position: {interviewModal.jobTitle}
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={closeInterviewModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInterview} className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="scheduledAt">
                    Date & Time <span className="required">*</span>
                  </label>
                  <input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    value={interviewModal.formData.scheduledAt}
                    onChange={handleInterviewFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mode">Interview Mode</label>
                  <select
                    id="mode"
                    name="mode"
                    value={interviewModal.formData.mode}
                    onChange={handleInterviewFormChange}
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="IN_PERSON">In Person</option>
                    <option value="PHONE">Phone Call</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="meetingLink">Meeting URL or Location Address</label>
                <input
                  id="meetingLink"
                  name="meetingLink"
                  type="text"
                  placeholder="e.g. https://meet.google.com/abc-xyz or Office Room 302"
                  value={interviewModal.formData.meetingLink}
                  onChange={handleInterviewFormChange}
                  maxLength={255}
                />
              </div>

              {interviewModal.mode === 'EDIT' && (
                <div className="form-group">
                  <label htmlFor="status">Session Status</label>
                  <select
                    id="status"
                    name="status"
                    value={interviewModal.formData.status}
                    onChange={handleInterviewFormChange}
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="notes">Instructions / Notes for Candidate</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  placeholder="Include any preparation guidelines, agenda, or dial-in PIN..."
                  value={interviewModal.formData.notes}
                  onChange={handleInterviewFormChange}
                  maxLength={500}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeInterviewModal}
                  disabled={interviewModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={interviewModal.submitting}
                >
                  {interviewModal.submitting
                    ? 'Saving...'
                    : interviewModal.mode === 'CREATE'
                    ? 'Schedule & Notify Candidate'
                    : 'Update Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
