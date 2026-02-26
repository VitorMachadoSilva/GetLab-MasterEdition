'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Trash2, RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useServerTime } from '@/hooks/useServerTime';

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  status: string;
  notes?: string;
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
  createdAt: string;
}

export default function MinhasReservasPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'FINALIZADA'>('TODAS');
  
  const { currentTime } = useServerTime();

  const isBookingPast = (date: string, endTime: string) => {
    const bookingDate = new Date(date);
    const [hours, minutes] = endTime.split(':').map(Number);

    const bookingEnd = new Date(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    return currentTime > bookingEnd;
  };

   const isBookingFinalized = (b: Booking) =>
    isBookingPast(b.date, b.endTime);

  const isBookingActive = (b: Booking) =>
    !isBookingFinalized(b);

  const isApprovedAndActive = (b: Booking) =>
    b.status === 'APROVADA' && isBookingActive(b);

  const isPendingAndActive = (b: Booking) =>
    b.status === 'PENDENTE' && isBookingActive(b);

  const isRejected = (b: Booking) =>
  b.status === 'REJEITADA';

  const stats = {
    total: bookings.length,
    
    pendentes: bookings.filter(isPendingAndActive).length,
    aprovadas: bookings.filter(isApprovedAndActive).length,
    rejeitadas: bookings.filter(isRejected).length,
    finalizadas: bookings.filter(isBookingFinalized).length,
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyBookings();
    }
  }, [session]);

  const fetchMyBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?professorId=${session?.user?.id}`);
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

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) {
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Reserva excluída com sucesso');
        fetchMyBookings();
      } else {
        toast.error('Erro ao excluir reserva');
      }
    } catch (error) {
      toast.error('Erro ao excluir reserva');
    }
  };

  const getStatusColor = (status: string, isPast: boolean) => {
    if (isPast) return 'bg-gray-200 text-gray-700 border-gray-300';

    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'APROVADA':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJEITADA':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string, isPast: boolean) => {
    if (isPast) return 'Finalizada';

    switch (status) {
      case 'PENDENTE':
        return '⏳ Pendente';
      case 'APROVADA':
        return 'Aprovada';
      case 'REJEITADA':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  const filteredBookings =
    bookings.filter(b => {
      const isPast = isBookingPast(b.date, b.endTime);

      if (filter === 'FINALIZADA') return isPast
      if (filter === 'PENDENTE') return b.status === 'PENDENTE' && !isPast
      if (filter === 'APROVADA') return b.status === 'APROVADA' && !isPast
      if (filter === 'REJEITADA') return b.status === 'REJEITADA' 
      return true;  
    })

    // filter === 'TODAS'
    //   ? bookings
    //   : bookings.filter(b => b.status === filter);

    // const stats = {
    // total: bookings.length,

    // pendentes: bookings.filter(
    //   b => b.status === 'PENDENTE' && !isBookingPast(b.date, b.endTime)
    // ).length,

    // aprovadas: bookings.filter(
    //   b => b.status === 'APROVADA'
    // ).length,

    // rejeitadas: bookings.filter(
    //   b => b.status === 'REJEITADA'
    // ).length,

    // finalizadas: bookings.filter(
    //   b => b.status === 'FINALIZADA'
    // ).length,  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Voltar ao Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Minhas Reservas
              </h1>
              <p className="text-gray-600">
                Gerencie suas solicitações de reserva
              </p>
            </div>
            <button
              onClick={() => router.push('/professor/nova-reserva')}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              + Nova Reserva
            </button>
          </div>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">

        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="text-3xl font-black text-gray-900">
            {stats.total}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Total
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
          <div className="text-3xl font-black text-yellow-800">
            {stats.pendentes}
          </div>
          <div className="text-sm text-yellow-700 font-medium">
            Pendentes
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
          <div className="text-3xl font-black text-green-800">
            {stats.aprovadas}
          </div>
          <div className="text-sm text-green-700 font-medium">
            Aprovadas
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
          <div className="text-3xl font-black text-red-800">
            {stats.rejeitadas}
          </div>
          <div className="text-sm text-red-700 font-medium">
            Rejeitadas
          </div>
        </div>

        <div className="bg-gray-100 rounded-xl p-6 border-2 border-gray-300">
          <div className="text-3xl font-black text-gray-700">
            {stats.finalizadas}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Finalizadas
          </div>
        </div>

      </div>

        <div className="mb-6 flex items-center gap-3">
          <Filter size={20} className="text-gray-600" />
          {['TODAS', 'PENDENTE', 'APROVADA', 'REJEITADA', 'FINALIZADA'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredBookings.length > 0 ? (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const isPast = isBookingPast(booking.date, booking.endTime);

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {booking.course}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(
                          booking.status,
                          isPast
                        )}`}
                      >
                        {getStatusText(booking.status, isPast)}
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} className="text-primary-500" />
                          <span>
                            {new Date(booking.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock size={16} className="text-primary-500" />
                          <span>
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin size={16} className="text-primary-500" />
                          <span>
                            {booking.room.name} - {booking.room.building}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <Users size={16} className="text-primary-500" />
                          <span>{booking.students} alunos</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      {isPast ? (
                        <div className="px-6 py-2 bg-gray-200 text-gray-400 font-semibold rounded-lg text-center">
                          Expirada
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-500">
              Nenhuma reserva encontrada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}