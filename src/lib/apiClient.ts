// 统一的 API 请求封装 — 处理 401 自动跳转登录

/**
 * 封装 fetch，统一处理 401 未授权响应
 * 当 API 返回 401 时，自动跳转到登录页（保留当前路径作为 redirect 参数）
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401) {
    // 提取当前路径作为 redirect 参数
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    // 返回一个永不 resolve 的 promise，阻止后续代码继续执行
    return new Promise(() => {});
  }

  return response;
}
