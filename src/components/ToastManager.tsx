'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export function ToastManager() {
  const pathname = usePathname();

  useEffect(() => {
    // Limpa todos os toasts ao trocar de rota
    toast.dismiss();
  }, [pathname]);

  return null;
}
