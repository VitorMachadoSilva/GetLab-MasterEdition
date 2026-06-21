'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Edit2,
  Filter,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import { readApiError } from '@/lib/api-client';

type UserRole = 'TODOS' | 'ALUNO' | 'PROFESSOR' | 'ADMIN';

type User = {
  id: string;
  email: string;
  cpf: string;
  name: string;
  role: Exclude<UserRole, 'TODOS'>;
  department?: string | null;
  _count?: {
    bookingsCreated: number;
  };
};

type UserFormData = {
  email: string;
  cpf: string;
  name: string;
  role: Exclude<UserRole, 'TODOS'>;
  department: string;
};

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PROFESSOR', label: 'Professores' },
  { value: 'ALUNO', label: 'Alunos' },
  { value: 'ADMIN', label: 'Admins' },
];

const emptyForm: UserFormData = {
  email: '',
  cpf: '',
  name: '',
  role: 'ALUNO',
  department: '',
};

export default function GerenciarUsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole>('TODOS');
  const [formData, setFormData] = useState<UserFormData>(emptyForm);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      } else {
        toast.error(await readApiError(res, 'Não foi possível carregar os usuários'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar os usuários. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      cpf: user.cpf,
      name: user.name,
      role: user.role,
      department: user.department || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(emptyForm);
  };

  const validateForm = () => {
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    const keepsSystemAdminCpf = editingUser?.cpf === 'ADMIN' && formData.cpf === 'ADMIN';

    if (!formData.name.trim()) {
      toast.error('Informe o nome completo');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Informe o email institucional');
      return false;
    }

    if (!keepsSystemAdminCpf && cpfNumbers.length !== 11) {
      toast.error('CPF deve ter 11 números');
      return false;
    }

    return true;
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Usuário excluído com sucesso!');
        fetchUsers();
      } else {
        toast.error(await readApiError(res, 'Não foi possível excluir o usuário'));
      }
    } catch (error) {
      toast.error('Não foi possível excluir o usuário. Verifique sua conexão e tente novamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const keepsSystemAdminCpf = editingUser?.cpf === 'ADMIN' && formData.cpf === 'ADMIN';
      const payload = {
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        role: formData.role,
        department: formData.department.trim(),
        ...(keepsSystemAdminCpf ? {} : { cpf: formData.cpf.replace(/\D/g, '') }),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        closeModal();
        fetchUsers();
      } else {
        toast.error(await readApiError(res, 'Não foi possível salvar o usuário'));
      }
    } catch (error) {
      toast.error('Não foi possível salvar o usuário. Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'TODOS' || user.role === roleFilter;
      const matchesSearch = !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.cpf.includes(query) ||
        (user.department || '').toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  const stats = {
    total: users.length,
    professors: users.filter((user) => user.role === 'PROFESSOR').length,
    students: users.filter((user) => user.role === 'ALUNO').length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" data-tour="admin-usuarios-header">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-2">Adicione e gerencie usuários do sistema</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 font-bold text-white transition-all hover:shadow-lg"
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total" value={stats.total} />
          <MetricCard label="Professores" value={stats.professors} tone="blue" />
          <MetricCard label="Alunos" value={stats.students} tone="green" />
          <MetricCard label="Admins" value={stats.admins} tone="red" />
        </div>

        <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm" data-tour="admin-usuarios-filtros">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <label className="relative block">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, email, CPF ou departamento..."
                className="w-full rounded-xl border-2 border-gray-200 py-3 pl-11 pr-4 font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm font-bold text-gray-600">
                <Filter size={16} />
                Tipo
              </span>
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRoleFilter(option.value)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                    roleFilter === option.value
                      ? 'border-primary-500 bg-primary-600 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-500">
            Mostrando {filteredUsers.length} de {users.length} usuário(s).
          </p>
        </div>

        {filteredUsers.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-xl lg:block" data-tour="admin-usuarios-lista">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">CPF</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">Departamento</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">Reservas</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold">{user.name}</td>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.cpf}</td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4 text-sm">{user.department || '-'}</td>
                        <td className="px-6 py-4 text-sm font-bold">{user._count?.bookingsCreated || 0}</td>
                        <td className="px-6 py-4">
                          <UserActions user={user} onEdit={openEditModal} onDelete={handleDelete} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 lg:hidden" data-tour="admin-usuarios-lista">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black text-gray-900">{user.name}</h2>
                      <p className="break-words text-sm font-semibold text-gray-500">{user.email}</p>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="grid gap-2 text-sm text-gray-700">
                    <InfoRow label="CPF" value={user.cpf} />
                    <InfoRow label="Departamento" value={user.department || 'Não informado'} />
                    <InfoRow label="Reservas" value={`${user._count?.bookingsCreated || 0}`} />
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <UserActions user={user} onEdit={openEditModal} onDelete={handleDelete} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Ajuste a busca ou limpe os filtros para visualizar os usuários cadastrados."
            onCreate={openCreateModal}
          />
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                  <p className="text-sm text-gray-600">
                    {editingUser ? 'Atualize os dados do usuário selecionado.' : 'Cadastre um usuário com email institucional e CPF de acesso.'}
                  </p>
                </div>
                <button onClick={closeModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    placeholder="João da Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    maxLength={100}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Usuário *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserFormData['role'] })}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  >
                    <option value="ALUNO">Aluno</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                  <RoleHint role={formData.role} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Institucional *</label>
                  <input
                    type="email"
                    placeholder={formData.role === 'ALUNO' ? 'aluno@aluno.fmpsc.edu.br' : 'usuario@fmpsc.edu.br'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">CPF (sem pontos ou traços) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="12345678900"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                    required
                    maxLength={11}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  />
                  {editingUser && (
                    <p className="mt-2 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                      <AlertCircle size={14} />
                      Alterar CPF muda a senha de acesso do usuário.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Departamento (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Computação, Matemática..."
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    maxLength={80}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 font-bold text-white transition-all hover:shadow-lg disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: number;
  tone?: 'gray' | 'blue' | 'green' | 'red';
}) {
  const toneClasses = {
    gray: 'bg-white border-gray-200 text-gray-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${toneClasses[tone]}`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm font-semibold opacity-80">{label}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: User['role'] }) {
  const classes = {
    ADMIN: 'bg-red-100 text-red-800',
    PROFESSOR: 'bg-blue-100 text-blue-800',
    ALUNO: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-black ${classes[role]}`}>
      {role}
    </span>
  );
}

function RoleHint({ role }: { role: UserFormData['role'] }) {
  const text = {
    ALUNO: 'Alunos devem usar email @aluno.fmpsc.edu.br.',
    PROFESSOR: 'Professores devem usar email @fmpsc.edu.br.',
    ADMIN: 'Administradores usam email institucional e têm acesso completo ao sistema.',
  };

  return (
    <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
      {text[role]}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
      <span className="text-xs font-black uppercase text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function UserActions({
  user,
  onEdit,
  onDelete,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onEdit(user)}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-50 px-3 py-2 font-bold text-primary-700 transition-colors hover:bg-primary-100 lg:flex-none"
        title="Editar usuário"
      >
        <Edit2 size={18} />
        <span className="lg:hidden">Editar</span>
      </button>
      <button
        onClick={() => onDelete(user)}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 font-bold text-red-700 transition-colors hover:bg-red-100 lg:flex-none"
        title="Excluir usuário"
      >
        <Trash2 size={18} />
        <span className="lg:hidden">Excluir</span>
      </button>
    </div>
  );
}

function EmptyState({
  title,
  description,
  onCreate,
}: {
  title: string;
  description: string;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
      <Users size={48} className="mx-auto mb-4 text-gray-300" />
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-3 font-bold text-white"
      >
        <UserPlus size={18} />
        Novo Usuário
      </button>
    </div>
  );
}
