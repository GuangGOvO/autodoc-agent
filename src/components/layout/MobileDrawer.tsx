// 移动端抽屉菜单 — 独立顶层组件，带打开/关闭动画

'use client';

import { useEffect, useRef, useState } from 'react';
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

const ANIMATION_DURATION = 300; // ms — matches CSS transition duration

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // mounted = 是否渲染 DOM；open 变化时不立即卸载，先播关闭动画
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步 open prop → 内部状态
  useEffect(() => {
    if (open) {
      // 打开：立即挂载 → 下一帧设为 visible（触发 transition）
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      // 打开抽屉需先挂载 DOM 再触发过渡动画，同步 setState 是本模式所需
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      // 等一帧让 DOM 渲染后再触发 transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else if (mounted) {
      // 关闭：先设为不可见（触发 transition）→ 动画结束后卸载
      setVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setMounted(false);
        closeTimerRef.current = null;
      }, ANIMATION_DURATION);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // 清理定时器
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // 锁定 body 滚动
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.push('/login');
    router.refresh();
  };

  if (!mounted) return null;

  return (
    <div
      className="md:hidden fixed inset-0 z-[100]"
      onClick={onClose}
    >
      {/* 遮罩 — opacity transition */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* 抽屉面板 — transform transition */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
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
