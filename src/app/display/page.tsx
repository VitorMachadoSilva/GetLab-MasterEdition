'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock, Users, Calendar } from 'lucide-react';

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  room: {
    id: string;
    name: string;
    type: string;
    building: string;
  };
  professor: {
    name: string;
  };
}

interface Room {
  id: string;
  name: string;
  building: string;
  type: string;
}

export default function DisplayPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      fetchData(); // Atualiza a cada minuto
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [bookingsRes, roomsRes] = await Promise.all([
        fetch(`/api/bookings?date=${today}&status=APROVADA`),
        fetch('/api/rooms')
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyHappening = (startTime: string, endTime: string) => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= startTime && now < endTime;
  };

  const getCurrentClass = () => {
    return bookings.find(b => isCurrentlyHappening(b.startTime, b.endTime));
  };

  const getUpcomingClasses = () => {
    const now = currentTime.toTimeString().slice(0, 5);
    return bookings
      .filter(b => b.startTime > now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 4);
  };

  const getRoomStatus = (roomId: string) => {
    return bookings.find(b => 
      b.room.id === roomId && isCurrentlyHappening(b.startTime, b.endTime)
    );
  };

  const currentClass = getCurrentClass();
  const upcomingClasses = getUpcomingClasses();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b-2 border-white/20">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary-400 to-secondary-400 p-4 rounded-2xl">
              <MapPin size={56} />
            </div>
            <div>
              <h1 className="text-6xl font-black">Reservas do Dia</h1>
              <p className="text-2xl text-white/70 mt-2">FMPSC - Sistema de Gestão</p>
            </div>
          </div>
          
          <div className="text-right bg-white/10 backdrop-blur-sm px-8 py-6 rounded-2xl border-2 border-white/20">
            <div className="text-7xl font-black tabular-nums">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-2xl text-white/70 mt-2 capitalize">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        {/* Current Class */}
        {currentClass && (
          <div className="mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-20 blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-green-500/90 to-emerald-600/90 backdrop-blur-sm rounded-3xl p-10 border-2 border-white/20">
              <div className="inline-block px-6 py-3 bg-white/20 rounded-full text-lg font-bold mb-6 uppercase tracking-wider animate-pulse">
                🔴 AULA EM ANDAMENTO
              </div>
              <h2 className="text-5xl font-black mb-8">{currentClass.course}</h2>
              <div className="grid grid-cols-3 gap-8">
                <div className="flex items-center gap-4">
                  <Users size={40} className="text-white/80" />
                  <div>
                    <div className="text-lg text-white/70">Professor</div>
                    <div className="text-2xl font-bold">{currentClass.professor.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin size={40} className="text-white/80" />
                  <div>
                    <div className="text-lg text-white/70">Local</div>
                    <div className="text-2xl font-bold">{currentClass.room.name}</div>
                    <div className="text-lg text-white/60">{currentClass.room.building}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Clock size={40} className="text-white/80" />
                  <div>
                    <div className="text-lg text-white/70">Horário</div>
                    <div className="text-2xl font-bold">
                      {currentClass.startTime} - {currentClass.endTime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Classes */}
        <div className="mb-12">
          <h3 className="text-4xl font-bold mb-6 flex items-center gap-3">
            <Calendar size={40} />
            Próximas Aulas
          </h3>
          
          {upcomingClasses.length > 0 ? (
            <div className="grid gap-4">
              {upcomingClasses.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/10 hover:border-primary-400 transition-all"
                >
                  <div className="flex items-center gap-8">
                    <div className="text-center min-w-[120px]">
                      <div className="text-5xl font-black text-primary-400">
                        {booking.startTime}
                      </div>
                      <div className="text-lg text-white/60 mt-1">
                        até {booking.endTime}
                      </div>
                    </div>
                    
                    <div className="h-20 w-px bg-white/20"></div>
                    
                    <div className="flex-1">
                      <h4 className="text-3xl font-bold mb-3">{booking.course}</h4>
                      <div className="flex items-center gap-8 text-white/70 text-lg">
                        <span className="flex items-center gap-2">
                          <Users size={20} />
                          {booking.professor.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin size={20} />
                          {booking.room.name} - {booking.room.building}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-16 text-center border-2 border-white/10">
              <Calendar size={80} className="mx-auto mb-4 text-white/30" />
              <p className="text-3xl text-white/50">
                {currentClass ? 'Sem mais aulas hoje' : 'Nenhuma aula programada'}
              </p>
            </div>
          )}
        </div>

        {/* All Rooms Status */}
        <div>
          <h3 className="text-4xl font-bold mb-6 flex items-center gap-3">
            <MapPin size={40} />
            Status das Salas
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const roomBooking = getRoomStatus(room.id);
              const isOccupied = !!roomBooking;
              
              return (
                <div
                  key={room.id}
                  className={`rounded-2xl p-6 border-2 transition-all ${
                    isOccupied
                      ? 'bg-red-500/20 border-red-500/50 hover:border-red-400'
                      : 'bg-green-500/20 border-green-500/50 hover:border-green-400'
                  }`}
                >
                  <div className="mb-4">
                    <h4 className="text-xl font-bold">{room.name}</h4>
                    <p className="text-sm text-white/60">{room.building}</p>
                  </div>
                  
                  <div
                    className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                      isOccupied
                        ? 'bg-red-500 text-white'
                        : 'bg-green-500 text-gray-900'
                    }`}
                  >
                    {isOccupied ? '🔴 Ocupada' : '🟢 Disponível'}
                  </div>
                  
                  {roomBooking && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-sm font-semibold mb-1">{roomBooking.course}</p>
                      <p className="text-xs text-white/60">
                        até {roomBooking.endTime}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
