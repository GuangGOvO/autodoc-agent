'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useEffect } from 'react';

export function MobileDetector() {
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.setAttribute('data-mobile', String(isMobile));
  }, [isMobile]);

  return null;
}
