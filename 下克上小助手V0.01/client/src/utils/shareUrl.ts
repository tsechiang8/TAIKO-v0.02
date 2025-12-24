/**
 * URL分享功能
 * Requirements: 13.2, 13.3 - 生成可分享链接，链接访问验证
 */

/**
 * 分享链接参数
 */
export interface ShareParams {
  code?: string;      // 登录代码（可选，用于快速登录）
  view?: string;      // 视图类型
  factionId?: string; // 势力ID（管理员查看特定势力）
}

/**
 * 从URL获取分享参数
 */
export function getShareParamsFromUrl(): ShareParams {
  const params = new URLSearchParams(window.location.search);
  
  return {
    code: params.get('code') || undefined,
    view: params.get('view') || undefined,
    factionId: params.get('faction') || undefined,
  };
}

/**
 * 生成分享链接
 * @param params 分享参数
 * @returns 完整的分享URL
 */
export function generateShareUrl(params: ShareParams): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const searchParams = new URLSearchParams();
  
  if (params.code) {
    searchParams.set('code', params.code);
  }
  if (params.view) {
    searchParams.set('view', params.view);
  }
  if (params.factionId) {
    searchParams.set('faction', params.factionId);
  }
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * 生成基础分享链接（不含登录代码）
 * 用于分享给他人，让他们自己输入代码登录
 */
export function generateBaseShareUrl(): string {
  return window.location.origin + window.location.pathname;
}

/**
 * 生成带登录代码的分享链接
 * 注意：这会暴露登录代码，仅用于信任的分享场景
 * @param code 登录代码
 */
export function generateQuickLoginUrl(code: string): string {
  return generateShareUrl({ code });
}

/**
 * 清除URL中的分享参数
 * 登录成功后调用，避免代码暴露在URL中
 */
export function clearShareParams(): void {
  const baseUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, baseUrl);
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // 降级方案：使用传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
