'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const emailTouched = formData.email.length > 0;
  const passwordTouched = formData.password.length > 0;
  const validation = useMemo(() => {
    const email = formData.email.trim();
    const password = formData.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors: { email?: string; password?: string } = {};

    if (emailTouched && !email) {
      errors.email = 'Informe um email válido';
    } else if (emailTouched && !emailRegex.test(email)) {
      errors.email = 'Email inválido';
    }

    if (passwordTouched && !password) {
      errors.password = 'CPF não pode ficar vazio';
    } else if (passwordTouched && /^\d+$/.test(password) && password.length !== 11) {
      errors.password = 'CPF deve ter 11 números';
    }

    return {
      errors,
      isValid:
        emailRegex.test(email) &&
        password.length > 0 &&
        password.length <= 11 &&
        !/\s/.test(formData.password) &&
        (!/^\d+$/.test(password) || password.length === 11),
    };
  }, [emailTouched, formData.email, formData.password, passwordTouched]);

  useEffect(() => {
    setReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || loading || !validation.isValid) return;

    const callbackUrlParam = new URLSearchParams(window.location.search).get('callbackUrl');
    const callbackUrl =
      callbackUrlParam && callbackUrlParam.startsWith('/') && !callbackUrlParam.startsWith('//') && callbackUrlParam !== '/'
        ? callbackUrlParam
        : '/dashboard';

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      } else if (result?.ok) {
        toast.success('Login realizado com sucesso!');
        setTimeout(() => {
          toast.dismiss();
          window.location.assign(callbackUrl);
        }, 1000);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-secondary-600 to-indigo-700"></div>
      
      {/* Animated Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptMCA0djJoLTJ2LTJoMnptLTQgMHYyaC0ydi0yaDJ6bTAgNHYyaC0ydi0yaDJ6bS00LTR2MmgtMnYtMmgyek0zMiAzNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo Section */}
        <div className="text-center mb-8">

          
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            Sistema de Reservas
          </h1>
          <p className="text-xl font-semibold text-white/90">FMPSC - Faculdade Municipal</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20">
          <div className="p-8">
            <h2 className="text-3xl font-black text-gray-800 mb-2">Bem-vindo!</h2>
            <p className="text-gray-600 mb-8 font-medium">Entre com suas credenciais institucionais</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Institucional</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-gray-400 group-hover:text-primary-500 transition-colors" size={20} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '') })}
                    placeholder="seu.nome@fmpsc.edu.br"
                    required
                    className={`input-modern w-full pl-12 pr-4 py-4 border-2 rounded-xl font-medium transition-all ${
                      validation.errors.email
                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                        : 'border-gray-200 focus:border-primary-500'
                    }`}
                  />
                </div>
                {validation.errors.email && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-red-600">
                    <AlertCircle size={15} />
                    {validation.errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Senha (CPF)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-gray-400 group-hover:text-primary-500 transition-colors" size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value.replace(/\s/g, '').slice(0, 11) })}
                    placeholder="Seu CPF (sem pontos)"
                    required
                    maxLength={11}
                    inputMode="numeric"
                    className={`input-modern w-full pl-12 pr-12 py-4 border-2 rounded-xl font-medium transition-all ${
                      validation.errors.password
                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                        : 'border-gray-200 focus:border-primary-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-primary-600"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {validation.errors.password && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold text-red-600">
                    <AlertCircle size={15} />
                    {validation.errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!ready || loading || !validation.isValid}
                className="btn-modern w-full bg-gradient-fmpsc text-white py-4 rounded-xl font-black text-lg shadow-modern hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {!ready ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Preparando...
                  </>
                ) : loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn size={24} />
                    Entrar no Sistema
                  </>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 glass-dark rounded-2xl p-5 border-2 border-primary-200">
              <div className="flex gap-3">
                <AlertCircle className="text-primary-600 flex-shrink-0" size={22} />
                <div className="text-sm text-gray-700">
                  <p className="font-bold mb-2">ℹ️ Primeiro Acesso</p>
                  <ul className="space-y-1 text-gray-600 font-medium">
                    <li>• Use seu email institucional (@fmpsc.edu.br)</li>
                    <li>• Senha padrão: seu CPF (sem pontos ou traços)</li>
                    <li>• Em caso de dúvidas, contate o administrador</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 px-8 py-5 border-t-2 border-primary-100">
            <p className="text-center text-sm text-gray-600 font-semibold">
              🔒 Acesso seguro e criptografado
            </p>
          </div>
        </div>

        <p className="text-center text-white/80 mt-6 font-medium">
          © 2026 FMPSC - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
