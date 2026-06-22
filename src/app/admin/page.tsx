'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
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

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'bookings' | 'users'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<BookingStatus>('TODAS');
  const [processingId, setProcessingId] = useState('');
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const isDemo = session?.user?.role === 'DEMO';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, usersRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/users'),
      ]);

      if (bookingsRes.ok) {
        setBookings(await bookingsRes.json());
      } else {
        toast.error(await readApiError(bookingsRes, 'Não foi possível carregar as reservas'));
      }

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      } else {
        toast.error(await readApiError(usersRes, 'Não foi possível carregar os usuários'));
      }
    } catch (error) {
      toast.error('Não foi possível carregar os dados do painel. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
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

  const pendingBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.status === 'PENDENTE')
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        return dateCompare || a.startTime.localeCompare(b.startTime);
      });
  }, [bookings]);

  const pendingPageCount = Math.max(1, Math.ceil(pendingBookings.length / pendingPageSize));
  const currentPendingPage = Math.min(pendingPage, pendingPageCount);
  const pendingStartIndex = (currentPendingPage - 1) * pendingPageSize;
  const pendingPageBookings = pendingBookings.slice(
    pendingStartIndex,
    pendingStartIndex + pendingPageSize
  );
  const pendingEndIndex = Math.min(pendingStartIndex + pendingPageSize, pendingBookings.length);

  const filteredBookings = useMemo(() => {
    const list = bookingFilter === 'TODAS'
      ? bookings
      : bookings.filter((booking) => booking.status === bookingFilter);

    return [...list].sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      return dateCompare || b.startTime.localeCompare(a.startTime);
    });
  }, [bookings, bookingFilter]);

  const stats = {
    totalBookings: bookings.length,
    pending: pendingBookings.length,
    approved: bookings.filter((booking) => booking.status === 'APROVADA').length,
    rejected: bookings.filter((booking) => booking.status === 'REJEITADA').length,
    totalUsers: users.length,
    professors: users.filter((user) => user.role === 'PROFESSOR').length,
    students: users.filter((user) => user.role === 'ALUNO').length,
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
            <Link href="/admin/salas" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold">
              Gerenciar Salas
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

        <div className="flex flex-wrap gap-2 mb-6" data-tour="admin-tabs">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <Calendar size={20} className="inline mr-2" />
            Reservas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white'
                : 'bg-white border-2 border-gray-200'
            }`}
          >
            <Users size={20} className="inline mr-2" />
            Usuários
          </button>
        </div>

        {activeTab === 'bookings' && (
          <div className="space-y-8">
            <section data-tour="admin-pendentes">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Pendentes de Aprovação</h2>
                  <p className="text-sm text-gray-600">
                    Analise as solicitações novas antes de liberar o ambiente.
                    {pendingBookings.length > 0 && (
                      <span className="block font-semibold text-gray-700 sm:inline">
                        {' '}Mostrando {pendingStartIndex + 1}-{pendingEndIndex} de {pendingBookings.length}.
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {pendingBookings.length > pendingPageSize && (
                    <PaginationControls
                      currentPage={currentPendingPage}
                      pageCount={pendingPageCount}
                      onPrevious={() => setPendingPage(Math.max(1, currentPendingPage - 1))}
                      onNext={() => setPendingPage(Math.min(pendingPageCount, currentPendingPage + 1))}
                    />
                  )}
                  <button
                    onClick={fetchData}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-700 hover:border-primary-400"
                  >
                    <RefreshCw size={16} />
                    Atualizar
                  </button>
                </div>
              </div>

              {pendingBookings.length > 0 ? (
                <>
                  <div className="grid gap-4">
                  {pendingPageBookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <BookingSummary booking={booking} />
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            onClick={() => handleApprove(booking)}
                            disabled={isDemo || processingId === booking.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            <Check size={18} />
                            Aprovar
                          </button>
                          <button
                            onClick={() => openRejectModal(booking)}
                            disabled={isDemo || processingId === booking.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            <X size={18} />
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>

                  {pendingBookings.length > pendingPageSize && (
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
                  <p className="text-sm text-gray-600">Use os filtros para acompanhar o histórico por status.</p>
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

              {filteredBookings.length > 0 ? (
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
                        {filteredBookings.map((booking) => (
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
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma reserva encontrada"
                  description="Não há reservas para o filtro selecionado."
                />
              )}
            </section>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Nome</th>
                    <th className="px-6 py-4 text-left">Email</th>
                    <th className="px-6 py-4 text-left">CPF</th>
                    <th className="px-6 py-4 text-left">Tipo</th>
                    <th className="px-6 py-4 text-left">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.cpf}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'DEMO' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{user._count.bookingsCreated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
    <div className={`rounded-xl border-2 p-6 ${toneClasses[tone]}`}>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm font-semibold opacity-80">{label}</div>
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
          {booking.room.name} • {booking.students} alunos
        </span>
      </div>
      {booking.notes && !compact && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700">
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
  return new Date(date).toLocaleDateString('pt-BR');
}
