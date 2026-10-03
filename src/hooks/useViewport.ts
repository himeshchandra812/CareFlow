import { useState, useEffect } from 'react';

export interface ViewportState {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isUltrawide: boolean;
  isShortViewport: boolean;
}

export function useViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1280,
        height: 800,
        aspectRatio: 1.6,
        orientation: 'landscape',
        devicePixelRatio: 1,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isUltrawide: false,
        isShortViewport: false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / (height || 1);
    const orientation = aspectRatio >= 1 ? 'landscape' : 'portrait';

    return {
      width,
      height,
      aspectRatio,
      orientation,
      devicePixelRatio: window.devicePixelRatio || 1,
      isMobile: width < 640,
      isTablet: width >= 640 && width < 1024,
      isDesktop: width >= 1024,
      isUltrawide: width >= 1800 || aspectRatio > 2.1,
      isShortViewport: height < 650
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: any = null;

    const handleResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ratio = w / (h || 1);

        setViewport({
          width: w,
          height: h,
          aspectRatio: ratio,
          orientation: ratio >= 1 ? 'landscape' : 'portrait',
          devicePixelRatio: window.devicePixelRatio || 1,
          isMobile: w < 640,
          isTablet: w >= 640 && w < 1024,
          isDesktop: w >= 1024,
          isUltrawide: w >= 1800 || ratio > 2.1,
          isShortViewport: h < 650
        });
      }, 50); // Throttled resize for performance
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
}
