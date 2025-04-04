import http from '@/utils/http';
import { ApiResponse, SubscriptionRequest, SubscriptionResponse } from './types';

export const subscriptionApi = {
  /**
   * 创建新订阅
   * @param data 订阅信息
   */
  createSubscription: async (data: SubscriptionRequest): Promise<ApiResponse<SubscriptionResponse>> => {
    return http.post('/subscriptions/new', data);
  },

  /**
   * 激活订阅
   * @param id 订阅ID
   * @param token 激活令牌
   */
  activateSubscription: async (id: string, token: string): Promise<ApiResponse<SubscriptionResponse>> => {
    return http.get(`/subscriptions/activate/${id}/${token}`);
  },

  /**
   * 获取订阅状态
   * @param id 订阅ID
   * @param token 访问令牌
   */
  getSubscriptionStatus: async (id: string, token: string): Promise<ApiResponse<SubscriptionResponse>> => {
    return http.get(`/subscriptions/status/${id}/${token}`);
  },

  /**
   * 取消订阅
   * @param id 订阅ID
   * @param token 访问令牌
   */
  cancelSubscription: async (id: string, token: string): Promise<ApiResponse<SubscriptionResponse>> => {
    return http.post(`/subscriptions/unsubscribe/${id}/${token}`);
  },

  /**
   * 暂停订阅
   * @param id 订阅ID
   * @param token 访问令牌
   * @param days 暂停天数
   */
  suspendSubscription: async (
    id: string, 
    token: string, 
    days: number
  ): Promise<ApiResponse<SubscriptionResponse>> => {
    return http.post(`/subscriptions/suspend/${id}/${token}`, { days });
  },
};
