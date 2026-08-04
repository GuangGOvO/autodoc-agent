// POST /api/diagnose/chat - 多轮对话（流式输出）

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream } from '@/lib/llm/deepseek';
import { buildSystemPrompt, buildFollowUpPrompt, formatKnowledgeContext } from '@/lib/llm/prompts';
import { getRelevantKnowledge } from '@/lib/knowledge/matcher';
import { getServerUser } from '@/lib/serverAuth';
import type { ChatMessage } from '@/types/diagnosis';

export async function POST(request: NextRequest) {
  try {
    // 并行：解析请求体 + 验证登录状态
    const [{ user }, body] = await Promise.all([getServerUser(), request.json()]);
    if (!user) {
      return NextResponse.json({ error: '请先登录后再使用诊断功能' }, { status: 401 });
    }

    const { messages: historyMessages, message: userMessage, turnCount, followUpContext } = body as {
      messages: ChatMessage[];
      message: string;
      turnCount?: number;
      followUpContext?: string;
    };

    if (!userMessage) {
      return NextResponse.json({ error: '请输入消息内容' }, { status: 400 });
    }
    if (userMessage.length > 2000) {
      return NextResponse.json({ error: '消息内容过长，请精简到 2000 字以内' }, { status: 400 });
    }
    if (!Array.isArray(historyMessages) || historyMessages.length > 100) {
      return NextResponse.json({ error: '对话历史异常，请重新发起诊断' }, { status: 400 });
    }

    // 追问模式：基于已有诊断报告继续提问
    const isFollowUp = !!followUpContext;

    let systemPrompt: string;

    if (isFollowUp) {
      // 追问模式：用专门的追问 prompt，不限轮次
      systemPrompt = buildFollowUpPrompt(followUpContext!);

      // 追问模式也注入相关知识
      const relevantKnowledge = getRelevantKnowledge(userMessage, 3);
      if (relevantKnowledge.length > 0) {
        const knowledgeContext = formatKnowledgeContext(relevantKnowledge);
        systemPrompt += `\n\n## 相关知识参考：\n${knowledgeContext}`;
      }
    } else {
      // 正常诊断模式
      const relevantKnowledge = getRelevantKnowledge(userMessage, 5);
      const knowledgeContext = formatKnowledgeContext(relevantKnowledge);
      systemPrompt = buildSystemPrompt(knowledgeContext);

      // 基于轮次控制报告输出
      const currentTurn = turnCount || 0;
      if (currentTurn < 2) {
        // 前2轮：强制追问，不允许输出报告
        systemPrompt += '\n\n【重要】当前对话轮次不足，你还不能输出诊断报告。请继续追问用户更多细节（车型、症状条件、持续时间、伴随症状等）。绝对不要在此回复中输出诊断报告格式的内容。';
      } else if (currentTurn >= 3) {
        // 3轮及以上：强制输出报告
        systemPrompt += '\n\n【重要】你已经追问了足够多的信息，现在请根据已收集到的信息直接输出诊断报告。不要再追问了。请直接输出 Markdown 格式的诊断报告，不要用代码块包裹。';
      }
      // turnCount == 2: 不添加额外指令，LLM 自行判断是否信息足够
    }

    // 构建完整消息列表
    const apiMessages = [
      { role: 'system' as const, content: systemPrompt },
      // 历史消息
      ...historyMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      // 当前用户消息
      { role: 'user' as const, content: userMessage },
    ];

    // 流式调用
    const stream = await chatCompletionStream({ messages: apiMessages });

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
    console.error('Diagnose chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '对话失败，请稍后重试' },
      { status: 500 }
    );
  }
}
