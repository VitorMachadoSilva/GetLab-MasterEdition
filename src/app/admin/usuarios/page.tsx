'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import { readApiError } from '@/lib/api-client';

export default function GerenciarUsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '', cpf: '', name: '', role: 'ALUNO', department: ''
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
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
    setFormData({ email: '', cpf: '', name: '', role: 'ALUNO', department: '' });
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      cpf: user.cpf,
      name: user.name,
      role: user.role,
      department: user.department || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ email: '', cpf: '', name: '', role: 'ALUNO', department: '' });
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('✅ Usuário excluído com sucesso!');
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
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        toast.success(editingUser ? '✅ Usuário atualizado com sucesso!' : '✅ Usuário criado com sucesso!');
        closeModal();
        fetchUsers();
      } else {
        toast.error(await readApiError(res, 'Não foi possível salvar o usuário'));
      }
    } catch (error) {
      toast.error('Não foi possível salvar o usuário. Verifique sua conexão e tente novamente.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-2">Adicione e gerencie usuários do sistema</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="text-3xl font-black text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="text-3xl font-black text-blue-800">{users.filter(u => u.role === 'PROFESSOR').length}</div>
            <div className="text-sm text-blue-700 font-medium">Professores</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="text-3xl font-black text-green-800">{users.filter(u => u.role === 'ALUNO').length}</div>
            <div className="text-sm text-green-700 font-medium">Alunos</div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
            <div className="text-3xl font-black text-red-800">{users.filter(u => u.role === 'ADMIN').length}</div>
            <div className="text-sm text-red-700 font-medium">Admins</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden border-2 border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">CPF</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Tipo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Departamento</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{user.name}</td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4 text-sm">{user.cpf}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.department || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Institucional *</label>
                  <input 
                    type="email" 
                    placeholder="usuario@fmpsc.edu.br" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    required 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">CPF (sem pontos ou traços) *</label>
                  <input 
                    type="text" 
                    placeholder="12345678900" 
                    value={formData.cpf} 
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})} 
                    required 
                    maxLength={11}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                  />
                  {editingUser && <p className="text-xs text-orange-600 mt-1 font-semibold">⚠️ Alterar CPF mudará a senha de acesso do usuário</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Usuário *</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  >
                    <option value="ALUNO">Aluno</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Departamento (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Computação, Matemática..." 
                    value={formData.department} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
                  >
                    {editingUser ? 'Atualizar' : 'Criar'}
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
