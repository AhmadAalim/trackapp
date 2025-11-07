import axios from 'axios';

// Automatically detect API URL based on environment
const getApiBaseUrl = () => {
  // If custom API URL is set, use it (for public sharing)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For local development, use localhost
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to handle FormData correctly
api.interceptors.request.use((config) => {
  // Remove Content-Type header for FormData - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Inventory API
export const inventoryAPI = {
  getAll: (search) => {
    const params = search ? { search } : {};
    return api.get('/inventory', { params });
  },
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  deleteAll: () => api.delete('/inventory/all'),
  getLowStock: () => api.get('/inventory/alerts/low-stock'),
  uploadImage: (formData) => {
    // Content-Type will be set automatically by axios interceptor
    return api.post('/inventory/upload-image', formData);
  },
  importExcel: (formData) => {
    // Content-Type will be set automatically by axios interceptor
    return api.post('/inventory/import-excel', formData);
  },
};

// Sales API
export const salesAPI = {
  getAll: () => api.get('/sales'),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
};

// Employees API
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSalesReport: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/reports/sales', { params });
  },
};

// Finances API (Income/Expense)
export const financesAPI = {
  getAll: (type, startDate, endDate) => {
    const params = {};
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/finances', { params });
  },
  getById: (id) => api.get(`/finances/${id}`),
  create: (data) => api.post('/finances', data),
  update: (id, data) => api.put(`/finances/${id}`, data),
  delete: (id) => api.delete(`/finances/${id}`),
  getStats: (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get('/finances/summary/stats', { params });
  },
};

// Excel Browser API
export const excelBrowserAPI = {
  uploadAndParse: (formData) => {
    return api.post('/excel-browser/parse', formData);
  },
  getHistory: () => api.get('/excel-browser/history'),
  getHistoryEntry: (id) => api.get(`/excel-browser/history/${id}`),
};

export const stickersAPI = {
  generate: ({ size, format }) =>
    api.post(
      '/generate-stickers',
      { size, format },
      { responseType: 'blob' }
    ),
};

export default api;
