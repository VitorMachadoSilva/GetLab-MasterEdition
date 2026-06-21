'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Clock, Users, Calendar, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import CustomJoyride from '@/components/CustomJoyride';
import TutorialButton from '@/components/TutorialButton';
import { useTutorial } from '@/hooks/useTutorial';
import { readApiError } from '@/lib/api-client';

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Helper: pega data local sem UTC
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());

  // Tutorial
  const { run, steps, handleJoyrideCallback, startTutorial } = useTutorial(session?.user?.role);

  useEffect(() => {
    fetchTodayBookings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  const fetchTodayBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}&status=APROVADA`);
      if (res.ok) {
        setBookings(await res.json());
      } else {
        toast.error(await readApiError(res, 'Não foi possível carregar as reservas'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar as reservas. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyHappening = (startTime: string, endTime: string) => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= startTime && now < endTime;
  };

  const getCurrentClass = () => bookings.find(b => isCurrentlyHappening(b.startTime, b.endTime));
  const getUpcomingClasses = () => {
    const now = currentTime.toTimeString().slice(0, 5);
    return bookings.filter(b => b.startTime > now).sort((a, b) => a.startTime.localeCompare(b.startTime)).slice(0, 5);
  };

  if (loading) return <LoadingSpinner />;

  const currentClass = getCurrentClass();
  const upcomingClasses = getUpcomingClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Tutorial Components */}
      <CustomJoyride run={run} steps={steps} onCallback={handleJoyrideCallback} />
      <TutorialButton onStart={startTutorial} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header - COMPACTO */}
        <div className="mb-6 animate-fade-in-up" data-tour="dashboard-header">
          <div className="glass rounded-2xl p-5 shadow-modern border-2 border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black text-gradient-vibrant mb-1 tracking-tight">
                  Reservas de Hoje
                </h1>
                <p className="text-sm text-gray-600">
                  Bem-vindo(a), <span className="font-bold text-gradient">{session?.user?.name}</span>
                </p>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative glass-dark px-5 py-3 rounded-2xl shadow-modern">
                  <div className="text-3xl font-black text-gradient tabular-nums">
                    {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs font-semibold text-primary-600 capitalize mt-1 text-center">
                    {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              <button
                onClick={fetchTodayBookings}
                className="btn-modern bg-gradient-fmpsc text-white px-4 py-2 rounded-xl shadow-modern hover:shadow-glow font-semibold flex items-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>

              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-modern px-3 py-2 border-2 border-gray-200 rounded-xl font-semibold text-sm focus:border-primary-500"
                />
                {selectedDate !== getLocalDateString() && (
                  <button
                    onClick={() => setSelectedDate(getLocalDateString())}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                  >
                    Hoje
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Class - COMPACTO */}
        {currentClass && (
          <div className="mb-6 animate-scale-in" data-tour="current-class">
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-90"></div>
              
              <div className="relative p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <div className="pulse-live bg-white w-3 h-3 rounded-full"></div>
                  <span className="text-sm font-black uppercase tracking-wider">🔴 Aula em Andamento</span>
                </div>
                
                <h2 className="text-2xl font-black mb-4 tracking-tight">{currentClass.course}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="glass-dark p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={18} className="opacity-90" />
                      <div className="text-xs opacity-80">Professor</div>
                    </div>
                    <div className="text-base font-bold">{currentClass.professor.name}</div>
                  </div>
                  <div className="glass-dark p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={18} className="opacity-90" />
                      <div className="text-xs opacity-80">Local</div>
                    </div>
                    <div className="text-base font-bold">{currentClass.room.name}</div>
                    <div className="text-xs opacity-70">{currentClass.room.building}</div>
                  </div>
                  <div className="glass-dark p-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={18} className="opacity-90" />
                      <div className="text-xs opacity-80">Horário</div>
                    </div>
                    <div className="text-base font-bold">{currentClass.startTime} - {currentClass.endTime}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Classes - COMPACTO */}
        <div className="mb-6" data-tour="upcoming-classes">
          <h3 className="text-xl font-black text-gray-800 mb-3 flex items-center gap-2">
            <Calendar size={22} />
            Próximas Aulas
          </h3>
          
          {upcomingClasses.length > 0 ? (
            <div className="grid gap-2">
              {upcomingClasses.map((booking, index) => (
                <div
                  key={booking.id}
                  className="card-modern glass p-3 rounded-xl shadow-modern stagger-item animate-fade-in-up hover:shadow-lg transition-all"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="glass-dark px-3 py-2 rounded-lg text-center min-w-[80px]">
                      <div className="text-xl font-black text-gradient">{booking.startTime}</div>
                      <div className="text-xs text-gray-600 font-semibold">até {booking.endTime}</div>
                    </div>
                    
                    <div className="h-10 w-px bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200"></div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-800 mb-1 truncate">{booking.course}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold">
                          <Users size={12} className="text-primary-500 flex-shrink-0" />
                          <span className="truncate">{booking.professor.name}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <MapPin size={12} className="text-primary-500 flex-shrink-0" />
                          <span className="truncate">{booking.room.name} - {booking.room.building}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center shadow-modern">
              <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
              <p className="text-base text-gray-400 font-semibold">
                {currentClass ? 'Sem mais aulas hoje' : 'Nenhuma aula programada'}
              </p>
            </div>
          )}
        </div>

        {/* All Bookings Table - COMPACTA */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-black text-gray-800 mb-3">Todas as Reservas ({bookings.length})</h3>
          <div className="glass rounded-2xl overflow-hidden shadow-modern border-2 border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                    <th className="px-4 py-2 text-left font-bold text-xs uppercase">Horário</th>
                    <th className="px-4 py-2 text-left font-bold text-xs uppercase">Disciplina</th>
                    <th className="px-4 py-2 text-left font-bold text-xs uppercase">Professor</th>
                    <th className="px-4 py-2 text-left font-bold text-xs uppercase">Sala</th>
                    <th className="px-4 py-2 text-left font-bold text-xs uppercase">Alunos</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`border-b border-gray-100 hover:bg-primary-50 transition-colors ${
                        isCurrentlyHappening(booking.startTime, booking.endTime) ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="px-4 py-2">
                        <div className="font-bold text-sm text-gray-800 whitespace-nowrap">{booking.startTime} - {booking.endTime}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-sm text-gray-800">{booking.course}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{booking.professor.name}</td>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-sm">{booking.room.name}</div>
                        <div className="text-xs text-gray-500">{booking.room.building}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{booking.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
