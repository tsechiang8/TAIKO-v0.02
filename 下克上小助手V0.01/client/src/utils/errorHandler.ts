/**
 * 统一错误处理工具
 * Requirements: 13.1 - 错误处理统一
 */

import { ApiResponse } from '../types';

// 错误类型
export type ErrorType = 
  | 'network'      // 网络错误
  | 'auth'         // 认证错误
  | 'permission'   // 权限错误
  | 'validation'   // 验证错误
  | 'notFound'     // 资源不存在
  | 'locked'       // 游戏锁定
  | 'server'       // 服务器错误
  | 'unknown';     // 未知错误

// 错误信息
export interface AppError {
  type: ErrorType;
  message: string;
  code?: number;
  details?: Record<string, unknown>;
}

// 错误回调类型
export type ErrorCallback = (error: AppError) => void;

// 全局错误处理器
let globalErrorHandler: ErrorCallback | null = null;

/**
 * 设置全局错误处理器
 */
export function setGlobalErrorHandler(handler: ErrorCallback): void {
  globalErrorHandler = handler;
}

/**
 * 清除全局错误处理器
 */
export function clearGlobalErrorHandler(): void {
  globalErrorHandler = null;
}

/**
 * 根据HTTP状态码判断错误类型
 */
export function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 401) return 'auth';
  if (status === 403) return 'permission';
  if (status === 404) return 'notFound';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * 根据错误消息判断错误类型
 */
export function getErrorTypeFromMessage(message: string): ErrorType {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('网络') || lowerMessage.includes('network')) {
    return 'network';
  }
  if (lowerMessage.includes('认证') || lowerMessage.includes('登录') || lowerMessage.includes('会话')) {
    return 'auth';
  }
  if (lowerMessage.includes('权限') || lowerMessage.includes('无权')) {
    return 'permission';
  }
  if (lowerMessage.includes('锁定')) {
    return 'locked';
  }
  if (lowerMessage.includes('不存在') || lowerMessage.includes('未找到')) {
    return 'notFound';
  }
  
  return 'unknown';
}

/**
 * 创建应用错误对象
 */
export function createAppError(
  message: string,
  type?: ErrorType,
  code?: number,
  details?: Record<string, unknown>
): AppError {
  return {
    type: type || getErrorTypeFromMessage(message),
    message,
    code,
    details,
  };
}

/**
 * 处理API响应错误
 */
export function handleApiError<T>(
  response: ApiResponse<T>,
  customHandler?: ErrorCallback
): T | null {
  if (response.success && response.data !== undefined) {
    return response.data;
  }

  const error = createAppError(
    response.error || '操作失败',
    getErrorTypeFromMessage(response.error || '')
  );

  // 优先使用自定义处理器
  if (customHandler) {
    customHandler(error);
  } else if (globalErrorHandler) {
    globalErrorHandler(error);
  }

  return null;
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case 'network':
      return '网络连接失败，请检查网络后重试';
    case 'auth':
      return '登录已过期，请重新登录';
    case 'permission':
      return '您没有权限执行此操作';
    case 'locked':
      return '游戏已被锁定，请等待管理员解锁';
    case 'notFound':
      return '请求的资源不存在';
    case 'validation':
      return error.message || '输入数据有误，请检查后重试';
    case 'server':
      return '服务器错误，请稍后重试';
    default:
      return error.message || '操作失败，请重试';
  }
}

/**
 * 判断是否需要重新登录
 */
export function shouldRelogin(error: AppError): boolean {
  return error.type === 'auth';
}

/**
 * 判断是否可以重试
 */
export function canRetry(error: AppError): boolean {
  return error.type === 'network' || error.type === 'server';
}
