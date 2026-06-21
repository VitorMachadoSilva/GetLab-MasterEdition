'use client';

import { SessionProvider } from 'next-auth/react';

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider refetchInterval={15} refetchOnWindowFocus>{children}</SessionProvider>;
}
