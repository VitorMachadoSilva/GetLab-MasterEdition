'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Bell,
  Calendar,
  ChevronDown,
  FileBarChart,
  FileText,
  Home,
  LogOut,
  MapPin,
  Menu,
  Monitor,
  PlusCircle,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { readApiError } from '@/lib/api-client';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const desktopAdminRef = useRef<HTMLDivElement>(null);
  const mobileAdminRef = useRef<HTMLDivElement>(null);
  const desktopNotificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAdminMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!session?.user || pathname === '/login' || pathname === '/display') {
      return;
    }

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [session?.user?.id, pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        desktopAdminRef.current?.contains(event.target as Node) ||
        mobileAdminRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setAdminMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        desktopNotificationsRef.current?.contains(event.target as Node) ||
        mobileNotificationsRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setNotificationsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Não mostrar navbar em login, display e quando não autenticado
  if (pathname === '/login' || pathname === '/display' || status === 'unauthenticated') {
    return null;
  }

  const isDemo = session?.user?.role === 'DEMO';
  const isAdmin = session?.user?.role === 'ADMIN';
  const isProfessor = session?.user?.role === 'PROFESSOR';
  const canSeeAdmin = isAdmin || isDemo;
  const canSeeProfessor = isProfessor || isAdmin || isDemo;

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Início', show: true, tour: 'dashboard' },
    { href: '/display', icon: Monitor, label: 'Display', show: true, tour: 'display' },
    { href: '/professor/nova-reserva', icon: PlusCircle, label: 'Nova Reserva', show: canSeeProfessor, tour: 'nova-reserva' },
    { href: '/professor/minhas-reservas', icon: FileText, label: 'Minhas Reservas', show: canSeeProfessor, tour: 'minhas-reservas' },
    { href: '/perfil', icon: User, label: 'Perfil', show: true, tour: 'profile-menu' },
  ];
  const visibleNavItems = navItems.filter(item => item.show);
  const adminItems = [
    { href: '/admin', icon: Shield, label: 'Painel', tour: 'admin-panel' },
    { href: '/admin/usuarios', icon: User, label: 'Usuários', tour: 'usuarios' },
    { href: '/admin/alunos', icon: Users, label: 'Alunos', tour: 'alunos' },
    { href: '/admin/salas', icon: MapPin, label: 'Salas', tour: 'salas' },
    { href: '/admin/relatorios', icon: FileBarChart, label: 'Relatórios', tour: 'relatorios' },
  ];
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');

      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (error) {
      // Mantém o menu silencioso se a conexão oscilar.
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });

      if (res.ok) {
        setNotifications((current) =>
          current.map((notification) => ({ ...notification, read: true }))
        );
      } else {
        toast.error(await readApiError(res, 'Não foi possível marcar notificações como lidas'));
      }
    } catch (error) {
      toast.error('Não foi possível atualizar as notificações.');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });

      if (res.ok) {
        setNotifications((current) =>
          current.filter((notification) => notification.id !== notificationId)
        );
      } else {
        toast.error(await readApiError(res, 'Não foi possível remover a notificação'));
      }
    } catch (error) {
      toast.error('Não foi possível remover a notificação.');
    }
  };

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b-2 border-white/20 shadow-modern">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="group flex min-w-0 items-center gap-3 transition-transform hover:scale-105 lg:mr-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-primary-500 to-secondary-500 p-2.5 rounded-2xl">
                <Calendar className="text-white" size={24} />
              </div>
            </div>
            <span className="hidden truncate font-black text-xl text-gradient-vibrant sm:inline tracking-tight">
              GetLab
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden items-center gap-1 lg:flex">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={item.tour}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden group ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow'
                      : 'text-gray-700 hover:bg-primary-50'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  )}
                  <Icon size={18} className={`relative z-10 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="hidden sm:inline relative z-10 text-sm">{item.label}</span>
                  
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  )}
                </Link>
              );
            })}

            {canSeeAdmin && (
              <div ref={desktopAdminRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((open) => !open)}
                  data-tour="admin-panel"
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 overflow-hidden group ${
                    pathname.startsWith('/admin')
                      ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow'
                      : 'text-gray-700 hover:bg-primary-50'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={adminMenuOpen}
                >
                  <Shield size={18} className="relative z-10" />
                  <span className="relative z-10 text-sm">Admin</span>
                  <ChevronDown size={16} className={`relative z-10 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border-2 border-primary-100 bg-white p-2 shadow-2xl">
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-tour={item.tour}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                          }`}
                        >
                          <Icon size={18} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* User Section */}
            <div className="ml-4 flex items-center gap-3 pl-4 border-l-2 border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 tracking-tight">{session?.user?.name}</p>
                <p className="text-xs font-semibold text-gradient capitalize">
                  {session?.user?.role?.toLowerCase()}
                </p>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>

              <NotificationBell
                wrapperRef={desktopNotificationsRef}
                notifications={notifications}
                open={notificationsOpen}
                unreadCount={unreadCount}
                onToggle={() => setNotificationsOpen((open) => !open)}
                onReadAll={markAllNotificationsRead}
                onDelete={deleteNotification}
              />
              
              <button
                onClick={handleSignOut}
                className="p-2.5 hover:bg-red-50 rounded-xl transition-all group hover:scale-105"
                title="Sair"
              >
                <LogOut size={20} className="text-gray-600 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Mobile User + Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <NotificationBell
              wrapperRef={mobileNotificationsRef}
              notifications={notifications}
              open={notificationsOpen}
              unreadCount={unreadCount}
              onToggle={() => setNotificationsOpen((open) => !open)}
              onReadAll={markAllNotificationsRead}
              onDelete={deleteNotification}
              compact
            />

            <div className="min-w-0 text-right">
              <p className="max-w-[120px] truncate text-sm font-bold text-gray-800 tracking-tight">
                {session?.user?.name}
              </p>
              <p className="text-xs font-semibold text-gradient capitalize">
                {session?.user?.role?.toLowerCase()}
              </p>
            </div>

            <div className="relative h-10 w-10 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-black shadow-lg">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-primary-100 bg-white text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/40 bg-white/95 px-4 pb-4 pt-3 shadow-xl backdrop-blur lg:hidden">
          <div className="grid gap-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={item.tour}
                  className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                    isActive
                      ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                      : 'border-gray-100 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}

            {canSeeAdmin && (
              <div ref={mobileAdminRef} className="rounded-xl border-2 border-primary-100 bg-primary-50 p-2">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen((open) => !open)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-white px-4 py-3 font-bold text-primary-800"
                  aria-expanded={adminMenuOpen}
                >
                  <Shield size={20} className="flex-shrink-0" />
                  <span className="min-w-0 flex-1 text-left">Admin</span>
                  <ChevronDown size={18} className={`transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {adminMenuOpen && (
                  <div className="mt-2 grid gap-2">
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-tour={item.tour}
                          className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 font-bold transition-all ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-primary-100'
                          }`}
                        >
                          <Icon size={19} className="flex-shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 flex min-h-12 items-center gap-3 rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 font-bold text-red-700 transition-colors hover:bg-red-100"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function NotificationBell({
  wrapperRef,
  notifications,
  open,
  unreadCount,
  onToggle,
  onReadAll,
  onDelete,
  compact = false,
}: {
  wrapperRef: RefObject<HTMLDivElement>;
  notifications: Notification[];
  open: boolean;
  unreadCount: number;
  onToggle: () => void;
  onReadAll: () => void;
  onDelete: (notificationId: string) => void;
  compact?: boolean;
}) {
  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex items-center justify-center rounded-xl border-2 border-primary-100 bg-white text-primary-700 shadow-sm transition-all hover:bg-primary-50 ${
          compact ? 'h-11 w-11' : 'p-2.5'
        } ${unreadCount > 0 ? 'bell-reminder' : ''}`}
        aria-label="Notificações"
        title="Notificações"
      >
        <Bell size={compact ? 21 : 20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border-2 border-primary-100 bg-white p-2 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-black text-gray-900">Notificações</p>
              <p className="text-xs font-semibold text-gray-500">
                {unreadCount} não lida{unreadCount === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              onClick={onReadAll}
              disabled={unreadCount === 0}
              className="rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-black text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ler tudo
            </button>
          </div>

          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-2 ${
                    notification.read
                      ? 'border-gray-100 bg-gray-50'
                      : 'border-primary-200 bg-primary-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-gray-900">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-relaxed text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">
                        {new Date(notification.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(notification.id)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Remover notificação"
                      aria-label="Remover notificação"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-gray-50 p-5 text-center text-sm font-semibold text-gray-500">
                Nenhuma notificação ainda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
