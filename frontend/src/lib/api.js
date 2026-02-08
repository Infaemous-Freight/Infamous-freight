import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/sign-in') {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const loadsApi = {
  list: (params) => api.get('/loads', { params: params ? { status_filter: params.status, ...params } : undefined }),
  myLoads: () => api.get('/loads/my'),
  get: (id) => api.get(`/loads/${id}`),
  create: (data) => api.post('/loads', data),
  updateStatus: (id, status) => api.put(`/loads/${id}/status`, null, { params: { new_status: status } }),
};

export const bidsApi = {
  create: (data) => api.post('/bids', data),
  getLoadBids: (loadId) => api.get(`/loads/${loadId}/bids`),
  myBids: () => api.get('/bids/my'),
};

export const assignmentsApi = {
  book: (data) => api.post('/assignments/book', data),
  myAssignments: () => api.get('/assignments/my'),
};

export const messagesApi = {
  getThreadByLoad: (loadId) => api.get(`/threads/by-load/${loadId}`),
  getMessages: (threadId) => api.get(`/threads/${threadId}/messages`),
  send: (data) => api.post('/messages', data),
  summarize: (threadId) => api.post('/threads/summarize', { thread_id: threadId }),
};

export const ratingsApi = {
  create: (data) => api.post('/ratings', data),
  getUserRatings: (userId) => api.get(`/ratings/user/${userId}`),
};

export const disputesApi = {
  create: (data) => api.post('/disputes', data),
  myDisputes: () => api.get('/disputes/my'),
  resolve: (id, resolution) => api.put(`/disputes/${id}/resolve`, null, { params: { resolution } }),
};

export const trackingApi = {
  ping: (data) => api.post('/tracking/ping', data),
  getHistory: (assignmentId) => api.get(`/tracking/${assignmentId}`),
  getLatest: (assignmentId) => api.get(`/tracking/${assignmentId}/latest`),
};

export const documentsApi = {
  upload: (assignmentId, docType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/documents/upload?assignment_id=${assignmentId}&doc_type=${docType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (assignmentId) => api.get(`/documents/${assignmentId}`),
  get: (assignmentId, docId) => api.get(`/documents/${assignmentId}/${docId}`),
};

export const preferencesApi = {
  getLanes: () => api.get('/preferences/lanes'),
  addLane: (data) => api.post('/preferences/lanes', data),
  deleteLane: (id) => api.delete(`/preferences/lanes/${id}`),
  getMatchedLoads: () => api.get('/preferences/matched-loads'),
};

export const calculatorApi = {
  calculateRate: (data) => api.post('/calculator/rate', data),
};

export const paymentsApi = {
  getPackages: () => api.get('/packages'),
  createCheckout: (data) => api.post('/payments/checkout', data),
  getStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
  myPayments: () => api.get('/payments/my'),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMarket: () => api.get('/analytics/market'),
};

export default api;
