'use client';

import { useState, useCallback, useEffect } from 'react';

export type MobileView = 'list' | 'chat' | 'info';

export function useMobileNavigation() {
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const handleBackToList = useCallback(() => {
    setMobileView('list');
  }, []);

  const handleShowChat = useCallback(() => {
    setMobileView('chat');
  }, []);

  const handleShowInfoMobile = useCallback(() => {
    setMobileView('info');
  }, []);

  const handleCloseInfoMobile = useCallback(() => {
    setMobileView('chat');
  }, []);

  useEffect(() => {
    if (mobileView !== 'info') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileView('chat');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileView]);

  return {
    mobileView,
    handleBackToList,
    handleShowChat,
    handleShowInfoMobile,
    handleCloseInfoMobile,
  };
}
