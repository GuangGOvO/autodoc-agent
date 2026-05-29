// POST /api/diagnose/start - 开始新的诊断会话

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream } from '@/lib/llm/deepseek';
import { buildSystemPrompt, formatKnowledgeContext, buildGreetingPrompt } from '@/lib/llm/prompts';
import { getRelevantKnowledge } from '@/lib/knowledge/matcher';
import { getServerUser } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    // 验证登录状态
    const { user } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录后再使用诊断功能' }, { status: 401 });
    }

    const body = await request.json();
    const { symptom } = body as { symptom?: string };

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

    return new Response(sseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Diagnose start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '诊断启动失败，请稍后重试' },
      { status: 500 }
    );
  }
}
