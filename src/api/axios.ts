import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? '';

    const isAuthEndpoint = url.includes('/api/auth/login');

    if (status === 401 && !isAuthEndpoint) {
      window.dispatchEvent(new Event('app:logout'));
    } else if (status === 403) {
      // (propaga el error para que el caller lo maneje)
    }

    return Promise.reject(error);
  }
);


export default api;
