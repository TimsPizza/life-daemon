import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// 创建 axios 实例
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 从环境变量获取基础 URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 在这里可以添加认证令牌等通用请求头
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果需要，可以在这里统一处理响应数据
    return response.data;
  },
  (error: AxiosError) => {
    // 统一处理错误响应
    if (error.response?.data) {
      return Promise.reject(new Error((error.response.data as any).message || '请求失败'));
    }
    return Promise.reject(error);
  },
);

export default http;
