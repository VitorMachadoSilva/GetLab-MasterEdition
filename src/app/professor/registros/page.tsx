'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, RefreshCw, Filter, Search, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
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
  updatedAt: string;
}

type FilterType = 'TODAS' | 'FINALIZADA' | 'REJEITADA';

export default function RegistrosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('TODAS');
  const [search, setSearch] = useState('');

  const { currentTime } = useServerTime();

  const isAdmin = session?.user?.role === 'ADMIN';

  // Uma reserva é "finalizada" se estava APROVADA e já passou no tempo
  const isBookingPast = (date: string, endTime: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = endTime.split(':').map(Number);
    const bookingEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return currentTime > bookingEnd;
  };

  const getRecordType = (booking: Booking): 'FINALIZADA' | 'REJEITADA' | null => {
    if (booking.status === 'APROVADA' && isBookingPast(booking.date, booking.endTime)) return 'FINALIZADA';
    if (booking.status === 'REJEITADA' || booking.status === 'CANCELADA') return 'REJEITADA';
    return null;
  };

  useEffect(() => {
    fetchRecords();
  }, [session]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Admin vê todos; professor vê só os seus
      const query = isAdmin
        ? `/api/bookings`
        : `/api/bookings?professorId=${session?.user?.id}`;

      const res = await fetch(query);
      if (res.ok) {
        const data: Booking[] = await res.json();
        setBookings(data);
      }
    } catch {
      toast.error('Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  };

  // Filtra somente registros históricos (finalizadas + rejeitadas + canceladas)
  const records = bookings
    .filter((b) => getRecordType(b) !== null)
    .filter((b) => {
      if (filter === 'TODAS') return true;
      return getRecordType(b) === filter;
    })
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.course.toLowerCase().includes(q) ||
        b.professor.name.toLowerCase().includes(q) ||
        b.room.name.toLowerCase().includes(q) ||
        b.room.building.toLowerCase().includes(q)
      );
    })
    // Mais recente primeiro — usa a data da reserva + horário de fim
    .sort((a, b) => {
      const dateA = new Date(`${a.date.slice(0, 10)}T${a.endTime}`);
      const dateB = new Date(`${b.date.slice(0, 10)}T${b.endTime}`);
      return dateB.getTime() - dateA.getTime();
    });

  const stats = {
    finalizadas: bookings.filter((b) => getRecordType(b) === 'FINALIZADA').length,
    rejeitadas: bookings.filter((b) => getRecordType(b) === 'REJEITADA').length,
  };

  const getBadge = (type: ReturnType<typeof getRecordType>) => {
    switch (type) {
      case 'FINALIZADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold rounded-full whitespace-nowrap">
            <CheckCircle2 size={12} />
            Finalizada
          </span>
        );
      case 'REJEITADA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-300 text-xs font-bold rounded-full whitespace-nowrap">
            <XCircle size={12} />
            Rejeitada
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatDateTime = (isoStr: string) =>
    new Date(isoStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-1.5 text-sm font-semibold"
          >
            ← Voltar ao Dashboard
          </button>

          <div className="glass rounded-2xl p-5 shadow-modern border-2 border-white/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 to-secondary-500 p-2.5 rounded-2xl">
                    <ClipboardList className="text-white" size={24} />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gradient-vibrant tracking-tight">
                    Registros
                  </h1>
                  <p className="text-sm text-gray-600">
                    Histórico de reservas finalizadas e rejeitadas
                  </p>
                </div>
              </div>

              <button
                onClick={fetchRecords}
                className="btn-modern bg-gradient-fmpsc text-white px-4 py-2 rounded-xl shadow-modern hover:shadow-glow font-semibold flex items-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-xl p-5 border-2 border-blue-200 shadow-modern">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={28} className="text-blue-500" />
              <div>
                <div className="text-3xl font-black text-blue-700">{stats.finalizadas}</div>
                <div className="text-sm text-blue-600 font-semibold">Finalizadas</div>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-5 border-2 border-red-200 shadow-modern">
            <div className="flex items-center gap-3">
              <XCircle size={28} className="text-red-500" />
              <div>
                <div className="text-3xl font-black text-red-700">{stats.rejeitadas}</div>
                <div className="text-sm text-red-600 font-semibold">Rejeitadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="glass rounded-2xl p-4 shadow-modern border-2 border-white/20 mb-6 flex flex-wrap items-center gap-3">
          <Filter size={18} className="text-gray-500 shrink-0" />

          {(['TODAS', 'FINALIZADA', 'REJEITADA'] as FilterType[]).map((f) => {
            const labels: Record<FilterType, string> = {
              TODAS: 'Todas',
              FINALIZADA: 'Finalizadas',
              REJEITADA: 'Rejeitadas',
            };
            const colors: Record<FilterType, string> = {
              TODAS: 'bg-gradient-fmpsc text-white',
              FINALIZADA: 'bg-blue-500 text-white',
              REJEITADA: 'bg-red-500 text-white',
            };
            const inactive = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300';

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  filter === f ? colors[f] : inactive
                }`}
              >
                {labels[f]}
              </button>
            );
          })}

          <div className="flex items-center gap-2 ml-auto flex-1 min-w-[180px] max-w-xs">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar disciplina, prof., sala..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-modern w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary-500 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="animate-spin text-primary-500" size={40} />
          </div>
        ) : records.length > 0 ? (
          <div className="glass rounded-2xl overflow-hidden shadow-modern border-2 border-white/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">Data da Aula</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">Horário</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide">Disciplina</th>
                    {isAdmin && (
                      <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide">Professor</th>
                    )}
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide">Sala</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">Alunos</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((booking, index) => {
                    const type = getRecordType(booking);
                    const rowBg =
                      type === 'FINALIZADA'
                        ? 'bg-blue-50/40'
                        : type === 'REJEITADA'
                        ? 'bg-red-50/40'
                        : 'bg-gray-50/40';

                    return (
                      <tr
                        key={booking.id}
                        className={`border-b border-gray-100 hover:brightness-95 transition-all ${rowBg}`}
                      >
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3">{getBadge(type)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary-400" />
                            {formatDate(booking.date)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-primary-400" />
                            {booking.startTime} – {booking.endTime}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800 max-w-[220px] truncate" title={booking.course}>
                            {booking.course}
                          </div>
                          {booking.notes && (
                            <div className="text-xs text-gray-400 truncate max-w-[220px]" title={booking.notes}>
                              {booking.notes}
                            </div>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={booking.professor.name}>
                            <div className="flex items-center gap-1.5">
                              <Users size={13} className="text-primary-400 shrink-0" />
                              <span className="truncate">{booking.professor.name}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-1.5">
                            <MapPin size={13} className="text-primary-400 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-semibold text-gray-800">{booking.room.name}</div>
                              <div className="text-xs text-gray-400">{booking.room.building}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-center font-semibold">
                          {booking.students}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {formatDateTime(booking.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 font-semibold">
              {records.length} registro{records.length !== 1 ? 's' : ''} encontrado{records.length !== 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center shadow-modern border-2 border-white/20">
            <ClipboardList size={56} className="mx-auto mb-3 text-gray-300" />
            <p className="text-lg text-gray-400 font-semibold mb-1">Nenhum registro encontrado</p>
            <p className="text-sm text-gray-400">
              {search ? 'Tente ajustar os filtros ou a busca.' : 'Reservas finalizadas e rejeitadas aparecerão aqui.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}