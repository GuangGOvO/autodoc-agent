'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Car, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuth } from '@/components/auth/AuthProvider';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: Home },
  { href: '/diagnose', label: '问诊', icon: MessageSquare },
  { href: '/vehicles', label: '车辆', icon: Car },
  { href: '/history', label: '历史', icon: Clock },
];

export function MobileNav() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { user } = useAuth();

  if (!isMobile || !user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)] h-16 flex items-center justify-around md:hidden">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
