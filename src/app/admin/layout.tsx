// 管理后台布局

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, BarChart3, ArrowLeft } from 'lucide-react';

const navItems = [
  { href: '/admin', label: '数据概览', icon: LayoutDashboard },
  { href: '/admin/knowledge', label: '知识库管理', icon: BookOpen },
  { href: '/admin/stats', label: '使用统计', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* 侧边栏 */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-muted/30">
        <div className="p-4 border-b">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            返回首页
          </Link>
          <h2 className="text-sm font-semibold mt-2">管理后台</h2>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 移动端顶部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
        <nav className="flex justify-around py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
