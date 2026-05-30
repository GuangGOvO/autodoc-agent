// 聊天窗口主组件 — Supabase 持久化、会话恢复、追问

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, RotateCcw, MessageSquareQuote, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage } from '@/types/diagnosis';
import {
  createDiagnosisSession,
  updateDiagnosisSession,
  getDiagnosisSessionById,
  getVehicleById,
  addMessageToSession,
} from '@/lib/storage';
import { isDiagnosisReport } from '@/lib/reportParser';
import { apiFetch } from '@/lib/apiClient';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatWindow() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const resumeSessionId = searchParams.get('sessionId');
  const followUpSessionId = searchParams.get('followUpSessionId');
  const quickSymptom = searchParams.get('symptom');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vehicleName, setVehicleName] = useState<string>('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [followUpMode, setFollowUpMode] = useState(false);
  const [followUpContext, setFollowUpContext] = useState<string>('');
  const [followUpSummary, setFollowUpSummary] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  // 用于首页快速体验：存储待自动发送的症状
  const pendingSymptomRef = useRef<string | null>(null);
  const initDoneRef = useRef(false);

  // 初始化：处理 URL 参数（所有 storage 调用均 async）
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const init = async () => {
      if (vehicleId) {
        const vehicle = await getVehicleById(vehicleId);
        if (vehicle) {
          setVehicleName(`${vehicle.brand} ${vehicle.series} ${vehicle.year || ''}`);
        }
      }

      // 优先级：followUpSessionId > sessionId > quickSymptom > 新建（默认）
      if (followUpSessionId) {
        // 追问模式：加载原会话的诊断报告
        const original = await getDiagnosisSessionById(followUpSessionId);
        if (original) {
          const reportMsg = [...original.messages].reverse().find(
            m => m.role === 'assistant' && isDiagnosisReport(m.content)
          );
          const reportContent = reportMsg?.content || '';
          setFollowUpContext(reportContent);
          setFollowUpSummary(original.initialSymptom.slice(0, 30));
          setFollowUpMode(true);
        }
      } else if (resumeSessionId) {
        // 恢复模式：从 /history 页面点击"继续问诊"进入
        const existing = await getDiagnosisSessionById(resumeSessionId);
        if (existing && existing.status === 'in_progress') {
          setSessionId(resumeSessionId);
          setMessages(existing.messages);
          setTurnCount(existing.messages.filter(m => m.role === 'user').length);
        }
      } else if (quickSymptom) {
        // 首页快速体验：使用通用车型，自动发送症状
        setVehicleName('通用车型');
        pendingSymptomRef.current = quickSymptom;
      }
      // 默认：不做自动恢复，用户从 /history 进入恢复旧会话
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 首页快速体验：自动发送 pendingSymptom
  useEffect(() => {
    const pending = pendingSymptomRef.current;
    if (pending && !isLoading && messages.length === 0) {
      pendingSymptomRef.current = null;
      // 清除 URL 参数，避免刷新重复发送
      window.history.replaceState({}, '', '/diagnose');
      sendMessage(pending);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 智能自动滚动：检测用户是否在底部附近
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // 消息变化时，如果用户在底部附近才自动滚动
  useEffect(() => {
    if (isNearBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 标记会话完成（仅非追问模式）
  const markComplete = useCallback(async (sid: string) => {
    if (!followUpMode) {
      await updateDiagnosisSession(sid, { status: 'completed' });
      setSessionComplete(true);
    }
  }, [followUpMode]);

  // 处理 SSE 流式响应
  const handleStreamResponse = async (response: Response, assistantId: string, sid: string) => {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let fullContent = '';
    let wasAborted = false;

    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, assistantMsg]);

    try {
      while (true) {
        let done: boolean;
        let value: Uint8Array | undefined;
        try {
          const result = await reader.read();
          done = result.done;
          value = result.value;
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            wasAborted = true;
            break;
          }
          throw err;
        }
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 流完成后（或中断后），持久化消息到 Supabase
      if (fullContent) {
        const finalMsg: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: fullContent + (wasAborted ? '\n\n*(已中断)*' : ''),
          timestamp: new Date().toISOString(),
        };
        await addMessageToSession(sid, finalMsg);

        // 检测是否包含诊断报告（追问模式下不标记完成）
        if (!wasAborted && isDiagnosisReport(fullContent)) {
          await markComplete(sid);
        }
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // 发送消息（可传入文本，否则使用 input 状态）
  const sendMessage = async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    let sid = sessionId;

    // 如果是第一条消息，创建新会话
    if (!sid) {
      const symptomText = followUpMode
        ? `[追问] ${trimmed}`
        : trimmed;
      const session = await createDiagnosisSession(symptomText);
      sid = session.id;
      setSessionId(sid);
    }

    // 添加车辆信息到首条消息（非追问模式）
    let augmentedContent = trimmed;
    if (vehicleName && messages.length === 0 && !followUpMode) {
      augmentedContent = `我的车是${vehicleName}。${trimmed}`;
      userMessage.content = augmentedContent;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 持久化用户消息到 Supabase
    await addMessageToSession(sid, userMessage);

    const assistantId = generateId();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 追问模式：始终走 chat 接口，带上 followUpContext
      if (followUpMode) {
        const response = await apiFetch('/api/diagnose/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            message: trimmed,
            turnCount,
            followUpContext,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || '请求失败');
        }

        setTurnCount(prev => prev + 1);
        await handleStreamResponse(response, assistantId, sid);
      } else if (messages.length === 0) {
        // 新会话首条消息
        const response = await apiFetch('/api/diagnose/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptom: augmentedContent }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || '请求失败');
        }

        await handleStreamResponse(response, assistantId, sid);
      } else {
        const response = await apiFetch('/api/diagnose/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            message: trimmed,
            turnCount,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || '请求失败');
        }

        setTurnCount(prev => prev + 1);
        await handleStreamResponse(response, assistantId, sid);
      }
    } catch (error) {
      // AbortError 不算真正的错误（用户主动中断）
      if (error instanceof Error && error.name === 'AbortError') {
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      const errorMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: `抱歉，出现了错误：${error instanceof Error ? error.message : '请稍后重试'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // 新建对话
  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setTurnCount(0);
    setSessionComplete(false);
    setFollowUpMode(false);
    setFollowUpContext('');
    setFollowUpSummary('');
    setInput('');
    // 清除 URL 参数
    if (resumeSessionId || followUpSessionId) {
      window.history.replaceState({}, '', '/diagnose');
    }
  };

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部信息栏 */}
      {(vehicleName || sessionComplete || sessionId || followUpMode) && (
        <div className="border-b bg-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {followUpMode && followUpSummary && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
                <MessageSquareQuote className="h-3 w-3" />
                基于「{followUpSummary}」的追问
              </Badge>
            )}
            {vehicleName && (
              <Badge variant="secondary" className="gap-1">
                🚗 {vehicleName}
              </Badge>
            )}
            {sessionComplete && (
              <Badge className="bg-green-100 text-green-800 border-green-200">诊断完成</Badge>
            )}
          </div>
          {sessionId && (
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              新对话
            </button>
          )}
        </div>
      )}

      {/* 消息列表 */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-auto">
        <div className="py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {followUpMode ? (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-2">追问模式</h2>
                  <p className="text-muted-foreground max-w-md mb-6">
                    基于之前的诊断结果「{followUpSummary}」，您可以继续提问，了解更多细节。
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['维修大概需要多长时间？', '有没有更便宜的替代方案？', '这个问题会不会影响行车安全？', '去4S店还是普通修理厂好？'].map(s => (
                      <button
                        key={s}
                        className="px-3 py-1.5 text-sm rounded-full border border-border hover:bg-accent hover:text-white hover:border-accent transition-colors"
                        onClick={() => setInput(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-2">AutoDoc 智驾医生</h2>
                  <p className="text-muted-foreground max-w-md mb-6">
                    描述您的车辆问题，我将通过多轮对话帮您分析可能的故障原因、维修方案和参考价格，让您修车不踩坑。
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['冷启动发动机抖动', '刹车时有异响', '空调不制冷', '方向盘高速抖动'].map(s => (
                      <button
                        key={s}
                        className="px-3 py-1.5 text-sm rounded-full border border-border hover:bg-accent hover:text-white hover:border-accent transition-colors"
                        onClick={() => setInput(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="chat-input-area border-t bg-white p-4 sticky bottom-0">
        <div className="container mx-auto max-w-3xl">
          {/* 诊断完成提示横幅（不锁定输入） */}
          {sessionComplete && (
            <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-green-800 font-medium">✅ 诊断完成，报告已保存</p>
                <div className="flex gap-2 flex-wrap">
                  {sessionId && (
                    <a
                      href={`/diagnose/${sessionId}`}
                      className="inline-flex h-8 items-center gap-1 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      查看报告
                    </a>
                  )}
                  <button
                    onClick={() => setSessionComplete(false)}
                    className="inline-flex h-8 items-center gap-1 px-3 rounded-md bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-colors"
                  >
                    继续追问
                  </button>
                  <Button onClick={handleNewChat} variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <RotateCcw className="h-3 w-3" />
                    新对话
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 输入框始终可用 */}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                followUpMode
                  ? '输入您的追问，例如：维修大概要多久？'
                  : sessionComplete
                  ? '对诊断结果有疑问？继续提问...'
                  : '描述您的车辆问题，例如：我的车冷启动时发动机有抖动...'
              }
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              disabled={isLoading}
            />
            {isLoading ? (
              <Button
                onClick={() => abortControllerRef.current?.abort()}
                variant="destructive"
                size="icon"
                className="h-[44px] w-[44px] flex-shrink-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => sendMessage()}
                disabled={input.length === 0}
                size="icon"
                className="h-[44px] w-[44px] flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            按 Enter 发送，Shift+Enter 换行 | 诊断结果仅供参考，具体请咨询专业技师
          </p>
        </div>
      </div>
    </div>
  );
}
