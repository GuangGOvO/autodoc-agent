// 移动端抽屉菜单 — 独立顶层组件，避免 Header sticky 的 stacking context 限制

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, LogOut } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from '@/lib/auth';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.push('/login');
    router.refresh();
  };

  // 打开时锁定 body 滚动，关闭时恢复
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="md:hidden fixed inset-0 z-[100]"
      onClick={onClose}
    >
      {/* 遮罩 — 静态半透明黑色，不依赖动画库 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 抽屉面板 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl drawer-slide-in overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部：用户信息 + 关闭按钮 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 min-w-0">
            {user && (
              <span className="text-sm font-medium truncate">{user.username || user.email}</span>
            )}
            {!user && !loading && (
              <span className="text-sm text-muted-foreground">未登录</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted flex-shrink-0"
          >
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
                onClick={onClose}
              >
                智能问诊
              </Link>
              <Link
                href="/vehicles"
                className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={onClose}
              >
                我的车辆
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={onClose}
              >
                诊断历史
              </Link>
              <Link
                href="/used-car"
                className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={onClose}
              >
                二手车评估
              </Link>
              <Link
                href="/diagnose"
                className={buttonVariants({ className: 'w-full justify-center mt-4' })}
                onClick={onClose}
              >
                开始诊断
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={onClose}
              >
                个人中心
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </>
          )}
          {!user && !loading && (
            <>
              <Link
                href="/login"
                className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={onClose}
              >
                登录
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-muted"
                onClick={onClose}
              >
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
