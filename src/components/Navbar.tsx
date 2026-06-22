'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, LogOut, Home, PlusCircle, FileText, Shield, MapPin, Monitor, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    { href: '/admin', icon: Shield, label: 'Admin', show: canSeeAdmin, tour: 'admin-panel' },
    { href: '/admin/usuarios', icon: User, label: 'Usuários', show: canSeeAdmin, tour: 'usuarios' },
    { href: '/admin/salas', icon: MapPin, label: 'Salas', show: canSeeAdmin, tour: 'salas' },
    { href: '/perfil', icon: User, label: 'Perfil', show: true, tour: 'profile-menu' },
  ];
  const visibleNavItems = navItems.filter(item => item.show);

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
              FMPSC Reservas
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
