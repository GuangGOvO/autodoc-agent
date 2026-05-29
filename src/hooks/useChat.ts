// useChat — 对话状态管理 Hook

'use client';

import { useState, useRef, useCallback } from 'react';
import type { ChatMessage } from '@/types/diagnosis';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 处理 SSE 流式响应，逐字更新 assistant 消息
   */
  const handleStreamResponse = useCallback(
    async (response: Response, assistantId: string) => {
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullContent = '';

      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        },
      ]);

      try {
        while (true) {
          const { done, value } = await reader.read();
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
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      const assistantId = generateId();

      try {
        if (messages.length === 0) {
          const response = await fetch('/api/diagnose/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptom: trimmed }),
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || '请求失败');
          }

          await handleStreamResponse(response, assistantId);
        } else {
          const response = await fetch('/api/diagnose/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              message: trimmed,
              turnCount,
            }),
          });

          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || '请求失败');
          }

          setTurnCount(prev => prev + 1);
          await handleStreamResponse(response, assistantId);
        }
      } catch (error) {
        setIsLoading(false);
        setMessages(prev => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: `抱歉，出现了错误：${error instanceof Error ? error.message : '请稍后重试'}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    [messages, isLoading, turnCount, handleStreamResponse]
  );

  /**
   * 重置对话
   */
  const resetChat = useCallback(() => {
    setMessages([]);
    setTurnCount(0);
    setIsLoading(false);
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    isLoading,
    turnCount,
    sendMessage,
    resetChat,
  };
}
