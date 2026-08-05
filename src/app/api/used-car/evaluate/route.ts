// POST /api/used-car/evaluate - 二手车评估（流式输出）

import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream } from '@/lib/llm/deepseek';
import { buildUsedCarPrompt } from '@/lib/llm/prompts';
import { getServerUser } from '@/lib/serverAuth';
import type { UsedCarInput } from '@/types/usedCar';
import { getClientIp, hitRateLimit, rateLimitedResponse } from '@/lib/rateLimit';
import { sseResponse } from '@/lib/sse';

export async function POST(request: NextRequest) {
  try {
    // 并行：解析请求体 + 验证登录状态
    const [{ user }, body] = await Promise.all([getServerUser(), request.json()]);
    if (!user) {
      return NextResponse.json({ error: '请先登录后再使用评估功能' }, { status: 401 });
    }

    // 限流：按用户 10 次/分钟 + 按 IP 30 次/分钟
    const perUser = hitRateLimit({ scope: 'used-car:user', key: user.id, limit: 10 });
    if (perUser.limited) return rateLimitedResponse(perUser.retryAfterSec);
    const perIp = hitRateLimit({ scope: 'used-car:ip', key: getClientIp(request), limit: 30 });
    if (perIp.limited) return rateLimitedResponse(perIp.retryAfterSec);

    const input = body as UsedCarInput;

    // 校验必填字段
    if (!input.brand || !input.series || !input.year) {
      return NextResponse.json(
        { error: '请填写完整的车辆信息（品牌、车系、年款）' },
        { status: 400 }
      );
    }

    if (!input.description || input.description.trim().length < 5) {
      return NextResponse.json(
        { error: '请提供至少5个字的卖家描述' },
        { status: 400 }
      );
    }
    if (input.description.length > 4000) {
      return NextResponse.json({ error: '卖家描述过长，请精简到 4000 字以内' }, { status: 400 });
    }
    if (input.mileage !== undefined && (!Number.isFinite(input.mileage) || input.mileage < 0)) {
      return NextResponse.json({ error: '里程格式不正确' }, { status: 400 });
    }
    if (input.askingPrice !== undefined && (!Number.isFinite(input.askingPrice) || input.askingPrice < 0)) {
      return NextResponse.json({ error: '报价格式不正确' }, { status: 400 });
    }

    // 构建用户描述
    // 文本字段统一截断，防止超长输入挤爆上下文
    const brand = String(input.brand || '').slice(0, 100);
    const series = String(input.series || '').slice(0, 100);
    const year = String(input.year || '').slice(0, 20);

    const userPrompt = `请帮我评估一辆二手车：

品牌：${brand}
车系：${series}
年款：${year}
表显里程：${input.mileage}万公里
卖家报价：${input.askingPrice}万元${input.transferCount !== undefined ? `\n过户次数：${input.transferCount}次` : ''}${input.color ? `\n颜色：${input.color}` : ''}

卖家描述：
${input.description}

请给出详细的车况评估报告。`;

    // 构建消息
    const systemPrompt = buildUsedCarPrompt();
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    // 流式调用
    const stream = await chatCompletionStream({ messages, maxTokens: 2500 });

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
    console.error('Used car evaluate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '评估失败，请稍后重试' },
      { status: 500 }
    );
  }
}
