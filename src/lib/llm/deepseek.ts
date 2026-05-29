// DeepSeek API 调用封装

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatCompletionMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timeoutMs?: number;  // 请求超时（毫秒），默认60秒
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// 启动时校验 API Key
if (!DEEPSEEK_API_KEY) {
  console.warn('[DeepSeek] ⚠️ DEEPSEEK_API_KEY 未设置，LLM 功能将不可用');
} else {
  console.log(`[DeepSeek] 已配置 — 模型: ${DEEPSEEK_MODEL}, 地址: ${DEEPSEEK_BASE_URL}`);
}

/**
 * 创建带超时的 AbortSignal
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

/**
 * 非流式调用 DeepSeek API
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<string> {
  const { messages, temperature = 0.7, maxTokens = 2000, timeoutMs = 60000 } = options;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: createTimeoutSignal(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DeepSeek] API 错误:', response.status, errorText);
    if (response.status === 401) throw new Error('API Key 无效，请检查 DEEPSEEK_API_KEY 配置');
    if (response.status === 404) throw new Error(`模型 "${DEEPSEEK_MODEL}" 不存在，请检查 DEEPSEEK_MODEL 配置`);
    if (response.status === 429) throw new Error('API 调用频率超限，请稍后重试');
    throw new Error(`LLM 服务调用失败 (${response.status})，请稍后重试`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 流式调用 DeepSeek API，返回 ReadableStream
 * 含超时保护：连接阶段 60s 超时，流式阶段单 chunk 60s 超时
 */
export async function chatCompletionStream(
  options: ChatCompletionOptions
): Promise<ReadableStream<string>> {
  const { messages, temperature = 0.7, maxTokens = 2000, timeoutMs = 60000 } = options;

  // 连接阶段超时
  const connectSignal = createTimeoutSignal(timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: connectSignal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`LLM 服务连接超时（${timeoutMs / 1000}秒），请检查网络或 API 配置`);
    }
    throw new Error(`LLM 服务连接失败：${err instanceof Error ? err.message : '未知错误'}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DeepSeek] API 错误:', response.status, errorText);
    if (response.status === 401) throw new Error('API Key 无效，请检查 DEEPSEEK_API_KEY 配置');
    if (response.status === 404) throw new Error(`模型 "${DEEPSEEK_MODEL}" 不存在，请检查 DEEPSEEK_MODEL 配置`);
    if (response.status === 429) throw new Error('API 调用频率超限，请稍后重试');
    throw new Error(`LLM 服务调用失败 (${response.status})，请稍后重试`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  const CHUNK_TIMEOUT = timeoutMs; // 每个 chunk 的超时
  let chunkTimer: ReturnType<typeof setTimeout> | null = null;

  function resetChunkTimer(controller: ReadableStreamDefaultController<string>) {
    if (chunkTimer) clearTimeout(chunkTimer);
    chunkTimer = setTimeout(() => {
      console.error('[DeepSeek] 流式响应超时（chunk间隔过长）');
      controller.enqueue('\n\n[响应超时，请重试]');
      controller.close();
    }, CHUNK_TIMEOUT);
  }

  return new ReadableStream<string>({
    async start(controller) {
      resetChunkTimer(controller);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (chunkTimer) clearTimeout(chunkTimer);
            controller.close();
            return;
          }

          resetChunkTimer(controller); // 每收到一个 chunk 重置计时器

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                if (chunkTimer) clearTimeout(chunkTimer);
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                // 检查是否有错误信息
                if (parsed.error) {
                  console.error('[DeepSeek] 流式错误:', parsed.error);
                  controller.enqueue(`\n\n[错误: ${parsed.error.message || '未知错误'}]`);
                  controller.close();
                  return;
                }
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(content);
                }
              } catch {
                // 忽略 JSON 解析错误（不完整的 chunk）
              }
            }
          }
        }
      } catch (error) {
        if (chunkTimer) clearTimeout(chunkTimer);
        console.error('[DeepSeek] 流读取异常:', error);
        controller.close();
      }
    },
    cancel() {
      if (chunkTimer) clearTimeout(chunkTimer);
      reader.cancel();
    },
  });
}
