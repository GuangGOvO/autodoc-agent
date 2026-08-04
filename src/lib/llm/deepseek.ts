// DeepSeek API 调用封装 — 原生 Responses API
// 端点：{base}/responses；流式事件：response.output_text.delta / response.completed

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
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const RESPONSES_ENDPOINT = `${DEEPSEEK_BASE_URL}/responses`;

// 启动时校验 API Key
if (!DEEPSEEK_API_KEY) {
  console.warn('[DeepSeek] ⚠️ DEEPSEEK_API_KEY 未设置，LLM 功能将不可用');
} else {
  console.log(`[DeepSeek] 已配置 — 模型: ${DEEPSEEK_MODEL}, 地址: ${RESPONSES_ENDPOINT}`);
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
 * 将 Chat Completions 风格消息转换为 Responses API 请求体
 * - 第一条 system 消息 → instructions（插到最前面）
 * - 其余消息 → input 列表
 * - maxTokens → max_output_tokens
 */
function buildResponsesBody(
  messages: ChatCompletionMessage[],
  temperature: number,
  maxTokens: number,
  stream: boolean
): Record<string, unknown> {
  const systemMessage = messages.find(m => m.role === 'system');
  const input = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: DEEPSEEK_MODEL,
    input,
    temperature,
    max_output_tokens: maxTokens,
    stream,
  };

  if (systemMessage?.content) {
    body.instructions = systemMessage.content;
  }

  return body;
}

/**
 * 统一的非流式/流式请求入口（连接阶段 60s 超时）
 */
async function postResponses(body: Record<string, unknown>, timeoutMs: number): Promise<Response> {
  const response = await fetch(RESPONSES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: createTimeoutSignal(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DeepSeek] API 错误:', response.status, errorText);
    if (response.status === 401) throw new Error('API Key 无效，请检查 DEEPSEEK_API_KEY 配置');
    if (response.status === 404) throw new Error(`模型 "${DEEPSEEK_MODEL}" 不存在，请检查 DEEPSEEK_MODEL 配置`);
    if (response.status === 429) throw new Error('API 调用频率超限，请稍后重试');
    if (response.status === 400) {
      throw new Error('请求参数有误或超出上下文长度，请精简对话后重试');
    }
    throw new Error(`LLM 服务调用失败 (${response.status})，请稍后重试`);
  }

  return response;
}

/**
 * 非流式调用 DeepSeek Responses API
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<string> {
  const { messages, temperature = 0.7, maxTokens = 2000, timeoutMs = 60000 } = options;

  let response: Response;
  try {
    response = await postResponses(
      buildResponsesBody(messages, temperature, maxTokens, false),
      timeoutMs
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`LLM 服务连接超时（${timeoutMs / 1000}秒），请检查网络或 API 配置`);
    }
    throw err;
  }

  const data = await response.json();
  return data.output_text || '';
}

/**
 * 流式调用 DeepSeek Responses API，返回 ReadableStream
 * 含超时保护：连接阶段 60s 超时，流式阶段单 chunk 60s 超时
 *
 * 事件约定（无 data: [DONE]）：
 * - response.output_text.delta  → 增量文本（delta 字段）
 * - response.completed / response.incomplete → 正常结束
 * - response.failed → 携带错误信息
 */
export async function chatCompletionStream(
  options: ChatCompletionOptions
): Promise<ReadableStream<string>> {
  const { messages, temperature = 0.7, maxTokens = 2000, timeoutMs = 60000 } = options;

  let response: Response;
  try {
    response = await postResponses(
      buildResponsesBody(messages, temperature, maxTokens, true),
      timeoutMs
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`LLM 服务连接超时（${timeoutMs / 1000}秒），请检查网络或 API 配置`);
    }
    throw new Error(`LLM 服务连接失败：${err instanceof Error ? err.message : '未知错误'}`);
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

  function stopChunkTimer() {
    if (chunkTimer) {
      clearTimeout(chunkTimer);
      chunkTimer = null;
    }
  }

  return new ReadableStream<string>({
    async start(controller) {
      resetChunkTimer(controller);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            stopChunkTimer();
            controller.close();
            return;
          }

          resetChunkTimer(controller); // 每收到一个 chunk 重置计时器

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);

            // 兼容兜底：个别网关仍发送 [DONE]
            if (data === '[DONE]') {
              stopChunkTimer();
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const type = parsed.type || '';

              // 增量文本
              if (type === 'response.output_text.delta' && parsed.delta) {
                controller.enqueue(parsed.delta);
                continue;
              }

              // 正常结束（无 [DONE]）
              if (type === 'response.completed' || type === 'response.incomplete') {
                stopChunkTimer();
                controller.close();
                return;
              }

              // 失败事件
              if (type === 'response.failed') {
                console.error('[DeepSeek] 流式失败:', parsed.error);
                controller.enqueue(`\n\n[错误: ${parsed.error?.message || '生成失败，请重试'}]`);
                stopChunkTimer();
                controller.close();
                return;
              }

              // 通用错误兜底
              if (parsed.error) {
                console.error('[DeepSeek] 流式错误:', parsed.error);
                controller.enqueue(`\n\n[错误: ${parsed.error.message || '未知错误'}]`);
                stopChunkTimer();
                controller.close();
                return;
              }
            } catch {
              // 忽略 JSON 解析错误（不完整的 chunk）
            }
          }
        }
      } catch (error) {
        stopChunkTimer();
        console.error('[DeepSeek] 流读取异常:', error);
        controller.close();
      }
    },
    cancel() {
      stopChunkTimer();
      reader.cancel();
    },
  });
}
