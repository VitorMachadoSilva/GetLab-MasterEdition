'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Mail,
  Save,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import { readApiError } from '@/lib/api-client';

interface UserData {
  id: string;
  email: string;
  cpf: string;
  name: string;
  role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' | 'DEMO';
  department?: string | null;
  createdAt?: string;
}

interface Booking {
  id: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';
}

const roleInfo = {
  ADMIN: {
    label: 'Administrador',
    description: 'Acesso completo para aprovar reservas, gerenciar usuários e administrar salas.',
    badge: 'bg-red-100 text-red-800 border-red-200',
  },
  DEMO: {
    label: 'Demo',
    description: 'Acesso amplo para demonstração, sem permissão para alterar dados.',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  PROFESSOR: {
    label: 'Professor',
    description: 'Pode solicitar reservas, acompanhar aprovações e consultar a agenda dos ambientes.',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ALUNO: {
    label: 'Aluno',
    description: 'Pode consultar as reservas e acompanhar a ocupação dos ambientes.',
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
  });

  const canEdit = session?.user?.role === 'PROFESSOR' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    fetchProfileData();
  }, [session?.user?.id, status]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const [userRes, bookingsRes] = await Promise.all([
        fetch(`/api/users/${session?.user?.id}`),
        fetch(
          session?.user?.role === 'ADMIN' || session?.user?.role === 'DEMO'
            ? '/api/bookings'
            : `/api/bookings?professorId=${session?.user?.id}`
        ),
      ]);

      if (!userRes.ok) {
        toast.error(await readApiError(userRes, 'Não foi possível carregar os dados do perfil'));
        return;
      }

      const user = await userRes.json();
      setUserData(user);
      setFormData({
        name: user.name || '',
        department: user.department || '',
      });

      if (bookingsRes.ok) {
        setBookings(await bookingsRes.json());
      } else {
        toast.error(await readApiError(bookingsRes, 'Não foi possível carregar o resumo de reservas'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar o perfil. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Informe seu nome');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          department: formData.department.trim(),
        }),
      });

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!');
        setEditing(false);
        fetchProfileData();
      } else {
        toast.error(await readApiError(res, 'Não foi possível atualizar o perfil'));
      }
    } catch (error) {
      toast.error('Não foi possível atualizar o perfil. Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status === 'PENDENTE').length,
      approved: bookings.filter((booking) => booking.status === 'APROVADA').length,
      rejected: bookings.filter((booking) => booking.status === 'REJEITADA').length,
      canceled: bookings.filter((booking) => booking.status === 'CANCELADA').length,
    };
  }, [bookings]);

  if (loading) return <LoadingSpinner />;

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center border-2 border-white/30 shadow-modern max-w-lg">
          <XCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Perfil não encontrado</h1>
          <p className="text-gray-600 mb-6">Faça login novamente para atualizar sua sessão.</p>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="px-6 py-3 rounded-xl bg-gradient-fmpsc text-white font-bold"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  const role = roleInfo[userData.role];
  const initials = userData.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const memberSince = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('pt-BR')
    : 'Não informado';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="glass rounded-3xl border-2 border-white/30 shadow-modern overflow-hidden" data-tour="perfil-header">
          <div className="bg-gradient-fmpsc p-6 sm:p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-24 h-24 rounded-3xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-4xl font-black shadow-modern">
                  {initials || <User size={42} />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{userData.name}</h1>
                    <span className={`px-3 py-1 rounded-full border text-sm font-black ${role.badge}`}>
                      {role.label}
                    </span>
                  </div>
                  <p className="text-white/85 font-medium max-w-2xl">{role.description}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="px-5 py-3 rounded-xl bg-white/15 border-2 border-white/20 text-white font-bold hover:bg-white/25 transition-all text-center"
                >
                  Voltar ao painel
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 sm:p-8">
            <ProfileMetric icon={CalendarDays} label="Membro desde" value={memberSince} />
            <ProfileMetric icon={Clock3} label="Reservas pendentes" value={stats.pending.toString()} tone="amber" />
            <ProfileMetric icon={CheckCircle2} label="Reservas aprovadas" value={stats.approved.toString()} tone="green" />
            <ProfileMetric icon={ShieldCheck} label="Sessão" value="Ativa" tone="blue" />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <section className="bg-white rounded-2xl border-2 border-gray-200 shadow-modern p-6 sm:p-8" data-tour="perfil-dados">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Dados da Conta</h2>
                <p className="text-gray-600 font-medium">Informações principais usadas no sistema</p>
              </div>

              {canEdit && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-5 py-3 rounded-xl bg-gradient-fmpsc text-white font-bold flex items-center justify-center gap-2 shadow-modern hover:shadow-glow transition-all"
                >
                  <Edit3 size={18} />
                  Editar perfil
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <EditableField
                label="Nome"
                icon={User}
                editing={editing && canEdit}
                value={formData.name}
                displayValue={userData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
              />

              <ReadonlyField label="Email institucional" icon={Mail} value={userData.email} helper="O email não pode ser alterado por aqui." />

              <ReadonlyField label="CPF" icon={FileText} value={userData.cpf} helper="O CPF é usado como senha inicial e identificação." />

              <EditableField
                label="Departamento"
                icon={ShieldCheck}
                editing={editing && canEdit}
                value={formData.department}
                displayValue={userData.department || 'Não informado'}
                placeholder="Ex: Computação"
                onChange={(value) => setFormData({ ...formData, department: value })}
              />
            </div>

            {editing && canEdit && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3" data-tour="perfil-acoes">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: userData.name,
                      department: userData.department || '',
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-fmpsc text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            )}

            {!canEdit && (
              <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4" data-tour="perfil-acoes">
                <p className="text-sm text-blue-900 font-medium">
                  {session?.user?.role === 'DEMO'
                    ? 'Perfil DEMO é somente leitura. Nenhuma alteração pode ser feita nesta conta.'
                    : 'Alunos não podem editar informações. Para solicitar alteração, entre em contato com a administração.'}
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-6" data-tour="perfil-resumo">
            <section className="bg-white rounded-2xl border-2 border-gray-200 shadow-modern p-6">
              <h2 className="text-xl font-black text-gray-900 mb-4">Resumo de Reservas</h2>
              <div className="space-y-3">
                <StatusRow label="Total" value={stats.total} />
                <StatusRow label="Pendentes" value={stats.pending} color="text-amber-700" />
                <StatusRow label="Aprovadas" value={stats.approved} color="text-green-700" />
                <StatusRow label="Rejeitadas" value={stats.rejected} color="text-red-700" />
                <StatusRow label="Canceladas" value={stats.canceled} color="text-gray-600" />
              </div>
            </section>

            <section className="bg-white rounded-2xl border-2 border-gray-200 shadow-modern p-6">
              <h2 className="text-xl font-black text-gray-900 mb-3">Permissões</h2>
              <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">{role.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-bold">Dashboard</span>
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-bold">Display</span>
                {(userData.role === 'PROFESSOR' || userData.role === 'ADMIN' || userData.role === 'DEMO') && (
                  <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-bold">Reservas</span>
                )}
                {(userData.role === 'ADMIN' || userData.role === 'DEMO') && (
                  <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-bold">Administração</span>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ProfileMetric({
  icon: Icon,
  label,
  value,
  tone = 'gray',
}: {
  icon: any;
  label: string;
  value: string;
  tone?: 'gray' | 'amber' | 'green' | 'blue';
}) {
  const toneClasses = {
    gray: 'bg-gray-50 text-gray-800',
    amber: 'bg-amber-50 text-amber-800',
    green: 'bg-green-50 text-green-800',
    blue: 'bg-blue-50 text-blue-800',
  };

  return (
    <div className={`rounded-2xl border-2 border-white/70 p-4 ${toneClasses[tone]}`}>
      <Icon size={22} className="mb-3" />
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm font-semibold opacity-80">{label}</div>
    </div>
  );
}

function ReadonlyField({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: any;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-black text-gray-700 mb-2">
        <Icon size={16} className="text-primary-600" />
        {label}
      </label>
      <p className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-semibold text-gray-800 break-words">{value}</p>
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  );
}

function EditableField({
  icon: Icon,
  label,
  editing,
  value,
  displayValue,
  placeholder,
  onChange,
}: {
  icon: any;
  label: string;
  editing: boolean;
  value: string;
  displayValue: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-black text-gray-700 mb-2">
        <Icon size={16} className="text-primary-600" />
        {label}
      </label>
      {editing ? (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
        />
      ) : (
        <p className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-semibold text-gray-800">{displayValue}</p>
      )}
    </div>
  );
}

function StatusRow({
  label,
  value,
  color = 'text-gray-900',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-sm font-bold text-gray-600">{label}</span>
      <span className={`text-lg font-black ${color}`}>{value}</span>
    </div>
  );
}
