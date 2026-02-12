'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';

export default function PerfilPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
  });

  const canEdit = session?.user?.role === 'PROFESSOR' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        setFormData({
          name: data.name,
          email: data.email,
          department: data.department || '',
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!');
        setEditing(false);
        fetchUserData();
      } else {
        toast.error('Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
          <p className="text-gray-600">Visualize e edite suas informações</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-4xl font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userData?.name}</h2>
              <p className="text-gray-600">{userData?.email}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-sm font-bold ${
                userData?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                userData?.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {userData?.role}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nome</label>
              {editing && canEdit ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 outline-none"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 rounded-lg">{userData?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <p className="px-4 py-3 bg-gray-50 rounded-lg">{userData?.email}</p>
              <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">CPF</label>
              <p className="px-4 py-3 bg-gray-50 rounded-lg">{userData?.cpf}</p>
              <p className="text-xs text-gray-500 mt-1">CPF não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Departamento</label>
              {editing && canEdit ? (
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 outline-none"
                  placeholder="Ex: Computação"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 rounded-lg">{userData?.department || 'Não informado'}</p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="mt-8 flex gap-4">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Salvar Alterações
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg"
                >
                  Editar Perfil
                </button>
              )}
            </div>
          )}

          {!canEdit && (
            <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Informação:</strong> Alunos não podem editar informações. Entre em contato com a administração para alterações.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
