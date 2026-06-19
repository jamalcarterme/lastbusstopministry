// Last Bus Stop Ministry - API Client
(function (global) {
  const BASE_URL = 'https://backend-lastbusstopministry.onrender.com';
  const API_URL = BASE_URL + '/api';
  const TOKEN_KEY = 'lbsm_token';
  const USER_KEY = 'lbsm_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }
  function setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  function isLoggedIn() {
    return !!getToken();
  }

  /**
   * Core request helper.
   * @param {string} path - e.g. '/auth/login'
   * @param {object} opts - { method, body, isForm, params }
   */
  async function request(path, opts = {}) {
    const { method = 'GET', body, isForm = false, params } = opts;

    let url = API_URL + path;
    if (params && Object.keys(params).length) {
      const qs = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (qs) url += '?' + qs;
    }

    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let fetchBody;
    if (isForm) {
      fetchBody = body; // FormData - browser sets Content-Type
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      fetchBody = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(url, { method, headers, body: fetchBody });
    } catch (networkErr) {
      const err = new Error('Could not reach the server. Please check your internet connection and try again.');
      err.isNetworkError = true;
      throw err;
    }

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (!res.ok) {
      const message = (data && data.message) || `Request failed with status ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.errors = data && data.errors;
      if (res.status === 401) {
        // Token invalid/expired
        clearSession();
      }
      throw err;
    }

    return data;
  }

  const api = {
    BASE_URL,
    API_URL,
    getToken,
    setToken,
    getUser,
    setUser,
    clearSession,
    isLoggedIn,
    get: (path, params) => request(path, { method: 'GET', params }),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    del: (path) => request(path, { method: 'DELETE' }),
    postForm: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),

    // ── Auth ──────────────────────────────────────────────
    auth: {
      login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
      register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
      me: () => request('/auth/me'),
      updateMe: (payload) => request('/auth/me', { method: 'PUT', body: payload }),
      changePassword: (currentPassword, newPassword) =>
        request('/auth/me/password', { method: 'PUT', body: { currentPassword, newPassword } }),
    },

    // ── Announcements ─────────────────────────────────────
    announcements: {
      homepage: () => request('/announcements/homepage'),
      visible: () => request('/announcements/visible'),
      all: (params) => request('/announcements', { params }),
      get: (id) => request(`/announcements/${id}`),
      create: (payload) => request('/announcements', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/announcements/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),
    },

    // ── Receipts ──────────────────────────────────────────
    receipts: {
      upload: (formData) => request('/receipts', { method: 'POST', body: formData, isForm: true }),
      mine: (params) => request('/receipts/my', { params }),
      all: (params) => request('/receipts', { params }),
      get: (id) => request(`/receipts/${id}`),
      approve: (id, adminNotes) => request(`/receipts/${id}/approve`, { method: 'PUT', body: { adminNotes } }),
      reject: (id, adminNotes) => request(`/receipts/${id}/reject`, { method: 'PUT', body: { adminNotes } }),
    },

    // ── Payment Accounts ──────────────────────────────────
    paymentAccounts: {
      active: () => request('/payment-accounts/active'),
      all: () => request('/payment-accounts'),
      create: (payload) => request('/payment-accounts', { method: 'POST', body: payload }),
      update: (id, payload) => request(`/payment-accounts/${id}`, { method: 'PUT', body: payload }),
      remove: (id) => request(`/payment-accounts/${id}`, { method: 'DELETE' }),
      toggle: (id) => request(`/payment-accounts/${id}/toggle`, { method: 'PUT' }),
    },

    // ── Notifications ─────────────────────────────────────
    notifications: {
      list: (params) => request('/notifications', { params }),
      unreadCount: () => request('/notifications/unread-count'),
      markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
      markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
      remove: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
    },

    // ── Admin (members) ───────────────────────────────────
    admin: {
      members: (params) => request('/admin/members', { params }),
      member: (id) => request(`/admin/members/${id}`),
      updateMember: (id, payload) => request(`/admin/members/${id}`, { method: 'PUT', body: payload }),
      toggleMemberStatus: (id) => request(`/admin/members/${id}/status`, { method: 'PUT' }),
      deleteMember: (id) => request(`/admin/members/${id}`, { method: 'DELETE' }),
      auditLogs: (params) => request('/admin/audit-logs', { params }),
    },

    // ── Analytics ─────────────────────────────────────────
    analytics: {
      overview: () => request('/analytics'),
      department: () => request('/analytics/department'),
      monthly: (year) => request('/analytics/monthly', { params: { year } }),
    },
  };

  global.LBSM_API = api;
})(window);
