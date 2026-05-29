// 智能问诊对话页

import { Suspense } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function DiagnosePage() {
  return (
    <div className="chat-container h-[calc(100vh-8rem)]">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        }
      >
        <ChatWindow />
      </Suspense>
    </div>
  );
}
