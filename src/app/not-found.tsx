import { ShieldAlert } from 'lucide-react';
import NotFoundActions from '@/components/NotFoundActions';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-16 flex items-center justify-center">
      <section className="w-full max-w-2xl text-center glass rounded-3xl border-2 border-white/30 shadow-modern p-8 sm:p-12">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-fmpsc text-white flex items-center justify-center shadow-modern">
          <ShieldAlert size={40} />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.2em] text-primary-600 mb-3">
          404 - Página não encontrada
        </p>

        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
          Esta página não está disponível
        </h1>

        <p className="text-lg text-gray-600 font-medium mb-8 leading-relaxed">
          O endereço pode não existir ou sua conta pode não ter permissão para acessar esta área do sistema.
        </p>

        <NotFoundActions />
      </section>
    </main>
  );
}
