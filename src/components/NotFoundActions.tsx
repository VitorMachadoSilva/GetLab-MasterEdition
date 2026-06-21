'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundActions() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => router.back()}
        className="btn-modern inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-fmpsc text-white font-bold shadow-modern hover:shadow-glow transition-all"
      >
        <ArrowLeft size={20} />
        Voltar para onde estava
      </button>

      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-200 text-primary-700 bg-white/80 font-bold hover:bg-primary-50 transition-all"
      >
        <Home size={20} />
        Ir para o início
      </Link>
    </div>
  );
}
