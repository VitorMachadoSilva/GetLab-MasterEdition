'use client';

import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function AuthSessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.sessionId) return;

    if (session.sessionNotice === 'PREVIOUS_SESSION_CLOSED') {
      const noticeKey = `session-notice-${session.sessionId}`;

      if (!sessionStorage.getItem(noticeKey)) {
        sessionStorage.setItem(noticeKey, 'true');
        toast.success('Você entrou em uma nova sessão. Sessões anteriores desta conta foram encerradas.');
      }
    }
  }, [session?.sessionId, session?.sessionNotice, status]);

  useEffect(() => {
    if (status !== 'authenticated' || session?.sessionError !== 'SESSION_REPLACED') return;

    toast.error('Esta sessão foi encerrada porque sua conta entrou em outro navegador ou instância.');

    const timeout = window.setTimeout(() => {
      signOut({ callbackUrl: '/login?session=replaced' });
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [session?.sessionError, status]);

  return null;
}
