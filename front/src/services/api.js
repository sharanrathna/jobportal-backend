/**
 * Reusable authentication and API service using relative /api paths.
 * Token is stored safely in sessionStorage. Passwords are never persisted.
 */

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'jobportal_user';

export const authStorage = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },
  removeToken: () => sessionStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  removeUser: () => sessionStorage.removeItem(USER_KEY),

  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

/**
 * Standard HTTP helper attaching Bearer token and parsing structured API errors.
 */
async function apiRequest(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (data?.errors && typeof data.errors === 'object' && Object.keys(data.errors).length > 0) {
      errorMessage = Object.values(data.errors).join(', ');
    } else if (data?.message) {
      errorMessage = data.message;
    } else if (data?.error) {
      errorMessage = data.error;
    } else if (response.status === 401) {
      errorMessage = 'Invalid credentials or session expired.';
    } else if (response.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  /**
   * Register a new Student or Company account
   * @param {{ name: string, email: string, password: string, role: 'STUDENT' | 'COMPANY' }} payload
   */
  async register({ name, email, password, role }) {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    if (data.token) {
      authStorage.setToken(data.token);
      if (data.user) {
        authStorage.setUser(data.user);
      }
    }
    return data;
  },

  /**
   * Log into an existing account
   * @param {{ email: string, password: string }} payload
   */
  async login({ email, password }) {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      authStorage.setToken(data.token);
      if (data.user) {
        authStorage.setUser(data.user);
      }
    }
    return data;
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getCurrentUser() {
    const user = await apiRequest('/api/auth/me', {
      method: 'GET',
    });
    if (user) {
      authStorage.setUser(user);
    }
    return user;
  },

  logout() {
    authStorage.clear();
  },
};

export const jobApi = {
  /**
   * Search and filter public jobs
   * @param {{ title?: string, location?: string, category?: string, employmentType?: string, page?: number, size?: number }} params
   */
  async getJobs(params = {}) {
    const query = new URLSearchParams();
    if (params.title) query.append('title', params.title.trim());
    if (params.location) query.append('location', params.location.trim());
    if (params.category) query.append('category', params.category.trim());
    if (params.employmentType) query.append('employmentType', params.employmentType);
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);

    const qs = query.toString();
    const endpoint = `/api/public/jobs${qs ? `?${qs}` : ''}`;
    return apiRequest(endpoint, { method: 'GET' });
  },

  /**
   * Get single job by ID
   * @param {number|string} id
   */
  async getJobById(id) {
    return apiRequest(`/api/public/jobs/${id}`, { method: 'GET' });
  },
};

export const studentApi = {
  /**
   * Apply for a job as an authenticated student
   * @param {number|string} jobId
   * @param {{ coverLetter?: string }} payload
   */
  async applyForJob(jobId, payload = {}) {
    return apiRequest(`/api/student/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter: payload.coverLetter || '' }),
    });
  },

  /**
   * Fetch current student's applications
   * @param {number} page
   * @param {number} size
   */
  async getMyApplications(page = 0, size = 10) {
    return apiRequest(`/api/student/applications?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  /**
   * Withdraw an existing job application
   * @param {number|string} id
   */
  async withdrawApplication(id) {
    return apiRequest(`/api/student/applications/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch current student's application statistics
   */
  async getApplicationStats() {
    return apiRequest('/api/student/applications/stats', {
      method: 'GET',
    });
  },

  /**
   * Fetch current student's profile
   */
  async getProfile() {
    return apiRequest('/api/student/profile', { method: 'GET' });
  },

  /**
   * Create or update student profile
   */
  async saveProfile(payload, exists = false) {
    return apiRequest('/api/student/profile', {
      method: exists ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get smart job recommendations based on profile skills and interests
   */
  async getRecommendations() {
    return apiRequest('/api/student/jobs/recommendations', { method: 'GET' });
  },

  /**
   * Get scheduled interviews for current student
   */
  async getInterviews(page = 0, size = 15) {
    return apiRequest(`/api/student/interviews?page=${page}&size=${size}`, { method: 'GET' });
  },
};

export const companyApi = {
  /**
   * Fetch company-owned jobs
   * @param {number} page
   * @param {number} size
   */
  async getMyJobs(page = 0, size = 10) {
    return apiRequest(`/api/company/jobs?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new job posting
   * @param {{ title: string, description: string, category: string, location: string, employmentType: string, salaryRange?: string, requirements?: string }} payload
   */
  async createJob(payload) {
    return apiRequest('/api/company/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update existing job posting
   */
  async updateJob(id, payload) {
    return apiRequest(`/api/company/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Close a job posting
   */
  async closeJob(id) {
    return apiRequest(`/api/company/jobs/${id}/close`, {
      method: 'PATCH',
    });
  },

  /**
   * Reopen a closed job posting
   */
  async reopenJob(id) {
    return apiRequest(`/api/company/jobs/${id}/reopen`, {
      method: 'PATCH',
    });
  },

  /**
   * Delete a job posting
   */
  async deleteJob(id) {
    return apiRequest(`/api/company/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Fetch applicants for a specific company job
   */
  async getJobApplications(jobId, page = 0, size = 10) {
    return apiRequest(`/api/company/jobs/${jobId}/applications?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch all applications submitted to company's jobs
   */
  async getAllApplications(page = 0, size = 10) {
    return apiRequest(`/api/company/applications?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  /**
   * Update applicant status (APPLIED, SHORTLISTED, REJECTED, HIRED)
   */
  async updateApplicationStatus(id, status) {
    return apiRequest(`/api/company/applications/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
  },

  /**
   * Fetch recruiter analytics metrics
   */
  async getAnalytics() {
    return apiRequest('/api/company/analytics', { method: 'GET' });
  },

  /**
   * Fetch current company's profile
   */
  async getProfile() {
    return apiRequest('/api/company/profile', { method: 'GET' });
  },

  /**
   * Create or update company profile
   */
  async saveProfile(payload, exists = false) {
    return apiRequest('/api/company/profile', {
      method: exists ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export const interviewApi = {
  /**
   * Schedule a new interview for an applicant
   */
  async scheduleInterview(applicationId, payload) {
    return apiRequest(`/api/company/applications/${applicationId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing interview
   */
  async updateInterview(id, payload) {
    return apiRequest(`/api/company/interviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cancel an interview
   */
  async cancelInterview(id) {
    return apiRequest(`/api/company/interviews/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all interviews scheduled by the company
   */
  async getCompanyInterviews(page = 0, size = 15) {
    return apiRequest(`/api/company/interviews?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  /**
   * Get all interviews scheduled for the student
   */
  async getStudentInterviews(page = 0, size = 15) {
    return apiRequest(`/api/student/interviews?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },
};

export const adminApi = {
  /**
   * Fetch platform metrics
   */
  async getMetrics() {
    return apiRequest('/api/admin/metrics', { method: 'GET' });
  },

  /**
   * Fetch paginated users
   */
  async getUsers(page = 0, size = 20) {
    return apiRequest(`/api/admin/users?page=${page}&size=${size}`, { method: 'GET' });
  },

  /**
   * Activate user account
   */
  async activateUser(id) {
    return apiRequest(`/api/admin/users/${id}/activate`, { method: 'PATCH' });
  },

  /**
   * Deactivate user account
   */
  async deactivateUser(id) {
    return apiRequest(`/api/admin/users/${id}/deactivate`, { method: 'PATCH' });
  },

  /**
   * Fetch all platform jobs for moderation
   */
  async getAllJobs(page = 0, size = 20) {
    return apiRequest(`/api/admin/jobs?page=${page}&size=${size}`, { method: 'GET' });
  },

  /**
   * Remove job as admin
   */
  async deleteJob(id) {
    return apiRequest(`/api/admin/jobs/${id}`, { method: 'DELETE' });
  },
};

export const notificationApi = {
  /**
   * Get paginated notifications for current user
   */
  async getNotifications(page = 0, size = 15) {
    return apiRequest(`/api/notifications?page=${page}&size=${size}`, { method: 'GET' });
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    return apiRequest('/api/notifications/unread-count', { method: 'GET' });
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id) {
    return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    return apiRequest('/api/notifications/read-all', { method: 'PATCH' });
  },
};
