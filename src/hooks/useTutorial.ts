'use client';

import { useState, useEffect } from 'react';

export interface TutorialStep {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
}

type UserRole = 'ALUNO' | 'PROFESSOR' | 'ADMIN';

type TutorialPage =
  | 'dashboard'
  | 'nova-reserva'
  | 'minhas-reservas'
  | 'admin'
  | 'admin-salas'
  | 'admin-usuarios'
  | 'perfil'
  | 'generic';

const commonIntro: Record<UserRole, TutorialStep> = {
  ALUNO: {
    target: 'body',
    content: 'Bem-vindo ao Sistema de Reservas FMPSC! Este guia mostra os pontos principais desta página.',
    title: 'Olá, Aluno!',
    placement: 'center',
    disableBeacon: true,
  },
  PROFESSOR: {
    target: 'body',
    content: 'Bem-vindo, Professor! Este guia muda conforme a página para ajudar você no fluxo atual.',
    title: 'Olá, Professor!',
    placement: 'center',
    disableBeacon: true,
  },
  ADMIN: {
    target: 'body',
    content: 'Bem-vindo, Administrador! Este guia destaca os controles mais importantes da página atual.',
    title: 'Olá, Admin!',
    placement: 'center',
    disableBeacon: true,
  },
};

const pageTours: Record<TutorialPage, TutorialStep[]> = {
  dashboard: [
    {
      target: '[data-tour="dashboard-header"]',
      content: 'Aqui ficam as reservas do dia, o relógio atual e o filtro de data para consultar outros períodos.',
      title: 'Reservas do dia',
      placement: 'bottom',
    },
    {
      target: '[data-tour="current-class"]',
      content: 'Quando existe uma aula acontecendo agora, ela aparece em destaque para consulta rápida.',
      title: 'Aula em andamento',
      placement: 'top',
    },
    {
      target: '[data-tour="upcoming-classes"]',
      content: 'As próximas aulas aparecem aqui com horário, professor e sala.',
      title: 'Próximas aulas',
      placement: 'top',
    },
    {
      target: '[data-tour="profile-menu"]',
      content: 'Use o menu superior para navegar entre perfil, reservas, salas e demais áreas permitidas ao seu tipo de conta.',
      title: 'Navegação',
      placement: 'bottom',
    },
  ],

  'nova-reserva': [
    {
      target: '[data-tour="nova-reserva-header"]',
      content: 'Esta página concentra a criação de uma nova solicitação de reserva.',
      title: 'Nova reserva',
      placement: 'bottom',
    },
    {
      target: '[data-tour="reserva-regras"]',
      content: 'Confira as regras antes de enviar: antecedência, duração mínima e aprovação administrativa.',
      title: 'Regras importantes',
      placement: 'bottom',
    },
    {
      target: '[data-tour="reserva-sala"]',
      content: 'Escolha a sala ou laboratório. A capacidade do ambiente será usada para validar a quantidade de alunos.',
      title: 'Escolha do ambiente',
      placement: 'bottom',
    },
    {
      target: '[data-tour="reserva-data-alunos"]',
      content: 'Selecione a data e informe o número de alunos. Os atalhos ajudam a escolher os próximos dias rapidamente.',
      title: 'Data e alunos',
      placement: 'top',
    },
    {
      target: '[data-tour="reserva-disponibilidade"]',
      content: 'A disponibilidade mostra blocos livres e ocupados. Clique em um bloco livre para preencher o horário automaticamente.',
      title: 'Disponibilidade real',
      placement: 'top',
    },
    {
      target: '[data-tour="reserva-submit"]',
      content: 'Depois de revisar os dados, envie a solicitação. Ela ficará pendente até aprovação do administrador.',
      title: 'Envio da solicitação',
      placement: 'top',
    },
  ],

  'minhas-reservas': [
    {
      target: '[data-tour="minhas-reservas-header"]',
      content: 'Aqui você acompanha todas as suas solicitações de reserva.',
      title: 'Minhas reservas',
      placement: 'bottom',
    },
    {
      target: '[data-tour="minhas-reservas-stats"]',
      content: 'Os cartões resumem quantas reservas existem em cada status.',
      title: 'Resumo por status',
      placement: 'bottom',
    },
    {
      target: '[data-tour="minhas-reservas-filtros"]',
      content: 'Use os filtros para localizar rapidamente pendentes, aprovadas, rejeitadas ou canceladas.',
      title: 'Filtros',
      placement: 'bottom',
    },
    {
      target: '[data-tour="minhas-reservas-lista"]',
      content: 'Cada cartão mostra ambiente, data, horário, status e ações disponíveis, como cancelar uma pendente.',
      title: 'Lista de solicitações',
      placement: 'top',
    },
  ],

  admin: [
    {
      target: '[data-tour="admin-header"]',
      content: 'Este painel centraliza reservas, aprovações e atalhos administrativos.',
      title: 'Painel administrativo',
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-metricas"]',
      content: 'As métricas mostram rapidamente o volume de reservas, pendências e usuários.',
      title: 'Indicadores',
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-pendentes"]',
      content: 'Aqui aparecem as solicitações que ainda precisam de aprovação ou rejeição.',
      title: 'Pendentes de aprovação',
      placement: 'top',
    },
    {
      target: '[data-tour="admin-historico"]',
      content: 'Nesta área, o administrador acompanha todas as reservas e filtra pelo status.',
      title: 'Histórico de reservas',
      placement: 'top',
    },
  ],

  'admin-salas': [
    {
      target: '[data-tour="admin-salas-header"]',
      content: 'Nesta página o administrador cadastra e mantém salas, laboratórios e auditórios.',
      title: 'Gerenciar salas',
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-salas-metricas"]',
      content: 'Os cartões mostram um resumo dos ambientes cadastrados por tipo.',
      title: 'Resumo dos ambientes',
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-salas-lista"]',
      content: 'A lista permite revisar capacidade, localização, equipamentos e ações de edição ou exclusão.',
      title: 'Lista de salas',
      placement: 'top',
    },
  ],

  'admin-usuarios': [
    {
      target: '[data-tour="admin-usuarios-header"]',
      content: 'Aqui o administrador cria e mantém os usuários que acessam o sistema.',
      title: 'Gerenciar usuários',
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-usuarios-filtros"]',
      content: 'Use busca e filtros para encontrar usuários por nome, email, CPF, departamento ou tipo.',
      title: 'Busca e filtros',
      placement: 'bottom',
    },
    {
      target: '[data-tour="admin-usuarios-lista"]',
      content: 'A lista mostra os dados principais, tipo de conta, quantidade de reservas e ações administrativas.',
      title: 'Lista de usuários',
      placement: 'top',
    },
  ],

  perfil: [
    {
      target: '[data-tour="perfil-header"]',
      content: 'O perfil reúne seus dados de identificação e acesso.',
      title: 'Meu perfil',
      placement: 'bottom',
    },
    {
      target: '[data-tour="perfil-dados"]',
      content: 'Revise seus dados cadastrados. Alguns campos são protegidos por segurança.',
      title: 'Dados cadastrais',
      placement: 'top',
    },
    {
      target: '[data-tour="perfil-resumo"]',
      content: 'O resumo lateral mostra suas reservas e permissões principais dentro do sistema.',
      title: 'Resumo e permissões',
      placement: 'top',
    },
  ],

  generic: [
    {
      target: 'body',
      content: 'Esta página ainda não possui um tour detalhado, mas você pode usar o menu superior para navegar pelo sistema.',
      title: 'Ajuda da página',
      placement: 'center',
    },
  ],
};

const pageFromPathname = (pathname: string): TutorialPage => {
  if (pathname === '/dashboard' || pathname === '/') return 'dashboard';
  if (pathname === '/professor/nova-reserva') return 'nova-reserva';
  if (pathname === '/professor/minhas-reservas') return 'minhas-reservas';
  if (pathname === '/admin') return 'admin';
  if (pathname === '/admin/salas') return 'admin-salas';
  if (pathname === '/admin/usuarios') return 'admin-usuarios';
  if (pathname === '/perfil') return 'perfil';
  return 'generic';
};

const getStorageKey = (kind: 'seen' | 'disabled', userRole: string, pathname: string) =>
  `tutorial-${kind}-${userRole}-${pathname}`;

export function useTutorial(userRole: string | undefined, pathname = '/dashboard') {
  const [run, setRun] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);
  const [autoDisabled, setAutoDisabled] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  useEffect(() => {
    if (!userRole) return;

    const seen = localStorage.getItem(getStorageKey('seen', userRole, pathname));
    const disabled = localStorage.getItem(getStorageKey('disabled', userRole, pathname));

    setHasSeenTutorial(Boolean(seen));
    setAutoDisabled(Boolean(disabled));
    setNeverShowAgain(false);

    if (!seen && !disabled) {
      const timeout = window.setTimeout(() => {
        setHasSeenTutorial(false);
        setRun(true);
      }, 1000);

      return () => window.clearTimeout(timeout);
    }
  }, [pathname, userRole]);

  const startTutorial = () => {
    setNeverShowAgain(false);
    setRun(true);
  };

  const enableAutoTutorial = () => {
    if (!userRole) return;

    localStorage.removeItem(getStorageKey('seen', userRole, pathname));
    localStorage.removeItem(getStorageKey('disabled', userRole, pathname));
    setHasSeenTutorial(false);
    setAutoDisabled(false);
  };

  const handleJoyrideCallback = (data: any) => {
    const { status, neverShowAgain: shouldNeverShowAgain } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (userRole) {
        localStorage.setItem(getStorageKey('seen', userRole, pathname), 'true');
        if (shouldNeverShowAgain) {
          localStorage.setItem(getStorageKey('disabled', userRole, pathname), 'true');
          setAutoDisabled(true);
        }
        setHasSeenTutorial(true);
      }
    }
  };

  const role = userRole as UserRole | undefined;
  const page = pageFromPathname(pathname);
  const steps = role
    ? [
        commonIntro[role],
        ...pageTours[page],
        {
          target: 'body',
          content: 'Pronto. Você pode abrir este guia novamente a qualquer momento pelo botão de ajuda no canto da tela.',
          title: 'Tutorial disponível sempre',
          placement: 'center' as const,
        },
      ]
    : [];

  return {
    run,
    steps,
    hasSeenTutorial,
    autoDisabled,
    neverShowAgain,
    setNeverShowAgain,
    startTutorial,
    enableAutoTutorial,
    handleJoyrideCallback,
  };
}
