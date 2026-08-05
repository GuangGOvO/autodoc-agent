// POST /api/diagnose/start - 开始新的诊断会话

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream } from '@/lib/llm/deepseek';
import { buildSystemPrompt, formatKnowledgeContext, buildGreetingPrompt } from '@/lib/llm/prompts';
import { getRelevantKnowledge } from '@/lib/knowledge/matcher';
import { getServerUser } from '@/lib/serverAuth';
import { getClientIp, hitRateLimit, rateLimitedResponse } from '@/lib/rateLimit';
import { sseResponse } from '@/lib/sse';

export async function POST(request: NextRequest) {
  try {
    // 并行：解析请求体 + 验证登录状态
    const [{ user }, body] = await Promise.all([getServerUser(), request.json()]);
    if (!user) {
      return NextResponse.json({ error: '请先登录后再使用诊断功能' }, { status: 401 });
    }

    // 限流：LLM 调用消耗 API 余额，按用户 10 次/分钟 + 按 IP 30 次/分钟
    const perUser = hitRateLimit({ scope: 'diagnose:start:user', key: user.id, limit: 10 });
    if (perUser.limited) return rateLimitedResponse(perUser.retryAfterSec);
    const perIp = hitRateLimit({ scope: 'diagnose:start:ip', key: getClientIp(request), limit: 30 });
    if (perIp.limited) return rateLimitedResponse(perIp.retryAfterSec);

    const { symptom } = body as { symptom?: string };
    if (symptom && symptom.length > 1000) {
      return NextResponse.json({ error: '症状描述过长，请精简到 1000 字以内' }, { status: 400 });
    }

    // 获取相关知识
    const relevantKnowledge = symptom ? getRelevantKnowledge(symptom, 5) : [];
    const knowledgeContext = formatKnowledgeContext(relevantKnowledge);

    // 构建消息
    const systemPrompt = buildSystemPrompt(knowledgeContext);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: symptom ? `${buildGreetingPrompt()}\n\n用户说：${symptom}` : buildGreetingPrompt() },
    ];

    // 流式调用
    const stream = await chatCompletionStream({ messages });

    // 转换为 SSE 格式
    const encoder = new TextEncoder();
    const sseStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: value })}\n\n`));
          }
        } catch {
          controller.close();
        }
      },
    });

    return sseResponse(sseStream);
  } catch (error) {
    console.error('Diagnose start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '诊断启动失败，请稍后重试' },
      { status: 500 }
    );
  }
}
