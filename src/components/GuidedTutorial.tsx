'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CustomJoyride from '@/components/CustomJoyride';
import TutorialButton from '@/components/TutorialButton';
import { useTutorial } from '@/hooks/useTutorial';

const pageLabels: Record<string, string> = {
  '/dashboard': 'o painel inicial',
  '/professor/nova-reserva': 'a criação de reserva',
  '/professor/minhas-reservas': 'suas reservas',
  '/admin': 'o painel administrativo',
  '/admin/salas': 'o gerenciamento de salas',
  '/admin/usuarios': 'o gerenciamento de usuários',
  '/perfil': 'o perfil',
};

export default function GuidedTutorial() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const shouldHide =
    status !== 'authenticated' ||
    pathname === '/login' ||
    pathname === '/display' ||
    pathname.startsWith('/api');

  const {
    run,
    steps,
    autoDisabled,
    neverShowAgain,
    setNeverShowAgain,
    startTutorial,
    enableAutoTutorial,
    handleJoyrideCallback,
  } = useTutorial(session?.user?.role, pathname);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <CustomJoyride
        run={run}
        steps={steps}
        neverShowAgain={neverShowAgain}
        onNeverShowAgainChange={setNeverShowAgain}
        onCallback={handleJoyrideCallback}
      />
      <TutorialButton
        onStart={startTutorial}
        autoDisabled={autoDisabled}
        onEnableAuto={enableAutoTutorial}
        pageLabel={pageLabels[pathname] || 'esta página'}
      />
    </>
  );
}
