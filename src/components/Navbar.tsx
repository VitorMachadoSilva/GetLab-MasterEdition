'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, LogOut, Home, PlusCircle, FileText, Shield, MapPin, Monitor } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === '/login' || status === 'unauthenticated') {
    return null;
  }

  const isAdmin = session?.user?.role === 'ADMIN';
  const isProfessor = session?.user?.role === 'PROFESSOR';

  return (
    <nav className="bg-white shadow-lg border-b-2 border-gray-200 sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="flex items-center justify-between h-22 py-4">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-xl ml-5">
              <Calendar className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              FMPSC Reservas
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                pathname === '/dashboard'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline">Início</span>
            </Link>

            <Link
              href="/display"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                pathname === '/display'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Monitor size={18} />
              <span className="hidden sm:inline">Display</span>
            </Link>

            {(isProfessor || isAdmin) && (
              <>
                <Link
                  href="/professor/nova-reserva"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === '/professor/nova-reserva'
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <PlusCircle size={18} />
                  <span className="hidden sm:inline">Nova Reserva</span>
                </Link>

                <Link
                  href="/professor/minhas-reservas"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === '/professor/minhas-reservas'
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={18} />
                  <span className="hidden sm:inline">Minhas Reservas</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === '/admin'
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield size={18} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>

                <Link
                  href="/admin/usuarios"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === '/admin/usuarios'
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Usuários</span>
                </Link>

                <Link
                  href="/admin/salas"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === '/admin/salas'
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin size={18} />
                  <span className="hidden sm:inline">Salas</span>
                </Link>
              </>
            )}

            <Link
              href="/perfil"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                pathname === '/perfil'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User size={18} />
              <span className="hidden sm:inline">Perfil</span>
            </Link>

            <div className="ml-4 flex items-center gap-3 border-l pl-4 mr-5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {session?.user?.role?.toLowerCase()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
