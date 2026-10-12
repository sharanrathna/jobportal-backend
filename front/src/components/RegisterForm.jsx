import { useState } from 'react';
import { authApi } from '../services/api';

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!['STUDENT', 'COMPANY'].includes(formData.role)) {
      errs.role = 'Please select a valid role (Student or Employer)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
      onSuccess(res.user);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2>Create an Account</h2>
        <p>Join as a Job Seeker or an Employer</p>
      </div>

      {apiError && (
        <div className="alert alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <div className="form-group">
          <label>I want to join as</label>
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${formData.role === 'STUDENT' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'role', value: 'STUDENT' } })}
              disabled={loading}
            >
              <span className="role-icon">🎓</span>
              <div>
                <strong>Student / Job Seeker</strong>
                <small>Apply for jobs & manage profile</small>
              </div>
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'COMPANY' ? 'active' : ''}`}
              onClick={() => handleChange({ target: { name: 'role', value: 'COMPANY' } })}
              disabled={loading}
            >
              <span className="role-icon">🏢</span>
              <div>
                <strong>Employer / Company</strong>
                <small>Post jobs & review candidates</small>
              </div>
            </button>
          </div>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            name="name"
            type="text"
            placeholder={formData.role === 'STUDENT' ? 'John Doe' : 'Acme HR Manager'}
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            className={errors.name ? 'input-error' : ''}
            autoComplete="name"
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-email">Email Address</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            className={errors.email ? 'input-error' : ''}
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="reg-password">Password (min 6 characters)</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            className={errors.password ? 'input-error' : ''}
            autoComplete="new-password"
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <span className="spinner-wrapper">
              <span className="spinner"></span> Creating Account...
            </span>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
