'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import SelectField from '@/components/SelectField';
import { readApiError } from '@/lib/api-client';

type BookingStatus = 'TODAS' | 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';
type SortOrder = 'desc' | 'asc';

interface Booking {
  id: string;
  course: string;
  startTime: string;
  endTime: string;
  date: string;
  students: number;
  status: Exclude<BookingStatus, 'TODAS'>;
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

const pageSize = 10;

const statusOptions = [
  { value: 'TODAS', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'APROVADA', label: 'Aprovadas' },
  { value: 'REJEITADA', label: 'Rejeitadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

export default function MinhasReservasPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus>('TODAS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (session?.user?.id) {
      fetchMyBookings();
    }
  }, [session]);

  useEffect(() => {
    setPage(1);
  }, [filter, sortOrder, bookings.length]);

  const fetchMyBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?professorId=${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        toast.error(await readApiError(res, 'Não foi possível carregar suas reservas'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar suas reservas. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Informe o motivo do cancelamento:')?.trim();

    if (!reason) {
      toast.error('Informe um motivo para cancelar a reserva');
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        toast.success('Reserva cancelada com sucesso');
        fetchMyBookings();
      } else {
        toast.error(await readApiError(res, 'Não foi possível cancelar a reserva'));
      }
    } catch (error) {
      toast.error('Não foi possível cancelar a reserva. Verifique sua conexão e tente novamente.');
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
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'Pendente';
      case 'APROVADA':
        return 'Aprovada';
      case 'REJEITADA':
        return 'Rejeitada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const filteredBookings = useMemo(() => {
    const filtered = filter === 'TODAS'
      ? bookings
      : bookings.filter((booking) => booking.status === filter);

    return [...filtered].sort((a, b) => {
      const aTime = getBookingSortTime(a);
      const bTime = getBookingSortTime(b);
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [bookings, filter, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const pageBookings = filteredBookings.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + pageSize, filteredBookings.length);

  const stats = {
    total: bookings.length,
    pendentes: bookings.filter((booking) => booking.status === 'PENDENTE').length,
    aprovadas: bookings.filter((booking) => booking.status === 'APROVADA').length,
    rejeitadas: bookings.filter((booking) => booking.status === 'REJEITADA').length,
    canceladas: bookings.filter((booking) => booking.status === 'CANCELADA').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl animate-fade-in-up">
        <div className="mb-6" data-tour="minhas-reservas-header">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 flex items-center gap-2 text-primary-600 transition-colors hover:text-primary-700"
          >
            ← Voltar ao Dashboard
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-1 text-3xl font-bold text-gray-900 sm:text-4xl">
                Minhas Reservas
              </h1>
              <p className="text-gray-600">
                Gerencie suas solicitações de reserva
              </p>
            </div>
            <button
              onClick={() => router.push('/professor/nova-reserva')}
              className="rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-3 font-bold text-white transition-all hover:shadow-lg"
            >
              + Nova Reserva
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5" data-tour="minhas-reservas-stats">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pendentes" value={stats.pendentes} tone="yellow" />
          <StatCard label="Aprovadas" value={stats.aprovadas} tone="green" />
          <StatCard label="Rejeitadas" value={stats.rejeitadas} tone="red" />
          <StatCard label="Canceladas" value={stats.canceladas} tone="gray" />
        </div>

        <div className="mb-5 rounded-2xl border-2 border-gray-200 bg-white p-3 shadow-sm" data-tour="minhas-reservas-filtros">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,320px)_auto_1fr] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-gray-500">Status</label>
              <SelectField
                value={filter}
                placeholder="Todos os status"
                options={statusOptions}
                compact
                onChange={(value) => setFilter(value as BookingStatus)}
              />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder((order) => (order === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-black text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50"
            >
              <ArrowDownUp size={17} />
              {sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}
            </button>

            <p className="text-sm font-semibold text-gray-500 md:text-right">
              {filteredBookings.length > 0
                ? `Mostrando ${startIndex + 1}-${endIndex} de ${filteredBookings.length} reserva(s).`
                : 'Nenhuma reserva no filtro atual.'}
            </p>
          </div>
        </div>

        {filteredBookings.length > 0 ? (
          <>
            <div className="grid gap-3" data-tour="minhas-reservas-lista">
              {pageBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className="animate-fade-in-up rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-primary-200 hover:shadow-md"
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.24)}s` }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-gray-900 sm:text-xl">
                            {booking.course}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-gray-500">
                            Solicitada em {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        <span className={`w-fit rounded-lg border px-3 py-1 text-xs font-black ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoItem icon={Calendar} value={formatDate(booking.date)} />
                        <InfoItem icon={Clock} value={`${booking.startTime} - ${booking.endTime}`} />
                        <InfoItem icon={MapPin} value={`${booking.room.name} - ${booking.room.building}`} />
                        <InfoItem icon={Users} value={booking.students ? `${booking.students} alunos` : 'Alunos não informados'} />
                      </div>

                      {booking.notes && (
                        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                          <p className="line-clamp-2 text-sm text-gray-700">
                            <strong>Observações:</strong> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {booking.status === 'PENDENTE' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-600"
                      >
                        <XCircle size={16} />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredBookings.length > pageSize && (
              <PaginationControls
                currentPage={currentPage}
                pageCount={pageCount}
                onPrevious={() => setPage(Math.max(1, currentPage - 1))}
                onNext={() => setPage(Math.min(pageCount, currentPage + 1))}
              />
            )}
          </>
        ) : (
          <div className="rounded-xl border-2 border-gray-200 bg-white p-10 text-center" data-tour="minhas-reservas-lista">
            <Calendar size={56} className="mx-auto mb-4 text-gray-300" />
            <p className="mb-4 text-lg text-gray-500">
              {filter === 'TODAS' ? 'Você ainda não tem reservas' : `Nenhuma reserva ${filter.toLowerCase()}`}
            </p>
            {filter === 'TODAS' && (
              <button
                onClick={() => router.push('/professor/nova-reserva')}
                className="inline-block rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-3 font-bold text-white transition-all hover:shadow-lg"
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

function StatCard({
  label,
  value,
  tone = 'white',
}: {
  label: string;
  value: number;
  tone?: 'white' | 'yellow' | 'green' | 'red' | 'gray';
}) {
  const classes = {
    white: 'border-gray-200 bg-white text-gray-900',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    green: 'border-green-200 bg-green-50 text-green-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${classes[tone]}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-bold uppercase opacity-80">{label}</div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  value,
}: {
  icon: any;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
      <Icon size={15} className="flex-shrink-0 text-primary-500" />
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
}

function PaginationControls({
  currentPage,
  pageCount,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-gray-600">
        Página {currentPage} de {pageCount}
      </p>
      <div className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[92px] px-2 text-center text-sm font-black text-gray-700">
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= pageCount}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Próxima página"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function getBookingSortTime(booking: Booking) {
  return new Date(`${booking.date.slice(0, 10)}T${booking.startTime}:00`).getTime();
}

function formatDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}
