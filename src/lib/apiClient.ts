// 统一的 API 请求封装 — 处理 401 自动跳转登录

/** 401 时派发的全局事件，由 AuthProvider 监听并跳转登录页 */
export const UNAUTHORIZED_EVENT = 'autodoc-unauthorized';
/** sessionStorage 中暂存的目标路径，登录后跳回 */
export const UNAUTHORIZED_REDIRECT_KEY = 'autodoc_redirect_after_login';

/**
 * 封装 fetch，统一处理 401 未授权响应
 * 当 API 返回 401 时，自动跳转到登录页（保留当前路径作为 redirect 参数）
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401 && typeof window !== 'undefined') {
    // 提取当前路径作为 redirect 参数
    const currentPath = window.location.pathname + window.location.search;
    if (!currentPath.startsWith('/login')) {
      window.sessionStorage.setItem(UNAUTHORIZED_REDIRECT_KEY, currentPath);
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    // 抛错让调用方正常走 catch，避免挂起；跳转由 AuthProvider 统一处理
    throw new Error('登录状态已过期，请重新登录');
  }

  return response;
}
