'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface BookingConflict {
  startTime: string;
  endTime: string;
  status: 'APROVADA' | 'PENDENTE';
}

const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

// Retorna o status de conflito de um slot (null = livre, 'APROVADA' = bloqueado, 'PENDENTE' = solicitação)
function getSlotStatus(slot: string, conflicts: BookingConflict[]): 'APROVADA' | 'PENDENTE' | null {
  const [slotH] = slot.split(':').map(Number);
  const slotMinutes = slotH * 60;

  for (const conflict of conflicts) {
    const [startH, startM] = conflict.startTime.split(':').map(Number);
    const [endH, endM] = conflict.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // O slot está ocupado se seu início está dentro do intervalo [start, end)
    if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
      return conflict.status;
    }
  }
  return null;
}

// Retorna true se o slot viola a regra de 24h de antecedência
function isSlotTooSoon(slot: string, date: string, serverNow: number): boolean {
  if (!date || !serverNow) return false;
  const [year, month, day] = date.split('-').map(Number);
  const [slotH, slotM] = slot.split(':').map(Number);
  const slotDateTime = new Date(year, month - 1, day, slotH, slotM, 0, 0);
  const hoursDiff = (slotDateTime.getTime() - serverNow) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

function TimeSlotSelector({
  label,
  value,
  onChange,
  conflicts,
  otherValue,
  isStart,
  error,
  date,
  serverNow,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  conflicts: BookingConflict[];
  otherValue: string;
  isStart: boolean;
  error?: string;
  date: string;
  serverNow: number;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
        {/* <Clock size={18} className="text-primary-500" /> */}
        {label} *
      </label>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
          Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />
          Solicitação
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          Reservada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" />
          Indisponível
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {timeSlots.map((slot) => {
          const conflictStatus = getSlotStatus(slot, conflicts);
          const tooSoon = isSlotTooSoon(slot, date, serverNow);
          const isBlocked = conflictStatus !== null || tooSoon;
          const isSelected = value === slot;

          // Highlight selected range
          let isInRange = false;
          if (otherValue && value) {
            const slotH = parseInt(slot.split(':')[0]);
            if (isStart) {
              const endH = parseInt(otherValue.split(':')[0]);
              const startH = parseInt(value.split(':')[0]);
              isInRange = slotH >= startH && slotH < endH;
            } else {
              const startH = parseInt(otherValue.split(':')[0]);
              const endH = parseInt(value.split(':')[0]);
              isInRange = slotH >= startH && slotH < endH;
            }
          }

          let bgClass = '';
          let textClass = '';
          let borderClass = '';
          let cursorClass = 'cursor-pointer';
          let title = 'Disponível';
          let dotColor = '';

          if (tooSoon) {
            cursorClass = 'cursor-not-allowed';
            bgClass = 'bg-gray-100';
            textClass = 'text-gray-400';
            borderClass = 'border-gray-300';
            title = 'Menos de 24h de antecedência';
          } else if (conflictStatus !== null) {
            cursorClass = 'cursor-not-allowed';
            if (conflictStatus === 'APROVADA') {
              bgClass = 'bg-red-100';
              textClass = 'text-red-700';
              borderClass = 'border-red-400';
              dotColor = 'bg-red-500';
              title = 'Horário reservado (aprovado)';
            } else {
              bgClass = 'bg-orange-100';
              textClass = 'text-orange-700';
              borderClass = 'border-orange-400';
              dotColor = 'bg-orange-400';
              title = 'Horário com solicitação pendente';
            }
          } else if (isSelected) {
            bgClass = 'bg-primary-600';
            textClass = 'text-white';
            borderClass = 'border-primary-700';
          } else if (isInRange) {
            bgClass = 'bg-primary-100';
            textClass = 'text-primary-700';
            borderClass = 'border-primary-300';
          } else {
            bgClass = 'bg-green-50 hover:bg-green-100';
            textClass = 'text-green-800';
            borderClass = 'border-green-300';
          }

          return (
            <button
              key={slot}
              type="button"
              title={title}
              disabled={isBlocked}
              onClick={() => !isBlocked && onChange(slot)}
              className={`
                relative px-2 py-2.5 rounded-lg border-2 text-xs font-bold
                transition-all duration-150 select-none
                ${bgClass} ${textClass} ${borderClass} ${cursorClass}
                ${isSelected ? 'shadow-md scale-105 ring-2 ring-primary-300' : ''}
                ${isBlocked ? 'opacity-80' : ''}
              `}
            >
              {slot}
              {/* Indicador de status no canto (só para conflitos) */}
              {conflictStatus && !tooSoon && (
                <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {error}</p>
      )}
    </div>
  );
}

export default function NovaReservaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [conflicts, setConflicts] = useState<BookingConflict[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [serverNow, setServerNow] = useState<number>(Date.now());

  const [formData, setFormData] = useState({
    roomId: '',
    course: '',
    startTime: '',
    endTime: '',
    date: '',
    students: '',
    notes: '',
  });

  // Inicializar data de amanhã usando horário do servidor e capturar serverNow
  useEffect(() => {
    const initializeDate = async () => {
      try {
        const res = await fetch('/api/time');
        const serverTime = await res.json();
        setServerNow(serverTime.timestamp);
        const tomorrow = new Date(serverTime.timestamp + 86400000);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
      } catch {
        const now = Date.now();
        setServerNow(now);
        const tomorrow = new Date(now + 86400000);
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

  // Buscar conflitos sempre que sala ou data mudarem
  const fetchConflicts = useCallback(async (roomId: string, date: string) => {
    if (!roomId || !date) {
      setConflicts([]);
      return;
    }
    setLoadingConflicts(true);
    try {
      const res = await fetch(`/api/bookings?roomId=${roomId}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        // Mapear para o formato que precisamos
        const mapped: BookingConflict[] = data
          .filter((b: any) => b.status === 'APROVADA' || b.status === 'PENDENTE')
          .map((b: any) => ({
            startTime: b.startTime,
            endTime: b.endTime,
            status: b.status,
          }));
        setConflicts(mapped);
      }
    } catch {
      // Silencioso, não crítico
    } finally {
      setLoadingConflicts(false);
    }
  }, []);

  useEffect(() => {
    fetchConflicts(formData.roomId, formData.date);
    // Limpar horários selecionados ao trocar sala/data
    setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
  }, [formData.roomId, formData.date, fetchConflicts]);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      } else {
        toast.error('Erro ao carregar salas');
      }
    } catch {
      toast.error('Erro ao carregar salas');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: { [key: string]: string } = {};

    if (formData.startTime) {
      try {
        const res = await fetch('/api/time');
        const serverTime = await res.json();
        const freshNow = serverTime.timestamp;
        setServerNow(freshNow);
        const now = new Date(freshNow);

        const [year, month, day] = formData.date.split('-').map(Number);
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const bookingDateTime = new Date(year, month - 1, day, startH, startM, 0, 0);

        const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
          newErrors.date = 'Mínimo 24h de antecedência';
          newErrors.startTime = 'Mínimo 24h de antecedência';
          toast.error('⚠️ A reserva deve ser feita com no mínimo 24 horas de antecedência');
        }
      } catch {
        console.error('Erro ao validar horário');
      }
    }

    if (formData.startTime && formData.endTime) {
      const [startHour] = formData.startTime.split(':').map(Number);
      const [endHour] = formData.endTime.split(':').map(Number);
      const durationMinutes = (endHour - startHour) * 60;

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
    if (!isValid) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Solicitação de reserva enviada com sucesso!');
        setTimeout(() => {
          router.push('/professor/minhas-reservas');
        }, 1500);
      } else if (res.status === 409) {
        toast.error('Conflito de horário detectado! Escolha outro horário.');
      } else {
        toast.error(data.error || 'Erro ao criar reserva');
      }
    } catch {
      toast.error('Erro ao criar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const showTimeSlots = formData.roomId && formData.date;

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

            {/* Horários com visualização de conflitos */}
            {!showTimeSlots ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400">
                <Clock size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold">Selecione uma sala e uma data para ver os horários disponíveis</p>
              </div>
            ) : (
              <div className="border-2 border-gray-100 rounded-xl p-5 bg-gray-50 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={18} className="text-primary-500" />
                    Horários Disponíveis
                  </h3>
                  {loadingConflicts && (
                    <span className="text-xs text-gray-500 animate-pulse">Carregando disponibilidade...</span>
                  )}
                </div>

                {/* Resumo dos conflitos (se houver) */}
                {conflicts.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1.5">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Ocupações nesta data</p>
                    {conflicts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            c.status === 'APROVADA' ? 'bg-red-500' : 'bg-orange-400'
                          }`}
                        />
                        <span className="font-semibold text-gray-700">
                          {c.startTime} – {c.endTime}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'APROVADA'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {c.status === 'APROVADA' ? 'Aprovada' : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TimeSlotSelector
                    label="Horário de Início"
                    value={formData.startTime}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, startTime: val }));
                      setErrors(prev => ({ ...prev, startTime: '', endTime: '' }));
                    }}
                    conflicts={conflicts}
                    otherValue={formData.endTime}
                    isStart={true}
                    error={errors.startTime}
                    date={formData.date}
                    serverNow={serverNow}
                  />

                  <TimeSlotSelector
                    label="Horário de Término"
                    value={formData.endTime}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, endTime: val }));
                      setErrors(prev => ({ ...prev, endTime: '' }));
                    }}
                    conflicts={conflicts}
                    otherValue={formData.startTime}
                    isStart={false}
                    error={errors.endTime}
                    date={formData.date}
                    serverNow={serverNow}
                  />
                </div>

                {/* Resumo da seleção */}
                {formData.startTime && formData.endTime && formData.endTime > formData.startTime && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-sm text-primary-800 font-semibold text-center">
                    Período selecionado: <strong>{formData.startTime}</strong> até <strong>{formData.endTime}</strong>
                    {' '}({parseInt(formData.endTime) - parseInt(formData.startTime)}h de duração)
                  </div>
                )}
              </div>
            )}

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