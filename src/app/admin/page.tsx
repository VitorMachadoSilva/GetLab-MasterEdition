'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileBarChart,
  MessageSquare,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { readApiError } from '@/lib/api-client';

type BookingStatus = 'TODAS' | 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';

type Booking = {
  id: string;
  course: string;
  date: string;
  startTime: string;
  endTime: string;
  students: number;
  status: Exclude<BookingStatus, 'TODAS'>;
  notes?: string | null;
  professor: {
    name: string;
    email: string;
  };
  room: {
    name: string;
    building?: string;
  };
};

type User = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'ADMIN' | 'PROFESSOR' | 'ALUNO' | 'DEMO';
  _count: {
    bookingsCreated: number;
  };
};

type PaginatedBookingsResponse = {
  data: Booking[];
  total: number;
  page: number;
  pageCount: number;
  summary?: {
    total: number;
    byStatus: Record<string, number>;
  };
};

type PaginatedUsersResponse = {
  data: User[];
  total: number;
  page: number;
  pageCount: number;
  summary?: {
    total: number;
    byRole: Record<string, number>;
  };
};

const statusOptions: Array<{ value: BookingStatus; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'APROVADA', label: 'Aprovadas' },
  { value: 'REJEITADA', label: 'Rejeitadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

const statusClasses = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APROVADA: 'bg-green-100 text-green-800 border-green-200',
  REJEITADA: 'bg-red-100 text-red-800 border-red-200',
  CANCELADA: 'bg-gray-100 text-gray-800 border-gray-200',
};

const pendingPageSize = 4;

function buildBookingsUrl({
  page,
  limit,
  status,
  sort,
  includeSummary,
}: {
  page: number;
  limit: number;
  status?: BookingStatus;
  sort: 'asc' | 'desc';
  includeSummary?: boolean;
}) {
  const params = new URLSearchParams({
    paginated: 'true',
    page: String(page),
    limit: String(limit),
    sort,
  });

  if (status && status !== 'TODAS') {
    params.set('status', status);
  }

  if (includeSummary === false) {
    params.set('includeSummary', 'false');
  }

  return `/api/bookings?${params.toString()}`;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookingSummary, setBookingSummary] = useState<Record<string, number>>({});
  const [allBookingsTotal, setAllBookingsTotal] = useState(0);
  const [allBookingsPageCount, setAllBookingsPageCount] = useState(1);
  const [pendingBookingsTotal, setPendingBookingsTotal] = useState(0);
  const [pendingPageCount, setPendingPageCount] = useState(1);
  const [userSummary, setUserSummary] = useState<Record<string, number>>({});
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus>('TODAS');
  const [processingId, setProcessingId] = useState('');
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [allBookingsPage, setAllBookingsPage] = useState(1);
  const isDemo = session?.user?.role === 'DEMO';

  useEffect(() => {
    fetchData();
  }, [bookingFilter, allBookingsPage, pendingPage]);

  useEffect(() => {
    setAllBookingsPage(1);
  }, [bookingFilter]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [bookingsRes, usersRes] = await Promise.all([
        fetch(buildBookingsUrl({
          page: allBookingsPage,
          limit: 10,
          status: bookingFilter === 'TODAS' ? undefined : bookingFilter,
          sort: 'desc',
        })),
        fetch('/api/users?summaryOnly=true&includeDepartments=false'),
      ]);
      const pendingRes = await fetch(buildBookingsUrl({
        page: pendingPage,
        limit: pendingPageSize,
        status: 'PENDENTE',
        sort: 'asc',
        includeSummary: false,
      }));

      if (bookingsRes.ok) {
        const payload = (await bookingsRes.json()) as PaginatedBookingsResponse;
        setBookings(payload.data);
        setAllBookingsTotal(payload.total);
        setAllBookingsPageCount(payload.pageCount);
        setBookingSummary(payload.summary?.byStatus || {});
      } else {
        toast.error(await readApiError(bookingsRes, 'Não foi possível carregar as reservas'));
      }

      if (pendingRes.ok) {
        const payload = (await pendingRes.json()) as PaginatedBookingsResponse;
        setPendingBookings(payload.data);
        setPendingBookingsTotal(payload.total);
        setPendingPageCount(payload.pageCount);
      } else {
        toast.error(await readApiError(pendingRes, 'Não foi possível carregar as reservas pendentes'));
      }

      if (usersRes.ok) {
        const payload = (await usersRes.json()) as PaginatedUsersResponse;
        setUsers(payload.data);
        setTotalUsers(payload.summary?.total ?? payload.total);
        setUserSummary(payload.summary?.byRole || {});
      } else {
        toast.error(await readApiError(usersRes, 'Não foi possível carregar os usuários'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar os dados do painel. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (booking: Booking) => {
    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    setProcessingId(booking.id);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APROVADA' }),
      });

      if (res.ok) {
        toast.success('Reserva aprovada!');
        await fetchData();
      } else {
        toast.error(await readApiError(res, 'Não foi possível aprovar a reserva'));
      }
    } catch (error) {
      toast.error('Não foi possível aprovar a reserva. Verifique sua conexão e tente novamente.');
    } finally {
      setProcessingId('');
    }
  };

  const openRejectModal = (booking: Booking) => {
    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    setRejectingBooking(booking);
    setRejectionReason('');
  };

  const handleReject = async () => {
    const reason = rejectionReason.trim();

    if (!rejectingBooking) return;

    if (!reason) {
      toast.error('Informe um motivo para rejeitar a reserva');
      return;
    }

    setProcessingId(rejectingBooking.id);

    try {
      const res = await fetch(`/api/bookings/${rejectingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJEITADA', reason }),
      });

      if (res.ok) {
        toast.success('Reserva rejeitada');
        setRejectingBooking(null);
        setRejectionReason('');
        await fetchData();
      } else {
        toast.error(await readApiError(res, 'Não foi possível rejeitar a reserva'));
      }
    } catch (error) {
      toast.error('Não foi possível rejeitar a reserva. Verifique sua conexão e tente novamente.');
    } finally {
      setProcessingId('');
    }
  };

  const handleDeleteBooking = async (booking: Booking) => {
    if (isDemo) {
      toast.error('Perfil DEMO possui acesso somente para visualização.');
      return;
    }

    if (!confirm(`Excluir a reserva "${booking.course}"?`)) return;

    setProcessingId(booking.id);

    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Reserva excluída');
        await fetchData();
      } else {
        toast.error(await readApiError(res, 'Não foi possível excluir a reserva'));
      }
    } catch (error) {
      toast.error('Não foi possível excluir a reserva. Verifique sua conexão e tente novamente.');
    } finally {
      setProcessingId('');
    }
  };

  const currentPendingPage = Math.min(pendingPage, pendingPageCount);
  const pendingStartIndex = (currentPendingPage - 1) * pendingPageSize;
  const pendingPageBookings = pendingBookings;
  const pendingEndIndex = Math.min(pendingStartIndex + pendingBookings.length, pendingBookingsTotal);

  const allBookingsPageSize = 10;
  const currentAllBookingsPage = Math.min(allBookingsPage, allBookingsPageCount);
  const allBookingsStartIndex = (currentAllBookingsPage - 1) * allBookingsPageSize;
  const allBookingsPageItems = bookings;
  const allBookingsEndIndex = Math.min(allBookingsStartIndex + bookings.length, allBookingsTotal);

  const stats = {
    totalBookings: Object.values(bookingSummary).reduce((sum, value) => sum + value, 0),
    pending: bookingSummary.PENDENTE || 0,
    approved: bookingSummary.APROVADA || 0,
    rejected: bookingSummary.REJEITADA || 0,
    totalUsers,
    professors: userSummary.PROFESSOR || 0,
    students: userSummary.ALUNO || 0,
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8" data-tour="admin-header">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários e reservas do sistema</p>
          {isDemo && (
            <div className="mt-4 rounded-2xl border-2 border-purple-200 bg-purple-50 px-4 py-3 text-sm font-bold text-purple-800">
              Modo DEMO: navegação liberada, alterações bloqueadas.
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/admin/usuarios" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
              Gerenciar Usuários
            </Link>
            <Link href="/admin/alunos" className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-semibold">
              Gerenciar Alunos
            </Link>
            <Link href="/admin/salas" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
              Gerenciar Salas
            </Link>
            <Link href="/admin/relatorios" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold">
              <FileBarChart size={18} />
              Relatórios
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" data-tour="admin-metricas">
          <MetricCard label="Total Reservas" value={stats.totalBookings} />
          <MetricCard label="Pendentes" value={stats.pending} tone="yellow" />
          <MetricCard label="Aprovadas" value={stats.approved} tone="green" />
          <MetricCard label="Rejeitadas" value={stats.rejected} tone="red" />
          <MetricCard label="Total Usuários" value={stats.totalUsers} tone="blue" />
        </div>

        <div className="space-y-8">
            <section data-tour="admin-pendentes">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Pendentes de Aprovação</h2>
                  <p className="text-sm text-gray-600">
                    Analise as solicitações novas antes de liberar o ambiente.
                    {pendingBookingsTotal > 0 && (
                      <span className="block font-semibold text-gray-700 sm:inline">
                        {' '}Mostrando {pendingStartIndex + 1}-{pendingEndIndex} de {pendingBookingsTotal}.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {pendingBookingsTotal > pendingPageSize && (
                    <PaginationControls
                      currentPage={currentPendingPage}
                      pageCount={pendingPageCount}
                      onPrevious={() => setPendingPage(Math.max(1, currentPendingPage - 1))}
                      onNext={() => setPendingPage(Math.min(pendingPageCount, currentPendingPage + 1))}
                    />
                  )}
                  <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 hover:border-primary-400"
                  >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                </div>
              </div>

              {pendingBookingsTotal > 0 ? (
                <>
                  <div className="grid gap-4">
                  {pendingPageBookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <BookingSummary booking={booking} compact />
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            onClick={() => handleApprove(booking)}
                            disabled={isDemo || processingId === booking.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            <Check size={16} />
                            Aprovar
                          </button>
                          <button
                            onClick={() => openRejectModal(booking)}
                            disabled={isDemo || processingId === booking.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            <X size={16} />
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>

                  {pendingBookingsTotal > pendingPageSize && (
                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-yellow-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-gray-600">
                        Página {currentPendingPage} de {pendingPageCount} das solicitações pendentes.
                      </p>
                      <PaginationControls
                        currentPage={currentPendingPage}
                        pageCount={pendingPageCount}
                        onPrevious={() => setPendingPage(Math.max(1, currentPendingPage - 1))}
                        onNext={() => setPendingPage(Math.min(pendingPageCount, currentPendingPage + 1))}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="Nenhuma reserva pendente"
                  description="Quando um professor enviar uma solicitação, ela aparecerá aqui para aprovação."
                />
              )}
            </section>

            <section data-tour="admin-historico">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Todas as Reservas</h2>
                  <p className="text-sm text-gray-600">
                    Use os filtros para acompanhar o histórico por status.
                    {allBookingsTotal > 0 && (
                      <span className="block font-semibold text-gray-700 sm:inline">
                        {' '}Mostrando {allBookingsStartIndex + 1}-{allBookingsEndIndex} de {allBookingsTotal}.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBookingFilter(option.value)}
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all ${
                        bookingFilter === option.value
                          ? 'border-primary-500 bg-primary-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {allBookingsTotal > 0 ? (
                <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                        <tr>
                          <th className="px-5 py-4 text-left">Disciplina</th>
                          <th className="px-5 py-4 text-left">Professor</th>
                          <th className="px-5 py-4 text-left">Data</th>
                          <th className="px-5 py-4 text-left">Horário</th>
                          <th className="px-5 py-4 text-left">Sala</th>
                          <th className="px-5 py-4 text-left">Status</th>
                          <th className="px-5 py-4 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBookingsPageItems.map((booking) => (
                          <tr key={booking.id} className="border-b hover:bg-gray-50">
                            <td className="px-5 py-4 font-bold text-gray-900">{booking.course}</td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-gray-800">{booking.professor.name}</div>
                              <div className="text-xs text-gray-500">{booking.professor.email}</div>
                            </td>
                            <td className="px-5 py-4">{formatDate(booking.date)}</td>
                            <td className="px-5 py-4">{booking.startTime}-{booking.endTime}</td>
                            <td className="px-5 py-4">{booking.room.name}</td>
                            <td className="px-5 py-4">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex gap-2">
                                {booking.status === 'PENDENTE' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(booking)}
                                      disabled={isDemo || processingId === booking.id}
                                      className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:opacity-60"
                                      title="Aprovar reserva"
                                    >
                                      <Check size={18} />
                                    </button>
                                    <button
                                      onClick={() => openRejectModal(booking)}
                                      disabled={isDemo || processingId === booking.id}
                                      className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100 disabled:opacity-60"
                                      title="Rejeitar reserva"
                                    >
                                      <X size={18} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteBooking(booking)}
                                  disabled={isDemo || processingId === booking.id}
                                  className="rounded-lg bg-gray-50 p-2 text-gray-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                                  title="Excluir reserva"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {allBookingsTotal > allBookingsPageSize && (
                    <div className="flex flex-col gap-3 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-gray-600">
                        Página {currentAllBookingsPage} de {allBookingsPageCount} do histórico.
                      </p>
                      <PaginationControls
                        currentPage={currentAllBookingsPage}
                        pageCount={allBookingsPageCount}
                        onPrevious={() => setAllBookingsPage(Math.max(1, currentAllBookingsPage - 1))}
                        onNext={() => setAllBookingsPage(Math.min(allBookingsPageCount, currentAllBookingsPage + 1))}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma reserva encontrada"
                  description="Não há reservas para o filtro selecionado."
                />
              )}
            </section>
          </div>
      </div>

      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Rejeitar reserva</h2>
                <p className="text-sm text-gray-600">O motivo ficará registrado nas observações da solicitação.</p>
              </div>
              <button
                onClick={() => setRejectingBooking(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mb-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-4">
              <BookingSummary booking={rejectingBooking} compact />
            </div>

            <label className="mb-2 flex items-center gap-2 text-sm font-black text-gray-700">
              <MessageSquare size={16} className="text-primary-600" />
              Motivo da rejeição *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Ex: sala já reservada para manutenção, capacidade insuficiente, ajuste de horário necessário..."
              className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            />
            <div className="mt-1 text-right text-xs font-semibold text-gray-500">
              {rejectionReason.length}/500
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setRejectingBooking(null)}
                className="flex-1 rounded-xl border-2 border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === rejectingBooking.id}
                className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {processingId === rejectingBooking.id ? 'Rejeitando...' : 'Confirmar rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: number;
  tone?: 'gray' | 'yellow' | 'green' | 'red' | 'blue';
}) {
  const toneClasses = {
    gray: 'bg-white border-gray-200 text-gray-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${toneClasses[tone]}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-bold uppercase opacity-80">{label}</div>
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
    <div className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white p-1">
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
  );
}

function BookingSummary({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-black text-gray-900`}>{booking.course}</h3>
        <StatusBadge status={booking.status} />
      </div>
      <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
        <span className="flex items-center gap-2">
          <Users size={15} className="text-primary-600" />
          {booking.professor.name}
        </span>
        <span className="flex items-center gap-2">
          <Calendar size={15} className="text-primary-600" />
          {formatDate(booking.date)}
        </span>
        <span className="flex items-center gap-2">
          <Clock size={15} className="text-primary-600" />
          {booking.startTime}-{booking.endTime}
        </span>
        <span className="flex items-center gap-2">
          <AlertCircle size={15} className="text-primary-600" />
          {booking.room.name} • {booking.students ? `${booking.students} alunos` : 'alunos não informados'}
        </span>
      </div>
      {booking.notes && !compact && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${
          booking.status === 'CANCELADA' && booking.notes.includes('Cancelamento automático')
            ? 'border border-orange-200 bg-orange-50 text-orange-800'
            : 'bg-white/70 text-gray-700'
        }`}>
          <strong>Observações:</strong> {booking.notes}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Exclude<BookingStatus, 'TODAS'> }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
      <Calendar size={42} className="mx-auto mb-3 text-gray-300" />
      <h3 className="text-xl font-black text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}
