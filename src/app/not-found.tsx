// 404 页面

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Home, FileSearch, CarFront, MessageSquare } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
        <span className="text-4xl font-bold text-primary">404</span>
      </div>
      <h1 className="text-2xl font-bold mb-3">页面未找到</h1>
      <p className="text-muted-foreground mb-8">
        您访问的页面不存在或已被移除，请检查链接是否正确。
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
        <Link href="/" className={buttonVariants()}>
          <Home className="mr-2 h-4 w-4" />
          返回首页
        </Link>
        <Link href="/diagnose" className={buttonVariants({ variant: 'outline' })}>
          <MessageSquare className="mr-2 h-4 w-4" />
          开始诊断
        </Link>
      </div>

      <div className="border-t pt-6">
        <p className="text-sm text-muted-foreground mb-4">您可能需要：</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Link href="/diagnose" className="block p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
            <MessageSquare className="h-5 w-5 text-primary mb-1" />
            <p className="text-sm font-medium">智能诊断</p>
            <p className="text-xs text-muted-foreground">AI 分析车辆故障</p>
          </Link>
          <Link href="/history" className="block p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
            <FileSearch className="h-5 w-5 text-primary mb-1" />
            <p className="text-sm font-medium">诊断历史</p>
            <p className="text-xs text-muted-foreground">查看过往记录</p>
          </Link>
          <Link href="/used-car" className="block p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
            <CarFront className="h-5 w-5 text-accent mb-1" />
            <p className="text-sm font-medium">二手车评估</p>
            <p className="text-xs text-muted-foreground">车况快评</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
