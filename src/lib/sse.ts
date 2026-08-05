// SSE 响应公共封装：统一流式响应头，避免各路由重复且遗漏

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      // 关闭 Nginx 等反代的响应缓冲，保证打字机效果实时输出
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
