// 消息气泡组件 — 诊断报告自动展开为全宽视图

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/types/diagnosis';
import { isDiagnosisReport, parseDiagnosisReport } from '@/lib/reportParser';
import { DiagnosisReportView } from '@/components/report/DiagnosisReportView';

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * 去掉 LLM 输出中可能包裹的代码块围栏（```markdown ... ```）
 * 保留内部 Markdown 内容，让 ReactMarkdown 正常渲染
 */
function unwrapCodeFences(content: string): string {
  const match = content.match(/^```\w*\n([\s\S]*?)\n```\s*$/);
  if (match) return match[1];
  return content;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : unwrapCodeFences(message.content);

  // 如果是 AI 回复且包含完整诊断报告，渲染为全宽结构化视图
  if (!isUser && isDiagnosisReport(message.content)) {
    const parsed = parseDiagnosisReport(message.content);
    return (
      <div className="px-4 py-3">
        {/* AI 头像 + 标签 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white flex-shrink-0">
            <Bot className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-accent">诊断报告</span>
        </div>
        <DiagnosisReportView report={parsed} rawMarkdown={message.content} />
      </div>
    );
  }

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div
        className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${
          isUser ? 'bg-primary text-white' : 'bg-accent text-white'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* 消息内容 */}
      <div
        className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-3 overflow-hidden ${
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{displayContent}</p>
        ) : (
          <div className="chat-markdown overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
