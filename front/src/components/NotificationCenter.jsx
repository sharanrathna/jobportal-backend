import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/api';

export default function NotificationCenter({ isOpen, onClose, onNotificationRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotifications = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationApi.getNotifications(targetPage, 15);
      setNotifications(data.content || []);
      setPage(data.number || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0);
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    setMarkingId(id);
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Notifications">
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <div className="notification-panel-title">
            <span className="notification-header-icon">🔔</span>
            <h3>Notifications</h3>
          </div>
          <div className="notification-panel-actions">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                className="btn-text btn-sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                {markingAll ? 'Updating...' : 'Mark all read'}
              </button>
            )}
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close notifications"
            >
              &times;
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: '0.75rem 1rem' }}>
            <span>{error}</span>
          </div>
        )}

        <div className="notification-panel-body">
          {loading && (
            <div className="loading-state" style={{ padding: '2rem 1rem' }}>
              <span className="spinner"></span>
              <p>Loading notifications...</p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
              <div className="empty-icon">🔕</div>
              <h4>No Notifications</h4>
              <p>You're all caught up! New application updates and messages will appear here.</p>
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <div className="notification-list">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? 'unread' : 'read'}`}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <div className="notification-icon-col">
                    {n.type === 'APPLICATION_STATUS' ? (
                      <span className="notif-badge-icon status-icon">📋</span>
                    ) : n.type === 'INTERVIEW' ? (
                      <span className="notif-badge-icon interview-icon">📅</span>
                    ) : (
                      <span className="notif-badge-icon general-icon">ℹ️</span>
                    )}
                  </div>

                  <div className="notification-content-col">
                    <div className="notification-item-header">
                      <strong className="notification-item-title">{n.title}</strong>
                      <span className="notification-time">{formatTimeAgo(n.createdAt)}</span>
                    </div>
                    <p className="notification-message">{n.message}</p>
                  </div>

                  {!n.read && (
                    <div className="notification-action-col">
                      <button
                        type="button"
                        className="mark-read-dot-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        disabled={markingId === n.id}
                        title="Mark as read"
                      >
                        <span className="unread-dot"></span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="notification-panel-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchNotifications(page - 1)}
              disabled={page === 0}
            >
              &larr; Prev
            </button>
            <span className="page-indicator" style={{ fontSize: '0.8rem' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchNotifications(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
