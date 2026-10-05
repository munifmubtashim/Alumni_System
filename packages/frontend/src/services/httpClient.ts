import axios from 'axios';
import { getToken } from './authToken';

export const httpClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
});

// The only place the auth header is attached.
httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// No response interceptor: 401 handling (logout/redirect) belongs to the auth REQ.
