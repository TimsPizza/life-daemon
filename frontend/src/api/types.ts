// API 响应的通用接口
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  responseObject?: T;
}

// 订阅请求参数接口
export interface SubscriptionRequest {
  preferredName: string;
  email: string;
  birthdate: string;
  preferredLanguage: 'en' | 'fr' | 'cn' | 'jp';
  timeOffset: number;
}

// 订阅响应接口
export interface SubscriptionResponse {
  isActive: boolean;
  email: string;
  _id?: string;        // ID field returned after creation
  token?: string;      // Token field returned after creation
  subscriptionDate?: string;  // Subscription date
  operation?: 'activated' | 'unsubscribed' | 'suspended';  // Operation type for status changes
  lastSent?: string;   // Last notification sent date
}
