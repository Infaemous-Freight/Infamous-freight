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
  list: (status) => api.get('/loads', { params: { status } }),
  myLoads: () => api.get('/loads/my'),
  get: (id) => api.get(`/loads/${id}`),
  create: (data) => api.post('/loads', data),
  updateStatus: (id, status) => api.put(`/loads/${id}/status`, null, { params: { status } }),
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

export default api;
