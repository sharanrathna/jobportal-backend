import { useState, useEffect } from 'react';
import { studentApi } from '../services/api';

export default function JobRecommendations({ onNavigateToResume, onNavigateToJobs }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingJob, setApplyingJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');

  const loadRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentApi.getRecommendations();
      setRecommendations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch job recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleOpenApply = (jobRec) => {
    setApplyingJob(jobRec);
    setCoverLetter('');
    setApplySuccess('');
  };

  const handleCloseApply = () => {
    setApplyingJob(null);
    setCoverLetter('');
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyingJob) return;

    setSubmitting(true);
    setError('');
    try {
      await studentApi.applyForJob(applyingJob.id, { coverLetter });
      setApplySuccess(`Application submitted successfully to ${applyingJob.companyName}!`);
      // Remove applied job from list
      setRecommendations((prev) => prev.filter((r) => r.id !== applyingJob.id));
      setTimeout(() => {
        handleCloseApply();
        setApplySuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner"></span>
        <p>Analyzing matching opportunities tailored to your profile skills...</p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <div>
          <h2>Smart Job Recommendations</h2>
          <p className="section-subtitle">
            Curated opportunities matched deterministically against your verified resume skills and background.
          </p>
        </div>
        <div className="recommendations-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadRecommendations}
          >
            🔄 Refresh Matches
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={onNavigateToResume}
          >
            📝 Edit Resume Skills
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {applySuccess && (
        <div className="success-banner" role="status">
          ✓ {applySuccess}
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No Job Recommendations Available Right Now</h3>
          <p>
            Add technical skills and headline to your resume builder to unlock automated deterministic job matching.
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNavigateToResume}
            >
              Update Resume Profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToJobs}
            >
              Explore All Jobs
            </button>
          </div>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map((rec) => {
            const job = rec.job || rec;
            const isHighMatch = rec.matchPercentage >= 70;
            const isMediumMatch = rec.matchPercentage >= 40 && rec.matchPercentage < 70;

            return (
              <div key={job.id || rec.id} className="recommendation-card">
                <div className="match-score-badge-row">
                  <div
                    className={`match-score-pill ${
                      isHighMatch ? 'match-high' : isMediumMatch ? 'match-medium' : 'match-fair'
                    }`}
                  >
                    <span className="match-percentage">{rec.matchPercentage}%</span>
                    <span className="match-label">Match</span>
                  </div>
                  <span className="employment-tag">{job.employmentType}</span>
                </div>

                <div className="job-title-group">
                  <h3 className="rec-job-title">{job.title}</h3>
                  <div className="rec-company-row">
                    <span className="rec-company">🏢 {job.companyName}</span>
                    <span className="rec-location">📍 {job.location}</span>
                  </div>
                </div>

                <div className="match-explanation-box">
                  <span className="match-reason-heading">💡 Match Analysis:</span>
                  <p className="match-reason-text">{rec.matchReason}</p>
                </div>

                {/* Matched Skills */}
                {rec.matchedSkills && rec.matchedSkills.length > 0 && (
                  <div className="skills-group">
                    <span className="skills-label">Matched Skills:</span>
                    <div className="skills-chips">
                      {rec.matchedSkills.map((skill, idx) => (
                        <span key={idx} className="skill-chip matched">
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {rec.missingSkills && rec.missingSkills.length > 0 && (
                  <div className="skills-group">
                    <span className="skills-label">Missing Skills:</span>
                    <div className="skills-chips">
                      {rec.missingSkills.map((skill, idx) => (
                        <span key={idx} className="skill-chip missing">
                          + {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rec-card-footer">
                  <span className="rec-category">🏷️ {job.category}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenApply({ ...rec, ...job })}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Modal */}
      {applyingJob && (
        <div className="modal-backdrop" onClick={handleCloseApply}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="apply-rec-title"
          >
            <div className="modal-header">
              <div>
                <h3 id="apply-rec-title">Apply to {applyingJob.title}</h3>
                <p className="modal-subtitle">
                  {applyingJob.companyName} &bull; {applyingJob.location}
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={handleCloseApply}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="rec-modal-match-summary">
              <span className="highlight-score">{applyingJob.matchPercentage}% Profile Match</span>
              <p>{applyingJob.matchReason}</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="modal-body">
              <div className="form-group">
                <label htmlFor="coverLetter">
                  Cover Letter / Note to Recruiter (Optional)
                </label>
                <textarea
                  id="coverLetter"
                  rows="4"
                  placeholder="Highlight your relevant experience, passion, and reasons why you're a strong fit..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseApply}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
