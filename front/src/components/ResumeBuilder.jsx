import { useState, useEffect } from 'react';
import { studentApi } from '../services/api';

export default function ResumeBuilder({ currentUser, onNavigateToRecommendations }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    headline: '',
    education: '',
    skills: '',
    experience: '',
    projects: '',
    bio: '',
    phone: '',
    resumeUrl: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentApi.getProfile();
      if (data) {
        setProfileExists(true);
        setFormData({
          headline: data.headline || '',
          education: data.education || '',
          skills: data.skills || '',
          experience: data.experience || '',
          projects: data.projects || '',
          bio: data.bio || '',
          phone: data.phone || '',
          resumeUrl: data.resumeUrl || '',
        });
      }
    } catch (err) {
      if (err.status === 404) {
        // Profile does not exist yet; prompt student to build their resume
        setProfileExists(false);
        setIsEditing(true);
      } else {
        setError(err.message || 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await studentApi.saveProfile(formData, profileExists);
      setProfileExists(true);
      setIsEditing(false);
      setSuccessMsg('Resume profile saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      if (data) {
        setFormData({
          headline: data.headline || '',
          education: data.education || '',
          skills: data.skills || '',
          experience: data.experience || '',
          projects: data.projects || '',
          bio: data.bio || '',
          phone: data.phone || '',
          resumeUrl: data.resumeUrl || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner"></span>
        <p>Loading your resume profile...</p>
      </div>
    );
  }

  return (
    <div className="resume-builder-container">
      {/* Action Header (Hidden during print) */}
      <div className="resume-actions-header no-print">
        <div>
          <h2>Professional Resume & Profile</h2>
          <p className="section-subtitle">
            Keep your skills, projects, and education up-to-date to stand out to employers.
          </p>
        </div>
        <div className="resume-header-buttons">
          {!isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Resume
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrint}
              >
                🖨️ Print / Download PDF
              </button>
              {onNavigateToRecommendations && (
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={onNavigateToRecommendations}
                >
                  🎯 View Job Matches
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner no-print" role="alert">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="success-banner no-print" role="status">
          ✓ {successMsg}
        </div>
      )}

      {/* Editor Form Mode */}
      {isEditing ? (
        <div className="dashboard-card resume-edit-card no-print">
          <h3>{profileExists ? 'Update Your Resume' : 'Create Your Professional Resume'}</h3>
          <p className="form-help-text">
            Enter your accurate credentials. This information is saved to your account and powers smart job matching.
          </p>

          <form onSubmit={handleSave} className="resume-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="headline">
                  Professional Headline <span className="required">*</span>
                </label>
                <input
                  id="headline"
                  name="headline"
                  type="text"
                  placeholder="e.g. Full Stack Developer | Java & React Enthusiast"
                  value={formData.headline}
                  onChange={handleChange}
                  maxLength={150}
                  required
                />
                <span className="char-count">{formData.headline.length}/150</span>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="skills">
                Key Skills (Comma-separated) <span className="required">*</span>
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                placeholder="e.g. Java, Spring Boot, React, MySQL, REST APIs, Git, Docker"
                value={formData.skills}
                onChange={handleChange}
                maxLength={500}
                required
              />
              <span className="form-tip">These skills are matched against employer job requirements.</span>
            </div>

            <div className="form-group">
              <label htmlFor="education">
                Education History <span className="required">*</span>
              </label>
              <textarea
                id="education"
                name="education"
                rows="3"
                placeholder="e.g. B.S. in Computer Science — ABC University (2022 - 2026)&#10;GPA: 3.8/4.0 | Coursework: Data Structures, Distributed Systems"
                value={formData.education}
                onChange={handleChange}
                maxLength={500}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="experience">Work / Internship Experience</label>
              <textarea
                id="experience"
                name="experience"
                rows="4"
                placeholder="e.g. Software Engineer Intern at Tech Corp (May 2025 - Aug 2025)&#10;• Developed RESTful microservices in Spring Boot&#10;• Optimized database queries cutting latency by 35%"
                value={formData.experience}
                onChange={handleChange}
                maxLength={1000}
              />
            </div>

            <div className="form-group">
              <label htmlFor="projects">Featured Projects & Portfolio</label>
              <textarea
                id="projects"
                name="projects"
                rows="4"
                placeholder="e.g. Job Portal Application (Spring Boot + React): Built full-stack platform with JWT auth, role dashboards, and interview scheduler.&#10;Portfolio Site: Modern accessible web design with interactive animations."
                value={formData.projects}
                onChange={handleChange}
                maxLength={1500}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Summary / Professional Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows="3"
                placeholder="A brief overview of your career aspirations and passion for technology..."
                value={formData.bio}
                onChange={handleChange}
                maxLength={1000}
              />
            </div>

            <div className="form-group">
              <label htmlFor="resumeUrl">External Portfolio / PDF Link</label>
              <input
                id="resumeUrl"
                name="resumeUrl"
                type="url"
                placeholder="https://github.com/username or https://myportfolio.com"
                value={formData.resumeUrl}
                onChange={handleChange}
                maxLength={255}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : profileExists ? 'Save Changes' : 'Create Resume'}
              </button>
              {profileExists && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* Printable Resume Paper View */
        <div className="resume-paper" id="printable-resume">
          {/* Header */}
          <div className="resume-paper-header">
            <h1 className="resume-name">{currentUser?.name || 'Student Candidate'}</h1>
            <p className="resume-headline">{formData.headline || 'Aspiring Professional'}</p>
            <div className="resume-contact-bar">
              <span>📧 {currentUser?.email}</span>
              {formData.phone && <span>📞 {formData.phone}</span>}
              {formData.resumeUrl && (
                <span>
                  🌐 <a href={formData.resumeUrl} target="_blank" rel="noopener noreferrer">{formData.resumeUrl}</a>
                </span>
              )}
            </div>
          </div>

          <hr className="resume-divider" />

          {/* Bio / Summary */}
          {formData.bio && (
            <div className="resume-section">
              <h3 className="resume-section-title">Professional Summary</h3>
              <p className="resume-text">{formData.bio}</p>
            </div>
          )}

          {/* Skills */}
          {formData.skills && (
            <div className="resume-section">
              <h3 className="resume-section-title">Technical & Professional Skills</h3>
              <div className="resume-skills-chips">
                {formData.skills
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill, idx) => (
                    <span key={idx} className="resume-skill-tag">
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {formData.experience && (
            <div className="resume-section">
              <h3 className="resume-section-title">Experience</h3>
              <div className="resume-formatted-block">
                {formData.experience.split('\n').map((line, i) => (
                  <p key={i} className="resume-bullet-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Featured Projects */}
          {formData.projects && (
            <div className="resume-section">
              <h3 className="resume-section-title">Featured Projects</h3>
              <div className="resume-formatted-block">
                {formData.projects.split('\n').map((line, i) => (
                  <p key={i} className="resume-bullet-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {formData.education && (
            <div className="resume-section">
              <h3 className="resume-section-title">Education</h3>
              <div className="resume-formatted-block">
                {formData.education.split('\n').map((line, i) => (
                  <p key={i} className="resume-bullet-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="resume-paper-footer">
            <span>Generated securely via JobPortal platform &bull; Verified Candidate</span>
          </div>
        </div>
      )}
    </div>
  );
}
