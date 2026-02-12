'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';

export default function GerenciarSalasPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', type: 'SALA_AULA', capacity: '', building: '', floor: '', equipment: ''
  });

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      } else {
        toast.error('Erro ao carregar salas');
      }
    } catch (error) {
      toast.error('Erro ao carregar salas');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({ name: '', type: 'SALA_AULA', capacity: '', building: '', floor: '', equipment: '' });
    setShowModal(true);
  };

  const openEditModal = (room: any) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity.toString(),
      building: room.building,
      floor: room.floor?.toString() || '',
      equipment: room.equipment?.join(', ') || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData({ name: '', type: 'SALA_AULA', capacity: '', building: '', floor: '', equipment: '' });
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sala "${roomName}"?\n\nEsta ação não pode ser desfeita!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('✅ Sala excluída com sucesso!');
        fetchRooms();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao excluir sala');
      }
    } catch (error) {
      toast.error('Erro ao excluir sala');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const equipment = formData.equipment.split(',').map(e => e.trim()).filter(Boolean);
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        floor: formData.floor ? parseInt(formData.floor) : null,
        equipment
      };

      const url = editingRoom ? `/api/rooms/${editingRoom.id}` : '/api/rooms';
      const method = editingRoom ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingRoom ? '✅ Sala atualizada com sucesso!' : '✅ Sala criada com sucesso!');
        closeModal();
        fetchRooms();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao salvar sala');
      }
    } catch (error) {
      toast.error('Erro ao salvar sala');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Gerenciar Salas</h1>
            <p className="text-gray-600 mt-2">Adicione e gerencie salas e laboratórios</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Sala
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="text-3xl font-black text-gray-900">{rooms.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total de Salas</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="text-3xl font-black text-blue-800">{rooms.filter(r => r.type === 'LABORATORIO').length}</div>
            <div className="text-sm text-blue-700 font-medium">Laboratórios</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="text-3xl font-black text-green-800">{rooms.filter(r => r.type === 'SALA_AULA').length}</div>
            <div className="text-sm text-green-700 font-medium">Salas de Aula</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="text-3xl font-black text-purple-800">{rooms.filter(r => r.type === 'AUDITORIO').length}</div>
            <div className="text-sm text-purple-700 font-medium">Auditórios</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                    room.type === 'LABORATORIO' ? 'bg-blue-100 text-blue-700' :
                    room.type === 'AUDITORIO' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {room.type === 'LABORATORIO' ? 'Laboratório' : 
                     room.type === 'AUDITORIO' ? 'Auditório' : 'Sala de Aula'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <strong className="text-gray-900">Capacidade:</strong> {room.capacity} pessoas
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary-500" />
                  <strong className="text-gray-900">Local:</strong> {room.building}
                  {room.floor && ` - ${room.floor}º andar`}
                </div>
                {room.equipment?.length > 0 && (
                  <div>
                    <strong className="text-gray-900">Equipamentos:</strong>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.equipment.map((eq: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => openEditModal(room)}
                  className="flex-1 px-4 py-2 bg-primary-50 text-primary-700 font-semibold rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(room.id, room.name)}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
            <MapPin size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-500 mb-4">Nenhuma sala cadastrada</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Cadastrar Primeira Sala
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{editingRoom ? 'Editar Sala' : 'Nova Sala'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Sala *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Lab de Informática 1" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    required 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Sala *</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})} 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none"
                  >
                    <option value="SALA_AULA">Sala de Aula</option>
                    <option value="LABORATORIO">Laboratório</option>
                    <option value="AUDITORIO">Auditório</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Capacidade *</label>
                    <input 
                      type="number" 
                      placeholder="40" 
                      value={formData.capacity} 
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                      required 
                      min="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Prédio *</label>
                    <input 
                      type="text" 
                      placeholder="Bloco A" 
                      value={formData.building} 
                      onChange={(e) => setFormData({...formData, building: e.target.value})} 
                      required 
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Andar</label>
                    <input 
                      type="number" 
                      placeholder="1" 
                      value={formData.floor} 
                      onChange={(e) => setFormData({...formData, floor: e.target.value})} 
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Equipamentos (separados por vírgula)</label>
                  <textarea
                    placeholder="Ex: Computadores, Projetor, Ar Condicionado"
                    value={formData.equipment} 
                    onChange={(e) => setFormData({...formData, equipment: e.target.value})} 
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none resize-none" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Separe múltiplos equipamentos com vírgula</p>
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
                    {editingRoom ? 'Atualizar' : 'Criar'}
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
