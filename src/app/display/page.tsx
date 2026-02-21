'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock, Users, Calendar, Maximize, Minimize } from 'lucide-react';
import { useServerTime } from '@/hooks/useServerTime';

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  room: { id: string; name: string; type: string; building: string };
  professor: { name: string };
}

export default function DisplayPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Usar horário do servidor
  const { currentTime, getLocalDateString } = useServerTime();

  useEffect(() => {
    fetchBookings();
    const timer = setInterval(() => {
      fetchBookings();
    }, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(timer);
  }, []);

  const fetchBookings = async () => {
    try {
      const today = getLocalDateString();
      
      const res = await fetch(`/api/bookings?date=${today}&status=APROVADA`);
      if (res.ok) {
        const data = await res.json();
        // Ordenar por horário
        setBookings(data.sort((a: Booking, b: Booking) => a.startTime.localeCompare(b.startTime)));
      }
    } catch (error) {
      console.error('Erro ao carregar reservas');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isCurrentlyHappening = (startTime: string, endTime: string) => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= startTime && now < endTime;
  };

  const isPast = (endTime: string) => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= endTime;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="text-white text-4xl font-black">Carregando...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 ${isFullscreen ? 'p-6' : 'p-3'}`}>
      {/* Botão Voltar - Compacto */}
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="fixed top-3 left-3 z-50 glass-dark text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all shadow-lg font-semibold flex items-center gap-2 text-sm"
        title="Voltar ao Dashboard"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </button>

      {/* Botão Fullscreen - Compacto */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-3 right-3 z-50 glass-dark text-white p-2 rounded-lg hover:bg-white/20 transition-all shadow-lg"
        title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      <div className="max-w-[1920px] mx-auto">
        {/* Header - MUITO COMPACTO */}
        <div className="mb-6 text-center animate-fade-in">
          <div className="inline-block glass-dark px-8 py-4 rounded-2xl mb-4 shadow-lg">
            <div className="text-5xl font-black text-white tabular-nums mb-1">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-base font-semibold text-white/80 capitalize">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-2">
            📅 Reservas de Hoje
          </h1>
        </div>

        {/* Cards das Aulas - FOCO PRINCIPAL */}
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {bookings.map((booking, index) => {
              const isCurrent = isCurrentlyHappening(booking.startTime, booking.endTime);
              const hasPassed = isPast(booking.endTime);

              return (
                <div
                  key={booking.id}
                  className={`stagger-item animate-fade-in-up rounded-2xl overflow-hidden shadow-lg transition-all hover:scale-105 ${
                    isCurrent 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 ring-4 ring-white pulse-live' 
                      : hasPassed
                      ? 'bg-gradient-to-br from-gray-600 to-gray-700 opacity-50'
                      : 'bg-gradient-to-br from-primary-500 to-secondary-600'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="p-5 text-white">
                    {/* Status e Horário */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="text-sm font-black uppercase tracking-wider">🔴 AGORA</span>
                          </>
                        )}
                        {hasPassed && (
                          <span className="text-sm font-bold uppercase tracking-wider opacity-70">✓ Fim</span>
                        )}
                        {!isCurrent && !hasPassed && (
                          <span className="text-sm font-bold uppercase tracking-wider">⏰ Em breve</span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-4xl font-black">{booking.startTime}</div>
                        <div className="text-sm font-semibold opacity-80">até {booking.endTime}</div>
                      </div>
                    </div>

                    {/* Disciplina - DESTAQUE */}
                    <h2 className="text-2xl font-black mb-4 leading-tight line-clamp-2">
                      {booking.course}
                    </h2>

                    {/* Informações - COMPACTAS */}
                    <div className="space-y-2">
                      <div className="glass-dark p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={18} className="opacity-90 flex-shrink-0" />
                          <div className="text-xs opacity-80 font-semibold">Professor</div>
                        </div>
                        <div className="text-base font-bold truncate">{booking.professor.name}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="glass-dark p-3 rounded-xl">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin size={16} className="opacity-90 flex-shrink-0" />
                            <div className="text-xs opacity-80 font-semibold">Sala</div>
                          </div>
                          <div className="text-base font-bold">{booking.room.name}</div>
                          <div className="text-xs opacity-70 truncate">{booking.room.building}</div>
                        </div>

                        <div className="glass-dark p-3 rounded-xl">
                          <div className="flex items-center gap-1 mb-1">
                            <Users size={16} className="opacity-90 flex-shrink-0" />
                            <div className="text-xs opacity-80 font-semibold">Alunos</div>
                          </div>
                          <div className="text-base font-bold">{booking.students}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="glass-dark inline-block px-12 py-10 rounded-2xl shadow-lg">
              <Calendar size={80} className="mx-auto mb-4 text-white/40" />
              <p className="text-3xl text-white font-black mb-2">
                Nenhuma Aula Hoje
              </p>
              <p className="text-base text-white/60 font-semibold">
                Não há reservas programadas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator - DISCRETO */}
      <div className="fixed bottom-3 left-3 glass-dark px-3 py-1.5 rounded-lg text-white/60 text-xs font-semibold">
        🔄 Auto-refresh
      </div>
    </div>
  );
}
