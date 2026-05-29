// 全局错误处理

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mx-auto mb-6">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold mb-3">出现了一些问题</h1>
      <p className="text-muted-foreground mb-2">
        应用遇到了一个错误，请尝试刷新页面。
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono mb-6">
          错误代码：{error.digest}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={reset} className={buttonVariants()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          重试
        </button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          <Home className="mr-2 h-4 w-4" />
          返回首页
        </Link>
      </div>

      <div className="mt-8 bg-muted/50 rounded-lg p-4 text-left">
        <p className="text-xs text-muted-foreground mb-1 font-medium">错误详情（仅供调试）：</p>
        <p className="text-xs text-muted-foreground font-mono break-all">
          {error.message || 'Unknown error'}
        </p>
      </div>
    </div>
  );
}
