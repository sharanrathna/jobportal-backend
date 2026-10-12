import { useState, useEffect } from 'react';
import { studentApi } from '../services/api';

export default function JobDetailsModal({ job, currentUser, onClose, onNavigateToLogin }) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  const isStudent = currentUser?.role === 'ROLE_STUDENT';
  const isCompany = currentUser?.role === 'ROLE_COMPANY';

  const formatEmploymentType = (type) => {
    if (!type) return 'Full Time';
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplying(true);
    setApplyError('');

    try {
      await studentApi.applyForJob(job.id, { coverLetter });
      setApplySuccess(true);
      setShowApplyForm(false);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-company-info">
            <div className="modal-avatar">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.companyName || 'Company'} />
              ) : (
                <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C'}</span>
              )}
            </div>
            <div>
              <h2 className="modal-job-title">{job.title}</h2>
              <span className="modal-company-name">
                {job.companyName || 'Confidential Employer'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-tags">
          <span className={`emp-badge emp-${(job.employmentType || 'full_time').toLowerCase()}`}>
            {formatEmploymentType(job.employmentType)}
          </span>
          <span className="meta-tag">
            <span className="meta-icon">📍</span>
            {job.location || 'Remote / Unspecified'}
          </span>
          {job.category && (
            <span className="meta-tag">
              <span className="meta-icon">🏷️</span>
              {job.category}
            </span>
          )}
          {job.salaryRange && (
            <span className="meta-tag salary-tag">
              <span className="meta-icon">💰</span>
              {job.salaryRange}
            </span>
          )}
          <span className="status-badge" style={{ marginLeft: 'auto' }}>
            <span className="status-dot"></span>
            {job.status || 'OPEN'}
          </span>
        </div>

        <div className="modal-body">
          {applySuccess && (
            <div className="alert alert-success" role="status">
              <span className="alert-icon">✓</span>
              <div>
                <strong>Application Submitted!</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                  Your application has been received by {job.companyName || 'the employer'}. Track its status under "My Applications".
                </p>
              </div>
            </div>
          )}

          {applyError && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <span>{applyError}</span>
            </div>
          )}

          {/* Job Application Form Tray */}
          {showApplyForm && !applySuccess && (
            <form onSubmit={handleApplySubmit} className="apply-form-box">
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-h)' }}>
                Apply for {job.title}
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text)' }}>
                Applying as <strong>{currentUser?.name}</strong> ({currentUser?.email})
              </p>

              <div className="form-group">
                <label htmlFor="cover-letter">
                  Cover Letter / Note to Employer (optional)
                </label>
                <textarea
                  id="cover-letter"
                  rows={4}
                  maxLength={2000}
                  placeholder="Introduce yourself and highlight relevant experience..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  disabled={applying}
                />
                <span className="char-count">{coverLetter.length} / 2000</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={applying}>
                  {applying ? 'Submitting...' : 'Confirm Application'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApplyForm(false)}
                  disabled={applying}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <section className="modal-section">
            <h3>Job Description</h3>
            <p className="modal-text-content">{job.description}</p>
          </section>

          {job.requirements && (
            <section className="modal-section">
              <h3>Requirements & Qualifications</h3>
              <p className="modal-text-content">{job.requirements}</p>
            </section>
          )}

          <div className="modal-footer-meta">
            <span>Posted: {formatDate(job.createdAt)}</span>
            {job.updatedAt && job.updatedAt !== job.createdAt && (
              <span>Updated: {formatDate(job.updatedAt)}</span>
            )}
            <span>Job ID: #{job.id}</span>
          </div>
        </div>

        <div className="modal-footer">
          {/* Action based on auth & role */}
          {isStudent && !applySuccess && !showApplyForm && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowApplyForm(true)}
            >
              Apply for this Job
            </button>
          )}

          {!currentUser && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onNavigateToLogin) onNavigateToLogin();
              }}
            >
              Sign In to Apply
            </button>
          )}

          {isCompany && (
            <span className="meta-tag" style={{ marginRight: 'auto' }}>
              🏢 Viewing as Employer
            </span>
          )}

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
