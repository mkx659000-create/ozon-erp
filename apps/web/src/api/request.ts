import axios from 'axios';
import { message } from 'ant-design-vue';

const request = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const storeId = localStorage.getItem('active_store_id');
  if (storeId) {
    config.headers['X-Store-Account-Id'] = storeId;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 0) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (error.code !== 'ERR_NETWORK' && error.response) {
      const msg =
        error.response?.data?.message || error.message || '网络错误';
      message.error(msg);
    }
    return Promise.reject(error);
  },
);

export default request;
