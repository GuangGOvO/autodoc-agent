// 顶部导航栏

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, Menu, X, User, Settings, LogOut } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from '@/lib/auth';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Car className="h-5 w-5" />
          </div>
          <span>AutoDoc<span className="text-accent">智驾医生</span></span>
        </Link>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link href="/diagnose" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                智能问诊
              </Link>
              <Link href="/vehicles" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                我的车辆
              </Link>
              <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                诊断历史
              </Link>
              <Link href="/used-car" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                二手车评估
              </Link>
              <Link href="/diagnose" className={buttonVariants()}>
                开始诊断
              </Link>
            </>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile" className="inline-flex h-8 items-center gap-2 rounded-full hover:bg-muted px-3 transition-colors">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.username || user.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
                title="退出登录"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : !loading ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonVariants({ variant: 'outline' })}>
                登录
              </Link>
              <Link href="/register" className={buttonVariants()}>
                注册
              </Link>
            </div>
          ) : null}
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* 移动端抽屉菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMobileMenuOpen(false)}>
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" />
          {/* 抽屉 */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-xl animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* 顶部：用户信息 + 关闭按钮 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {user && (
                  <span className="text-sm font-medium">{user.username || user.email}</span>
                )}
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 菜单项 */}
            <nav className="p-4 space-y-1">
              {user && (
                <>
                  <Link
                    href="/diagnose"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    智能问诊
                  </Link>
                  <Link
                    href="/vehicles"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    我的车辆
                  </Link>
                  <Link
                    href="/history"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    诊断历史
                  </Link>
                  <Link
                    href="/used-car"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    二手车评估
                  </Link>
                  <Link
                    href="/diagnose"
                    className={buttonVariants({ className: 'w-full justify-center mt-4' })}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    开始诊断
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    个人中心
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    退出登录
                  </button>
                </>
              )}
              {!user && !loading && (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    注册
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
