// 顶部导航栏

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, Menu, X, User, LogOut } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from '@/lib/auth';
import { MobileDrawer } from './MobileDrawer';

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
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-heading font-bold text-xl text-foreground tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
              <Car className="h-5 w-5" />
            </div>
            <span>AutoDoc<span className="text-accent">智驾医生</span></span>
          </Link>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center gap-6">
            {user && (
              <>
                <Link href="/diagnose" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
                  智能问诊
                </Link>
                <Link href="/vehicles" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
                  我的车辆
                </Link>
                <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
                  诊断历史
                </Link>
                <Link href="/used-car" className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors">
                  二手车评估
                </Link>
                <Link href="/diagnose" className={buttonVariants({ size: 'sm' })}>
                  开始诊断
                </Link>
              </>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="inline-flex h-8 items-center gap-2 rounded-full hover:bg-muted px-3 transition-colors">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{user.username || user.email}</span>
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
                <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  登录
                </Link>
                <Link href="/register" className={buttonVariants({ size: 'sm' })}>
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
      </header>

      {/* 抽屉菜单 — 独立于 Header 的 stacking context，z-100 覆盖一切 */}
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
