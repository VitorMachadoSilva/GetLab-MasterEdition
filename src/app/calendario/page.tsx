'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, MapPin, Users, Calendar } from 'lucide-react';
import { useServerTime } from '@/hooks/useServerTime';

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  status: string;
  room: { id: string; name: string; building: string };
  professor: { name: string };
}

interface Room {
  id: string;
  name: string;
}

export default function CalendarioPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { currentTime } = useServerTime();

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        fetch('/api/bookings?status=APROVADA'),
        fetch('/api/rooms')
      ]);

      if (bookingsRes.ok) {
        const allBookings = await bookingsRes.json();
        
        // Filtrar reservas do mês atual
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const monthBookings = allBookings.filter((b: Booking) => {
          const bookingDate = new Date(b.date);
          return bookingDate >= firstDay && bookingDate <= lastDay;
        });
        
        setBookings(monthBookings);
      }

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getBookingsForDay = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return bookings.filter(b => {
      // Normalizar a data da API removendo hora (se vier como 2026-02-20T00:00:00)
      const bookingDateOnly = b.date.split('T')[0];
      return bookingDateOnly === dateStr;
    });
  };

  const getDayColor = (date: Date) => {
    const dayBookings = getBookingsForDay(date);
    
    // Dia atual
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    if (isToday) return 'bg-blue-500 text-white';

    // Sem reservas
    if (dayBookings.length === 0) return 'bg-green-500 text-white';

    // Calcular slots ocupados vs disponíveis
    const timeSlots = generateTimeSlots();
    const occupiedSlots = new Set<string>();
    
    dayBookings.forEach(booking => {
      const start = booking.startTime;
      const end = booking.endTime;
      timeSlots.forEach(slot => {
        if (slot >= start && slot < end) {
          occupiedSlots.add(`${booking.room.id}-${slot}`);
        }
      });
    });

    const totalSlots = timeSlots.length * rooms.length;
    const occupiedCount = occupiedSlots.size;
    
    // Totalmente ocupado (vermelho)
    if (occupiedCount >= totalSlots * 0.9) return 'bg-red-500 text-white';
    
    // Parcialmente ocupado (amarelo)
    return 'bg-yellow-500 text-white';
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 22; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
    }
    return slots;
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const days = getDaysInMonth();
  const dayBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-blue-700">Carregando calendário...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <CalendarIcon size={48} className="mx-auto mb-2 text-primary-500" />
          <h1 className="text-4xl font-black text-gradient-vibrant mb-2">
             Calendário de Reservas
          </h1>
          <p className="text-gray-600">Visualize todas as reservas do mês</p>
        </div>

        {/* Month Navigation */}
        <div className="glass rounded-2xl p-6 mb-6 shadow-modern">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="btn-modern p-3 bg-white hover:bg-gray-50 rounded-xl shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>

            <h2 className="text-3xl font-black text-gray-800">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>

            <button
              onClick={() => changeMonth(1)}
              className="btn-modern p-3 bg-white hover:bg-gray-50 rounded-xl shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="glass rounded-2xl p-4 mb-6 shadow-modern">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span>Totalmente Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              <span>Parcialmente Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span>Sem Disponibilidade</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass rounded-2xl p-6 shadow-modern">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center font-bold text-gray-700 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square"></div>;
              }

              const dayBookings = getBookingsForDay(date);
              const displayBookings = dayBookings.slice(0, 3);
              const hasMore = dayBookings.length > 3;
              const colorClass = getDayColor(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDay(date)}
                  className={`aspect-square p-2 rounded-xl transition-all hover:scale-105 hover:shadow-lg ${colorClass} relative`}
                >
                  <div className="font-bold text-lg mb-1">{date.getDate()}</div>
                  
                  {displayBookings.length > 0 && (
                    <div className="text-xs space-y-0.5 text-left">
                      {displayBookings.map((booking, i) => (
                        <div key={i} className="truncate opacity-90 text-[10px] leading-tight">
                          {booking.course} - {booking.room.name}
                        </div>
                      ))}
                      {hasMore && (
                        <div className="font-bold text-[10px]">
                          +{dayBookings.length - 3} mais
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">
                  {selectedDay.getDate()} de {monthNames[selectedDay.getMonth()]} de {selectedDay.getFullYear()}
                </h3>
                <p className="text-sm opacity-90">{dayBookings.length} reserva(s)</p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {dayBookings.length > 0 ? (
                <div className="space-y-4">
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="glass rounded-xl p-4 border-2 border-primary-200 hover:border-primary-400 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-black text-gray-800">{booking.course}</h4>
                          <p className="text-gray-600 font-semibold">{booking.professor.name}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                          {booking.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-primary-500" />
                          <span className="font-semibold">{booking.startTime} - {booking.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={16} className="text-primary-500" />
                          <span className="font-semibold">{booking.room.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users size={16} className="text-primary-500" />
                          <span className="font-semibold">{booking.students} alunos</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-xl text-gray-500">Nenhuma reserva neste dia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}