'use client';

import { useState, useEffect } from 'react';

export interface TutorialStep {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
}

// Tours por role
const TOURS = {
  ALUNO: [
    {
      target: 'body',
      content: 'Bem-vindo ao Sistema de Reservas FMPSC! Vamos fazer um tour rápido para você conhecer a plataforma.',
      title: '👋 Olá, Aluno!',
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="dashboard-header"]',
      content: 'Aqui você vê as reservas do dia. O relógio mostra a hora atual e você pode filtrar por data.',
      title: '📅 Dashboard',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="current-class"]',
      content: 'Quando há uma aula acontecendo agora, ela aparece destacada aqui em verde com um indicador ao vivo.',
      title: '🔴 Aula em Andamento',
      placement: 'top' as const,
    },
    {
      target: '[data-tour="upcoming-classes"]',
      content: 'As próximas aulas do dia aparecem listadas aqui com horários, professores e salas.',
      title: '⏰ Próximas Aulas',
      placement: 'top' as const,
    },
    {
      target: '[data-tour="profile-menu"]',
      content: 'Clique aqui para acessar seu perfil e visualizar suas informações.',
      title: '👤 Perfil',
      placement: 'bottom' as const,
    },
  ],
  
  PROFESSOR: [
    {
      target: 'body',
      content: 'Bem-vindo, Professor! Vamos explorar as funcionalidades disponíveis para você.',
      title: '👋 Olá, Professor!',
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="nova-reserva"]',
      content: 'Clique aqui para criar uma nova solicitação de reserva de sala ou laboratório.',
      title: '➕ Nova Reserva',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="dashboard-header"]',
      content: 'Você pode ver todas as reservas do dia e filtrar por data para planejar melhor suas aulas.',
      title: '📅 Visualizar Reservas',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="minhas-reservas"]',
      content: 'Aqui você acompanha o status de todas as suas solicitações: pendentes, aprovadas ou rejeitadas.',
      title: '📋 Minhas Reservas',
      placement: 'bottom' as const,
    },
    {
      target: 'body',
      content: '⚠️ Lembre-se: Reservas devem ser feitas com no mínimo 24 horas de antecedência e ter duração mínima de 1 hora!',
      title: '📝 Regras Importantes',
      placement: 'center' as const,
    },
  ],
  
  ADMIN: [
    {
      target: 'body',
      content: 'Bem-vindo, Administrador! Você tem acesso completo ao sistema. Vamos ver suas funcionalidades.',
      title: '👋 Olá, Admin!',
      placement: 'center' as const,
      disableBeacon: true,
    },
    {
      target: '[data-tour="admin-panel"]',
      content: 'O painel administrativo é onde você aprova/rejeita reservas e visualiza estatísticas gerais.',
      title: '🛡️ Painel Admin',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="usuarios"]',
      content: 'Gerencie todos os usuários do sistema: adicione, edite ou remova alunos, professores e outros admins.',
      title: '👥 Gerenciar Usuários',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="salas"]',
      content: 'Cadastre e gerencie salas, laboratórios e auditórios com suas capacidades e equipamentos.',
      title: '🏢 Gerenciar Salas',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="nova-reserva"]',
      content: 'Como admin, suas reservas são aprovadas automaticamente, sem necessidade de aprovação.',
      title: '⚡ Reservas Rápidas',
      placement: 'bottom' as const,
    },
    {
      target: 'body',
      content: 'Você está pronto! Explore o sistema e lembre-se: você pode iniciar este tour novamente clicando no botão de ajuda.',
      title: 'Tudo Pronto!',
      placement: 'center' as const,
    },
  ],
};

export function useTutorial(userRole: string | undefined) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    // Verificar se já viu o tutorial
    const seen = localStorage.getItem(`tutorial-seen-${userRole}`);
    if (!seen && userRole) {
      // Aguardar um pouco para o DOM carregar
      setTimeout(() => {
        setHasSeenTutorial(false);
        setRun(true);
      }, 1000);
    }
  }, [userRole]);

  const startTutorial = () => {
    setStepIndex(0);
    setRun(true);
  };

  const handleJoyrideCallback = (data: any) => {
    const { status, type } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (userRole) {
        localStorage.setItem(`tutorial-seen-${userRole}`, 'true');
        setHasSeenTutorial(true);
      }
    }
  };

  const steps = userRole && TOURS[userRole as keyof typeof TOURS] 
    ? TOURS[userRole as keyof typeof TOURS] 
    : [];

  return {
    run,
    steps,
    stepIndex,
    hasSeenTutorial,
    startTutorial,
    handleJoyrideCallback,
  };
}
