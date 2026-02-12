'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, MapPin, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  status: string;
  room: {
    id: string;
    name: string;
    type: string;
    building: string;
    capacity: number;
  };
  professor: {
    id: string;
    name: string;
    email: string;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTodayBookings();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  const fetchTodayBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}&status=APROVADA`);
      
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar reservas');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyHappening = (startTime: string, endTime: string) => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= startTime && now < endTime;
  };

  const getCurrentClass = () => {
    return bookings.find((b) => isCurrentlyHappening(b.startTime, b.endTime));
  };

  const getUpcomingClasses = () => {
    const now = currentTime.toTimeString().slice(0, 5);
    return bookings
      .filter((b) => b.startTime > now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  };

  const currentClass = getCurrentClass();
  const upcomingClasses = getUpcomingClasses();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                  Reservas de Hoje
                </h1>
                <p className="text-gray-600 text-lg">
                  Bem-vindo(a), <span className="font-bold text-primary-600">{session?.user?.name}</span>
                </p>
              </div>
              <div className="text-right bg-gradient-to-br from-primary-500 to-secondary-500 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-4xl font-black tabular-nums">
                  {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm font-semibold capitalize mt-1 opacity-90">
                  {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>

            <button
              onClick={fetchTodayBookings}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-50 border-2 border-primary-200 text-primary-700 rounded-xl hover:bg-primary-100 hover:border-primary-300 transition-all font-semibold"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Current Class */}
        {currentClass && (
          <div className="mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-10 blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-xl">
              <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-bold mb-4">
                🔴 AULA EM ANDAMENTO
              </div>
              <h2 className="text-3xl font-black mb-6">{currentClass.course}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Users size={28} />
                  <div>
                    <div className="text-sm text-white/80">Professor</div>
                    <div className="text-lg font-bold">{currentClass.professor.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={28} />
                  <div>
                    <div className="text-sm text-white/80">Local</div>
                    <div className="text-lg font-bold">{currentClass.room.name}</div>
                    <div className="text-sm text-white/70">{currentClass.room.building}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={28} />
                  <div>
                    <div className="text-sm text-white/80">Horário</div>
                    <div className="text-lg font-bold">
                      {currentClass.startTime} - {currentClass.endTime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Classes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <Calendar size={28} className="text-primary-500" />
            Próximas Aulas
          </h2>

          {upcomingClasses.length > 0 ? (
            <div className="grid gap-4">
              {upcomingClasses.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="text-center md:text-left min-w-[100px]">
                      <div className="text-3xl font-black text-primary-500">
                        {booking.startTime}
                      </div>
                      <div className="text-sm text-gray-500">até {booking.endTime}</div>
                    </div>

                    <div className="h-px md:h-auto md:w-px bg-gray-200"></div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {booking.course}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary-500" />
                          <span>{booking.professor.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-primary-500" />
                          <span>{booking.room.name} - {booking.room.building}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary-500" />
                          <span>{booking.students} alunos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
              <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl text-gray-500">
                {currentClass ? 'Sem mais aulas hoje' : 'Nenhuma aula programada para hoje'}
              </p>
            </div>
          )}
        </div>

        {/* All Today's Bookings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Todas as Reservas do Dia ({bookings.length})
          </h2>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-primary-500 to-secondary-500">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                      Horário
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                      Disciplina
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                      Professor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                      Sala
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase">
                      Alunos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isCurrentlyHappening(booking.startTime, booking.endTime)
                          ? 'bg-green-50'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {booking.course}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {booking.professor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {booking.room.name}
                        <div className="text-xs text-gray-500">{booking.room.building}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {booking.students}
                      </td>
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