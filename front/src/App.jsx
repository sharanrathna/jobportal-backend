import { useState, useEffect } from 'react';
import JobList from './components/JobList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import StudentApplications from './components/StudentApplications';
import CompanyDashboard from './components/CompanyDashboard';
import AdminDashboard from './components/AdminDashboard';
import NotificationCenter from './components/NotificationCenter';
import ResumeBuilder from './components/ResumeBuilder';
import JobRecommendations from './components/JobRecommendations';
import { authApi, authStorage, notificationApi } from './services/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [currentView, setCurrentView] = useState('jobs'); // 'jobs' | 'student-apps' | 'company-dashboard' | 'admin-dashboard' | 'login' | 'register' | 'profile'
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [notification, setNotification] = useState('');
  const [testingApi, setTestingApi] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getToken();
      if (token) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch {
          authStorage.clear();
          setUser(null);
        }
      }
      setLoadingInitial(false);
    };

    initAuth();
  }, []);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const data = await notificationApi.getUnreadCount();
      if (data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === 'ROLE_COMPANY') {
      setCurrentView('company-dashboard');
    } else if (authenticatedUser.role === 'ROLE_ADMIN') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('jobs');
    }
    setNotification(`Welcome back, ${authenticatedUser.name}!`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    setCurrentView('jobs');
    setNotification('You have successfully signed out.');
    setTimeout(() => setNotification(''), 4000);
  };

  const handleTestProtectedMe = async () => {
    setTestingApi(true);
    setApiResult(null);
    try {
      const res = await authApi.getCurrentUser();
      setApiResult({
        endpoint: 'GET /api/auth/me (Protected Bearer Token)',
        status: 200,
        data: res,
      });
    } catch (err) {
      setApiResult({
        endpoint: 'GET /api/auth/me',
        status: err.status || 500,
        error: err.message,
      });
    } finally {
      setTestingApi(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="loading-state">
            <span className="spinner"></span>
            <p>Initializing JobPortal session...</p>
          </div>
        </main>
      </div>
    );
  }

  const isStudent = user?.role === 'ROLE_STUDENT';
  const isCompany = user?.role === 'ROLE_COMPANY';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="app-header">
        <div className="brand" onClick={() => setCurrentView('jobs')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">💼</div>
          <div>
            <h1>JobPortal</h1>
            <span className="brand-subtitle">Career & Talent Platform</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${currentView === 'jobs' ? 'active' : ''}`}
            onClick={() => setCurrentView('jobs')}
          >
            Explore Jobs
          </button>

          {isStudent && (
            <>
              <button
                type="button"
                className={`nav-link ${currentView === 'student-apps' ? 'active' : ''}`}
                onClick={() => setCurrentView('student-apps')}
              >
                Applications & Interviews
              </button>
              <button
                type="button"
                className={`nav-link ${currentView === 'job-recommendations' ? 'active' : ''}`}
                onClick={() => setCurrentView('job-recommendations')}
              >
                🎯 Job Matches
              </button>
              <button
                type="button"
                className={`nav-link ${currentView === 'student-resume' ? 'active' : ''}`}
                onClick={() => setCurrentView('student-resume')}
              >
                📄 Resume Builder
              </button>
            </>
          )}

          {isCompany && (
            <button
              type="button"
              className={`nav-link ${currentView === 'company-dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('company-dashboard')}
            >
              Employer Dashboard
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              className={`nav-link ${currentView === 'admin-dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin-dashboard')}
            >
              Admin Console
            </button>
          )}

          {user ? (
            <div className="auth-user-menu">
              <button
                type="button"
                className="notification-bell-btn"
                onClick={() => setShowNotifications(true)}
                title="View notifications"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                  <span className="notification-badge-counter">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`user-profile-btn ${currentView === 'profile' ? 'active' : ''}`}
                onClick={() => setCurrentView('profile')}
              >
                <span className="header-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
                <span className="header-username">{user.name}</span>
                <span
                  className={`badge ${
                    isStudent
                      ? 'badge-student'
                      : isCompany
                      ? 'badge-company'
                      : 'badge-admin'
                  }`}
                >
                  {user.role ? user.role.replace('ROLE_', '') : 'USER'}
                </span>
              </button>

              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="nav-tabs">
              <button
                type="button"
                className={`tab-btn ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentView('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${currentView === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentView('register')}
              >
                Register
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Global Notification Toast */}
      {notification && (
        <div className="global-notification" role="status">
          <span>✓ {notification}</span>
        </div>
      )}

      {/* Main Content View */}
      <main className="main-content">
        {currentView === 'jobs' && (
          <JobList
            currentUser={user}
            onNavigateToLogin={() => setCurrentView('login')}
          />
        )}

        {currentView === 'student-apps' && isStudent && (
          <StudentApplications onExploreJobs={() => setCurrentView('jobs')} />
        )}

        {currentView === 'job-recommendations' && isStudent && (
          <JobRecommendations
            onNavigateToResume={() => setCurrentView('student-resume')}
            onNavigateToJobs={() => setCurrentView('jobs')}
          />
        )}

        {currentView === 'student-resume' && isStudent && (
          <ResumeBuilder
            currentUser={user}
            onNavigateToRecommendations={() => setCurrentView('job-recommendations')}
          />
        )}

        {currentView === 'company-dashboard' && isCompany && (
          <CompanyDashboard />
        )}

        {currentView === 'admin-dashboard' && isAdmin && (
          <AdminDashboard />
        )}

        {currentView === 'login' && !user && (
          <div className="auth-view-wrapper">
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setCurrentView('register')}
            />
          </div>
        )}

        {currentView === 'register' && !user && (
          <div className="auth-view-wrapper">
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setCurrentView('login')}
            />
          </div>
        )}

        {currentView === 'profile' && user && (
          <div className="dashboard-card">
            <div className="profile-header">
              <div className="profile-info">
                <div className="avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="profile-text">
                  <h2>{user.name}</h2>
                  <p>{user.email}</p>
                </div>
              </div>
              <span
                className={`badge ${
                  isStudent
                    ? 'badge-student'
                    : isCompany
                    ? 'badge-company'
                    : 'badge-admin'
                }`}
              >
                {user.role ? user.role.replace('ROLE_', '') : 'USER'}
              </span>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Account ID</span>
                <span className="detail-value">#{user.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="status-badge">
                  <span className="status-dot"></span>
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Account Role</span>
                <span className="detail-value">{user.role}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Auth Method</span>
                <span className="detail-value">JWT Bearer (sessionStorage)</span>
              </div>
            </div>

            <div className="action-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTestProtectedMe}
                disabled={testingApi}
              >
                {testingApi ? 'Testing...' : 'Verify Session (GET /api/auth/me)'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentView('jobs')}
              >
                Return to Job Listings
              </button>
            </div>

            {apiResult && (
              <div className="response-viewer" aria-live="polite">
                <div style={{ marginBottom: '0.5rem', color: '#93c5fd', fontWeight: 600 }}>
                  {apiResult.endpoint} — HTTP {apiResult.status}
                </div>
                <pre>{JSON.stringify(apiResult.data || apiResult.error, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        JobPortal Platform &copy; 2026 &bull; Student & Employer Workflows
      </footer>

      {/* Persistent Notification Center */}
      {user && (
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => {
            setShowNotifications(false);
            fetchUnreadCount();
          }}
          onNotificationRead={fetchUnreadCount}
        />
      )}
    </div>
  );
}
