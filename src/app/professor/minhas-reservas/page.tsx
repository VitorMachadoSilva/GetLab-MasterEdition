'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Trash2, RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTE' | 'APROVADA' | 'REJEITADA'>('TODAS');

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

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return '⏳ Pendente';
      case 'APROVADA':
        return '✅ Aprovada';
      case 'REJEITADA':
        return '❌ Rejeitada';
      default:
        return status;
    }
  };

  const filteredBookings = filter === 'TODAS'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    pendentes: bookings.filter(b => b.status === 'PENDENTE').length,
    aprovadas: bookings.filter(b => b.status === 'APROVADA').length,
    rejeitadas: bookings.filter(b => b.status === 'REJEITADA').length,
  };

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
        {/* Header */}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="text-3xl font-black text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 font-medium">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
            <div className="text-3xl font-black text-yellow-800">{stats.pendentes}</div>
            <div className="text-sm text-yellow-700 font-medium">Pendentes</div>
          </div>
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="text-3xl font-black text-green-800">{stats.aprovadas}</div>
            <div className="text-sm text-green-700 font-medium">Aprovadas</div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
            <div className="text-3xl font-black text-red-800">{stats.rejeitadas}</div>
            <div className="text-sm text-red-700 font-medium">Rejeitadas</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <Filter size={20} className="text-gray-600" />
          <button
            onClick={() => setFilter('TODAS')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'TODAS'
                ? 'bg-primary-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('PENDENTE')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'PENDENTE'
                ? 'bg-yellow-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-yellow-300'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('APROVADA')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'APROVADA'
                ? 'bg-green-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setFilter('REJEITADA')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === 'REJEITADA'
                ? 'bg-red-500 text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300'
            }`}
          >
            Rejeitadas
          </button>
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {booking.course}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={16} className="text-primary-500" />
                        <span>{new Date(booking.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={16} className="text-primary-500" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={16} className="text-primary-500" />
                        <span>{booking.room.name} - {booking.room.building}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users size={16} className="text-primary-500" />
                        <span>{booking.students} alunos</span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Observações:</strong> {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
            <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-500 mb-4">
              {filter === 'TODAS' ? 'Você ainda não tem reservas' : `Nenhuma reserva ${filter.toLowerCase()}`}
            </p>
            {filter === 'TODAS' && (
              <button
                onClick={() => router.push('/professor/nova-reserva')}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold rounded-lg hover:shadow-lg transition-all inline-block"
              >
                Criar Primeira Reserva
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
