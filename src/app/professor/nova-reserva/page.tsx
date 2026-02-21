'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Calendar, Clock, Users, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  building: string;
}

const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

export default function NovaReservaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    roomId: '',
    course: '',
    startTime: '',
    endTime: '',
    date: '', // Será preenchido após sincronizar com servidor
    students: '',
    notes: '',
  });

  // Inicializar data de amanhã usando horário do servidor
  useEffect(() => {
    const initializeDate = async () => {
      try {
        const res = await fetch('/api/time');
        const serverTime = await res.json();
        const tomorrow = new Date(serverTime.timestamp + 86400000); // +1 dia
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
      } catch (error) {
        // Fallback para horário local
        const tomorrow = new Date(Date.now() + 86400000);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
      }
    };
    initializeDate();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
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

  const validateForm = async (): Promise<boolean> => {
    const newErrors: {[key: string]: string} = {};

    // Validação de data/hora: mínimo 24h de antecedência (usando horário do servidor)
    if (formData.startTime) {
      try {
        // Buscar horário do servidor
        const res = await fetch('/api/time');
        const serverTime = await res.json();
        const now = new Date(serverTime.timestamp);
        
        // Criar data no timezone local (sem conversão UTC)
        const [year, month, day] = formData.date.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const [startH, startM] = formData.startTime.split(':').map(Number);
        
        // Criar data/hora completa da reserva
        const bookingDateTime = new Date(selectedDate);
        bookingDateTime.setHours(startH, startM, 0, 0);
        
        const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          newErrors.date = 'Mínimo 24h de antecedência';
          newErrors.startTime = 'Mínimo 24h de antecedência';
          toast.error('⚠️ A reserva deve ser feita com no mínimo 24 horas de antecedência');
        }
      } catch (error) {
        console.error('Erro ao validar horário:', error);
      }
    }

    // Validação de horário: mínimo 1 hora de duração
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationMinutes = endMinutes - startMinutes;

      if (durationMinutes < 60) {
        newErrors.startTime = 'Duração mínima: 1 hora';
        newErrors.endTime = 'Duração mínima: 1 hora';
        toast.error('⚠️ A reserva deve ter no mínimo 1 hora de duração');
      }

      if (formData.endTime <= formData.startTime) {
        newErrors.endTime = 'Horário de término deve ser após o início';
        toast.error('⚠️ Horário de término deve ser após o horário de início');
      }
    }

    // Validação de capacidade
    const selectedRoom = rooms.find(r => r.id === formData.roomId);
    if (selectedRoom && formData.students && parseInt(formData.students) > selectedRoom.capacity) {
      newErrors.students = `Sala comporta apenas ${selectedRoom.capacity} alunos`;
      toast.error(`⚠️ Sala comporta apenas ${selectedRoom.capacity} alunos`);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('✅ Solicitação de reserva enviada com sucesso!');
        setTimeout(() => {
          router.push('/professor/minhas-reservas');
        }, 1500);
      } else if (res.status === 409) {
        toast.error('❌ Conflito de horário detectado! Escolha outro horário.');
      } else {
        toast.error(data.error || 'Erro ao criar reserva');
      }
    } catch (error) {
      toast.error('Erro ao criar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const selectedRoom = rooms.find(r => r.id === formData.roomId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2 font-semibold transition-colors"
          >
            ← Voltar
          </button>
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary-100">
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Nova Solicitação de Reserva
            </h1>
            <p className="text-gray-600">
              Preencha os dados abaixo para solicitar uma reserva
            </p>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={22} />
            <div className="text-sm text-blue-900">
              <p className="font-bold mb-2">⚠️ Regras Importantes:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li><strong>24 horas de antecedência:</strong> Considere data + horário de início da aula</li>
                <li><strong>Duração mínima:</strong> A reserva deve ter no mínimo 1 hora</li>
                <li><strong>Aprovação:</strong> Sua solicitação será enviada para aprovação do administrador</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100">
          <div className="space-y-6">
            {/* Sala */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <MapPin size={18} className="text-primary-500" />
                Sala/Laboratório *
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => {
                  setFormData({ ...formData, roomId: e.target.value });
                  setErrors({ ...errors, roomId: '' });
                }}
                required
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all font-medium ${
                  errors.roomId ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                }`}
              >
                <option value="">Selecione uma sala...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - {room.building} (Capacidade: {room.capacity} pessoas)
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  📍 <strong>{selectedRoom.type}</strong> • Capacidade: {selectedRoom.capacity} pessoas
                </p>
              )}
            </div>

            {/* Disciplina */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <FileText size={18} className="text-primary-500" />
                Disciplina/Evento *
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => {
                  setFormData({ ...formData, course: e.target.value });
                  setErrors({ ...errors, course: '' });
                }}
                placeholder="Ex: Programação Web, Seminário de TCC..."
                required
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                  errors.course ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                }`}
              />
            </div>

            {/* Data e Alunos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Calendar size={18} className="text-primary-500" />
                  Data da Reserva *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ ...formData, date: e.target.value });
                    setErrors({ ...errors, date: '' });
                  }}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  required
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                    errors.date ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                  }`}
                />
                {errors.date && (
                  <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {errors.date}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Users size={18} className="text-primary-500" />
                  Número de Alunos *
                </label>
                <input
                  type="number"
                  value={formData.students}
                  onChange={(e) => {
                    setFormData({ ...formData, students: e.target.value });
                    setErrors({ ...errors, students: '' });
                  }}
                  placeholder="30"
                  min="1"
                  required
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                    errors.students ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                  }`}
                />
                {errors.students && (
                  <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {errors.students}</p>
                )}
              </div>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Clock size={18} className="text-primary-500" />
                  Horário de Início *
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                    setErrors({ ...errors, startTime: '', endTime: '' });
                  }}
                  required
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                    errors.startTime ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                  }`}
                >
                  <option value="">Selecione...</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {errors.startTime && (
                  <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {errors.startTime}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Clock size={18} className="text-primary-500" />
                  Horário de Término *
                </label>
                <select
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    setErrors({ ...errors, endTime: '' });
                  }}
                  required
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                    errors.endTime ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                  }`}
                >
                  <option value="">Selecione...</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {errors.endTime && (
                  <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <FileText size={18} className="text-primary-500" />
                Observações (Opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais sobre a reserva..."
                rows={4}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Enviando...'
              ) : (
                <>
                  <Plus size={20} />
                  Enviar Solicitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
