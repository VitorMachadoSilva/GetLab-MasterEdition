'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, LogOut, Home, PlusCircle, FileText, Shield, MapPin, Monitor } from 'lucide-react';

export default function   Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Não mostrar navbar em login, display e quando não autenticado
  if (pathname === '/login' || pathname === '/display' || status === 'unauthenticated') {
    return null;
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const isProfessor = session?.user?.role === 'PROFESSOR';

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Início', show: true, tour: 'dashboard' },
    { href: '/display', icon: Monitor, label: 'Display', show: true, tour: 'display' },
    { href: '/calendario', icon: Calendar, label: 'Calendário', show: true, tour: 'calendario' },
    { href: '/professor/nova-reserva', icon: PlusCircle, label: 'Nova Reserva', show: isProfessor || isAdmin, tour: 'nova-reserva' },
    { href: '/professor/minhas-reservas', icon: FileText, label: 'Minhas Reservas', show: isProfessor || isAdmin, tour: 'minhas-reservas' },
    { href: '/admin', icon: Shield, label: 'Admin', show: isAdmin, tour: 'admin-panel' },
    // { href: '/admin/usuarios', icon: User, label: 'Usuários', show: isAdmin, tour: 'usuarios' },
    // { href: '/admin/salas', icon: MapPin, label: 'Salas', show: isAdmin, tour: 'salas' },
    { href: '/perfil', icon: User, label: 'Perfil', show: true, tour: 'profile-menu' },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b-2 border-white/20 shadow-modern">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-3">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="group flex items-center gap-3 hover:scale-105 transition-transform mr-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-primary-500 to-secondary-500 p-2.5 rounded-2xl">
                <Calendar className="text-white" size={24} />
              </div>
            </div>
            <span className="font-black text-xl text-gradient-vibrant hidden sm:inline tracking-tight">
              FMPSC Reservas
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-2 mgl-2">
            {navItems.filter(item => item.show).map((item) => {
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
              <div className="text-right hidden sm:block">
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
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2.5 hover:bg-red-50 rounded-xl transition-all group hover:scale-105"
                title="Sair"
              >
                <LogOut size={20} className="text-gray-600 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
