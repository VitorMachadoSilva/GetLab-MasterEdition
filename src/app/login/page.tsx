'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success('Login realizado com sucesso!');
        // Aguarda um pouco e limpa o toast antes de redirecionar
        setTimeout(() => {
          toast.dismiss();
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-secondary-600 to-primary-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border-4 border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-10 text-white text-center relative">
          <div className="absolute inset-0 bg-white opacity-5"></div>
          <div className="mb-6 flex justify-center relative">
            <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl shadow-xl">
              <LogIn size={56} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-black mb-3 tracking-tight">Sistema de Reservas</h1>
          <p className="text-white/90 font-semibold text-lg">FMPSC - Faculdade Municipal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu.nome@fmpsc.edu.br"
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Alunos: @aluno.fmpsc.edu.br | Professores: @fmpsc.edu.br
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha (CPF)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Digite seu CPF"
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Use seu CPF sem pontos ou traços
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Primeiro Acesso?</p>
                <p>Entre em contato com a administração para cadastro no sistema.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center border-t">
          <p className="text-sm text-gray-600">
            © 2024 FMPSC - Sistema de Gestão de Reservas
          </p>
        </div>
      </div>
    </div>
  );
}