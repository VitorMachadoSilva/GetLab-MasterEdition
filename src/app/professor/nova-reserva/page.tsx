'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, Calendar, Clock, Users, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import { readApiError } from '@/lib/api-client';

interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  building: string;
}

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  status: string;
  room: {
    id: string;
    name: string;
  };
}

const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

const startTimeSlots = timeSlots.slice(0, -1);
const endTimeSlots = timeSlots.slice(1);

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const rangesOverlap = (
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) => timeToMinutes(firstStart) < timeToMinutes(secondEnd) &&
  timeToMinutes(firstEnd) > timeToMinutes(secondStart);

const getLocalDateInputValue = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDateInput = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getDateOptions = (startDate: string, days = 7) => {
  const firstDate = parseLocalDateInput(startDate);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);

    const value = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    return {
      value,
      day: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    };
  });
};

const getRoomTypeLabel = (type: string) => {
  switch (type) {
    case 'LABORATORIO':
      return 'Laboratório';
    case 'AUDITORIO':
      return 'Auditório';
    case 'SALA_AULA':
      return 'Sala de Aula';
    default:
      return type;
  }
};

export default function NovaReservaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    roomId: '',
    course: '',
    startTime: '',
    endTime: '',
    date: getLocalDateInputValue(1),
    students: '',
    notes: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (formData.roomId && formData.date) {
      fetchAvailability();
    } else {
      setBookings([]);
    }
  }, [formData.roomId, formData.date]);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      } else {
        toast.error(await readApiError(res, 'Não foi possível carregar as salas'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar as salas. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    setAvailabilityLoading(true);

    try {
      const res = await fetch(`/api/bookings?date=${formData.date}&roomId=${formData.roomId}`);

      if (res.ok) {
        const data = await res.json();
        setBookings(
          data.filter((booking: Booking) =>
            booking.status === 'PENDENTE' || booking.status === 'APROVADA'
          )
        );
      } else {
        toast.error(await readApiError(res, 'Não foi possível carregar a disponibilidade'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar a disponibilidade. Tente atualizar a agenda.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const getConflictingBookings = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      return [];
    }

    return bookings.filter((booking) =>
      rangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );
  };

  const isSlotBusy = (startTime: string, endTime: string) =>
    bookings.some((booking) =>
      rangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validação de data/hora: mínimo 24h de antecedência
    if (formData.startTime) {
      // Criar data no timezone local (sem conversão UTC)
      const [year, month, day] = formData.date.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const [startH, startM] = formData.startTime.split(':').map(Number);
      
      // Criar data/hora completa da reserva
      const bookingDateTime = new Date(selectedDate);
      bookingDateTime.setHours(startH, startM, 0, 0);
      
      const now = new Date();
      const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff <= 0) {
        newErrors.date = 'Data ou horário já passou';
        newErrors.startTime = 'Data ou horário já passou';
        toast.error('⚠️ Não é possível reservar data ou horário já passado');
      } else if (session?.user?.role !== 'ADMIN' && hoursDiff < 24) {
        newErrors.date = 'Mínimo 24h de antecedência';
        newErrors.startTime = 'Mínimo 24h de antecedência';
        toast.error('⚠️ A reserva deve ser feita com no mínimo 24 horas de antecedência');
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

      const conflictingBookings = getConflictingBookings(formData.startTime, formData.endTime);

      if (conflictingBookings.length > 0) {
        newErrors.startTime = 'Horário indisponível';
        newErrors.endTime = 'Horário indisponível';
        toast.error('❌ Este horário já possui reserva pendente ou aprovada');
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
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('✅ Solicitação de reserva enviada com sucesso!');
        setTimeout(() => {
          router.push('/professor/minhas-reservas');
        }, 1500);
      } else if (res.status === 409) {
        toast.error(await readApiError(res, 'Conflito de horário detectado. Escolha outro horário.'));
      } else {
        toast.error(await readApiError(res, 'Não foi possível criar a reserva'));
      }
    } catch (error) {
      toast.error('Não foi possível criar a reserva. Verifique sua conexão e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const isAdmin = session?.user?.role === 'ADMIN';
  const minDate = isAdmin ? getLocalDateInputValue() : getLocalDateInputValue(1);
  const selectedConflicts = getConflictingBookings(formData.startTime, formData.endTime);
  const availabilitySlots = startTimeSlots.map((startTime, index) => ({
    startTime,
    endTime: timeSlots[index + 1],
    busyBookings: bookings.filter((booking) =>
      rangesOverlap(startTime, timeSlots[index + 1], booking.startTime, booking.endTime)
    ),
  }));
  const sortedBookings = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const quickDateOptions = getDateOptions(minDate, 7);
  const busySlotsCount = availabilitySlots.filter((slot) => slot.busyBookings.length > 0).length;
  const freeSlotsCount = availabilitySlots.length - busySlotsCount;
  const occupancyPercentage = Math.round((busySlotsCount / availabilitySlots.length) * 100);
  const selectedDuration = formData.startTime && formData.endTime
    ? (timeToMinutes(formData.endTime) - timeToMinutes(formData.startTime)) / 60
    : 0;

  const handleDateChange = (date: string) => {
    setFormData({
      ...formData,
      date,
      startTime: '',
      endTime: '',
    });
    setErrors({ ...errors, date: '', startTime: '', endTime: '' });
  };

  const handleSlotClick = (slot: { startTime: string; endTime: string; busyBookings: Booking[] }) => {
    if (slot.busyBookings.length > 0) {
      toast.error('Este bloco já está ocupado. Escolha um horário livre.');
      return;
    }

    setFormData({
      ...formData,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setErrors({ ...errors, startTime: '', endTime: '' });
  };

  const clearSelectedTime = () => {
    setFormData({
      ...formData,
      startTime: '',
      endTime: '',
    });
    setErrors({ ...errors, startTime: '', endTime: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 border-2 border-gray-100">
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
                  setFormData({
                    ...formData,
                    roomId: e.target.value,
                    startTime: '',
                    endTime: '',
                  });
                  setErrors({ ...errors, roomId: '', startTime: '', endTime: '' });
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
                  📍 <strong>{getRoomTypeLabel(selectedRoom.type)}</strong> • Capacidade: {selectedRoom.capacity} pessoas
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
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={minDate}
                  required
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                    errors.date ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                  }`}
                />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickDateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDateChange(option.value)}
                      className={`rounded-xl border-2 px-3 py-2 text-left transition-all ${
                        formData.date === option.value
                          ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase">{option.weekday}</span>
                      <span className="block text-sm font-bold">{option.day}</span>
                    </button>
                  ))}
                </div>
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

            {/* Disponibilidade */}
            {selectedRoom && (
              <div className="rounded-2xl border-2 border-primary-100 bg-primary-50/60 p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      Disponibilidade de {selectedRoom.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Clique em um bloco livre para selecionar uma reserva de 1 hora. Você ainda pode ajustar o término abaixo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchAvailability}
                    disabled={availabilityLoading}
                    className="rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 transition-all hover:border-primary-400 disabled:opacity-60"
                  >
                    {availabilityLoading ? 'Atualizando...' : 'Atualizar agenda'}
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border-2 border-green-200 bg-white p-4">
                    <div className="text-2xl font-black text-green-700">{freeSlotsCount}</div>
                    <div className="text-xs font-bold uppercase text-green-700">blocos livres</div>
                  </div>
                  <div className="rounded-xl border-2 border-red-200 bg-white p-4">
                    <div className="text-2xl font-black text-red-700">{busySlotsCount}</div>
                    <div className="text-xs font-bold uppercase text-red-700">blocos ocupados</div>
                  </div>
                  <div className="rounded-xl border-2 border-primary-200 bg-white p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black text-primary-700">{occupancyPercentage}%</div>
                        <div className="text-xs font-bold uppercase text-primary-700">ocupação do dia</div>
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                          style={{ width: `${occupancyPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {availabilityLoading ? (
                  <div className="rounded-xl bg-white p-4 text-center text-sm font-semibold text-gray-500">
                    Carregando disponibilidade...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {availabilitySlots.map((slot) => {
                        const busy = slot.busyBookings.length > 0;
                        const selected = formData.startTime && formData.endTime
                          ? rangesOverlap(slot.startTime, slot.endTime, formData.startTime, formData.endTime)
                          : false;

                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => handleSlotClick(slot)}
                            className={`rounded-xl border-2 p-3 transition-all ${
                              selected
                                ? 'border-primary-500 bg-primary-600 text-white shadow-lg'
                                : busy
                                  ? 'border-red-200 bg-red-50 text-left text-red-800 cursor-not-allowed opacity-80'
                                  : 'border-green-200 bg-green-50 text-left text-green-800 hover:border-green-400 hover:bg-green-100'
                            }`}
                            aria-label={`${slot.startTime} até ${slot.endTime} ${busy ? 'ocupado' : 'livre'}`}
                          >
                            <div className="text-sm font-black">
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div className="mt-1 text-xs font-bold">
                              {selected ? 'Selecionado' : busy ? 'Ocupado' : 'Livre'}
                            </div>
                            {busy && (
                              <div className="mt-2 space-y-1">
                                {slot.busyBookings.map((booking) => (
                                  <div key={booking.id} className="truncate text-xs">
                                    {booking.course} ({booking.status})
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {sortedBookings.length > 0 ? (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="mb-2 text-sm font-black text-gray-800">
                          Reservas existentes no dia
                        </p>
                        <div className="grid gap-2">
                          {sortedBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                            >
                              <span className="font-bold text-gray-800">
                                {booking.startTime} - {booking.endTime}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-gray-600">
                                {booking.course}
                              </span>
                              <span className={`rounded-full px-2 py-1 text-xs font-black ${
                                booking.status === 'APROVADA'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl bg-white p-4 text-center text-sm font-semibold text-green-700">
                        Nenhuma reserva pendente ou aprovada para esta sala nessa data.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {formData.startTime && formData.endTime && (
              <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-primary-700">Horário selecionado</p>
                    <p className="text-xl font-black text-primary-900">
                      {formData.startTime} - {formData.endTime}
                    </p>
                    <p className="text-sm font-semibold text-primary-700">
                      Duração: {selectedDuration.toLocaleString('pt-BR')} hora{selectedDuration === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedTime}
                    className="rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 transition-all hover:border-primary-400"
                  >
                    Limpar horário
                  </button>
                </div>
              </div>
            )}

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
                    setFormData({ ...formData, startTime: e.target.value, endTime: '' });
                    setErrors({ ...errors, startTime: '', endTime: '' });
                  }}
                  required
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-primary-100 outline-none transition-all ${
                    errors.startTime ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'
                  }`}
                >
                  <option value="">Selecione...</option>
                  {startTimeSlots.map((time, index) => {
                    const nextTime = timeSlots[index + 1];
                    const disabled = formData.roomId ? isSlotBusy(time, nextTime) : false;

                    return (
                      <option key={time} value={time} disabled={disabled}>
                        {time}{disabled ? ' - ocupado' : ''}
                      </option>
                    );
                  })}
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
                  {endTimeSlots.map((time) => {
                    const disabled = formData.startTime
                      ? time <= formData.startTime ||
                        getConflictingBookings(formData.startTime, time).length > 0
                      : false;

                    return (
                      <option key={time} value={time} disabled={disabled}>
                        {time}{disabled && formData.startTime ? ' - indisponível' : ''}
                      </option>
                    );
                  })}
                </select>
                {errors.endTime && (
                  <p className="mt-2 text-sm text-red-600 font-semibold">⚠️ {errors.endTime}</p>
                )}
              </div>
            </div>

            {selectedConflicts.length > 0 && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-black">Horário selecionado indisponível</p>
                <p className="mt-1">
                  Conflita com: {selectedConflicts.map((booking) =>
                    `${booking.course} (${booking.startTime}-${booking.endTime})`
                  ).join(', ')}
                </p>
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
