'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileBarChart, Filter, PieChart, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/Loading';
import SelectField from '@/components/SelectField';
import { readApiError } from '@/lib/api-client';

type BookingStatus = 'TODAS' | 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';
type PeriodFilter = '30' | '60' | '90' | '180' | 'CURRENT_YEAR';
type ChartType = 'pie' | 'vertical' | 'horizontal';

type Booking = {
  id: string;
  course: string;
  date: string;
  startTime: string;
  endTime: string;
  students: number;
  status: Exclude<BookingStatus, 'TODAS'>;
  room: { id: string; name: string; type: string; building: string };
  professor: { id: string; name: string; email: string };
};

type Room = {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  building: string;
  equipment: string[];
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const statusOptions = [
  { value: 'TODAS', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'APROVADA', label: 'Aprovadas' },
  { value: 'REJEITADA', label: 'Rejeitadas' },
  { value: 'CANCELADA', label: 'Canceladas' },
];

const periodOptions = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 180 dias' },
  { value: 'CURRENT_YEAR', label: 'Ano atual' },
];

const chartOptions = [
  { value: 'pie', label: 'Gráfico de pizza' },
  { value: 'vertical', label: 'Barras verticais' },
  { value: 'horizontal', label: 'Barras horizontais' },
];

const chartColors = [
  '#315f9f',
  '#4f7fc0',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#64748b',
];

export default function RelatoriosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<BookingStatus>('TODAS');
  const [period, setPeriod] = useState<PeriodFilter>('30');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [bookingsRes, roomsRes, usersRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/rooms'),
        fetch('/api/users'),
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      else toast.error(await readApiError(bookingsRes, 'Não foi possível carregar as reservas'));

      if (roomsRes.ok) setRooms(await roomsRes.json());
      else toast.error(await readApiError(roomsRes, 'Não foi possível carregar as salas'));

      if (usersRes.ok) setUsers(await usersRes.json());
      else toast.error(await readApiError(usersRes, 'Não foi possível carregar os usuários'));
    } catch (error) {
      toast.error('Não foi possível carregar os relatórios. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const periodStart = getPeriodStartDate(period);

    return bookings.filter((booking) => {
      const bookingDate = booking.date.slice(0, 10);
      const matchesStatus = status === 'TODAS' || booking.status === status;
      const matchesPeriod = bookingDate >= periodStart;

      return matchesStatus && matchesPeriod;
    });
  }, [bookings, period, status]);

  const metrics = useMemo(() => {
    const approved = filteredBookings.filter((booking) => booking.status === 'APROVADA');
    const registeredStudents = users.filter((user) => user.role === 'ALUNO').length;
    const roomUse = countBy(filteredBookings, (booking) => booking.room.name);
    const statusUse = countBy(filteredBookings, (booking) => booking.status);
    const professorUse = countBy(filteredBookings, (booking) => booking.professor.name);
    const monthUse = countBy(filteredBookings, (booking) => formatMonthKey(booking.date));
    const roomTypeUse = countBy(filteredBookings, (booking) => getRoomTypeLabel(booking.room.type));

    return {
      totalBookings: filteredBookings.length,
      approved: approved.length,
      pending: filteredBookings.filter((booking) => booking.status === 'PENDENTE').length,
      canceled: filteredBookings.filter((booking) => booking.status === 'CANCELADA').length,
      registeredStudents,
      approvalRate: filteredBookings.length ? Math.round((approved.length / filteredBookings.length) * 100) : 0,
      roomUse,
      statusUse,
      professorUse,
      monthUse,
      roomTypeUse,
    };
  }, [filteredBookings, users]);

  const exportCsv = () => {
    const rows = [
      ['Data', 'Horario', 'Status', 'Disciplina', 'Sala', 'Professor', 'Alunos informados'],
      ...filteredBookings.map((booking) => [
        formatDate(booking.date),
        `${booking.startTime}-${booking.endTime}`,
        booking.status,
        booking.course,
        booking.room.name,
        booking.professor.name,
        booking.students ? String(booking.students) : 'Não informado',
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorios-getlab-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border-2 border-primary-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-black text-gray-900 sm:text-4xl">
                <FileBarChart className="text-primary-600" size={36} />
                Relatórios
              </h1>
              <p className="mt-2 text-gray-600">Métricas, filtros, gráficos e exportação dos dados do sistema.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-5 py-3 font-bold text-primary-700 hover:border-primary-400 disabled:opacity-60"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                Atualizar
              </button>
              <button
                onClick={exportCsv}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-3 font-bold text-white hover:shadow-lg"
              >
                <Download size={18} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-gray-700">
            <Filter size={18} className="text-primary-600" />
            Filtros
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-gray-500">Status</label>
              <SelectField
                value={status}
                placeholder="Todos os status"
                options={statusOptions}
                compact
                onChange={(value) => setStatus(value as BookingStatus)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-gray-500">Período</label>
              <SelectField
                value={period}
                placeholder="Período"
                options={periodOptions}
                compact
                onChange={(value) => setPeriod(value as PeriodFilter)}
              />
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Reservas" value={metrics.totalBookings} />
          <Metric label="Aprovadas" value={metrics.approved} tone="green" />
          <Metric label="Pendentes" value={metrics.pending} tone="yellow" />
          <Metric label="Canceladas" value={metrics.canceled} tone="gray" />
          <Metric label="Alunos Cadastrados" value={metrics.registeredStudents} tone="blue" />
          <Metric label="Aprovação" value={`${metrics.approvalRate}%`} tone="purple" />
        </div>

        <section className="mb-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black text-gray-900">
                <BarChart3 size={24} className="text-primary-600" />
                Área de Gráficos
              </h2>
              <p className="text-sm font-semibold text-gray-500">
                Visualize distribuição, volume e uso dos recursos do sistema.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-black text-primary-700">
              <PieChart size={16} />
              {filteredBookings.length} reserva(s) filtrada(s)
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Chart title="Reservas por Status" data={metrics.statusUse} />
            <Chart title="Uso por Sala" data={metrics.roomUse} />
            <Chart title="Reservas por Professor" data={metrics.professorUse} />
            <Chart title="Reservas por Mês" data={metrics.monthUse} />
            <Chart title="Tipos de Sala" data={metrics.roomTypeUse} />

            <section className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-gray-900">
                <Users size={20} className="text-primary-600" />
                Resumo Operacional
              </h2>
              <div className="grid gap-3 text-sm">
                <InfoRow label="Salas cadastradas" value={`${rooms.length}`} />
                <InfoRow label="Usuários cadastrados" value={`${users.length}`} />
                <InfoRow label="Alunos cadastrados" value={`${metrics.registeredStudents}`} />
                <InfoRow label="Professores" value={`${users.filter((user) => user.role === 'PROFESSOR').length}`} />
                <InfoRow label="Capacidade total informada" value={`${rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)} pessoas`} />
                <InfoRow label="Equipamentos únicos em uso" value={`${new Set(rooms.flatMap((room) => room.equipment || [])).size}`} />
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function getPeriodStartDate(period: PeriodFilter) {
  const today = new Date();

  if (period === 'CURRENT_YEAR') {
    return `${today.getFullYear()}-01-01`;
  }

  const start = new Date(today);
  start.setDate(today.getDate() - Number(period));
  return formatDateInputValue(start);
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function formatMonthKey(date: string) {
  const [year, month] = date.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });
}

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    LABORATORIO: 'Laboratório',
    SALA_AULA: 'Sala de Aula',
    AUDITORIO: 'Auditório',
  };

  return labels[type] || type;
}

function Metric({
  label,
  value,
  tone = 'white',
}: {
  label: string;
  value: number | string;
  tone?: 'white' | 'green' | 'yellow' | 'gray' | 'blue' | 'purple';
}) {
  const classes = {
    white: 'border-gray-200 bg-white text-gray-900',
    green: 'border-green-200 bg-green-50 text-green-800',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    purple: 'border-purple-200 bg-purple-50 text-purple-800',
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${classes[tone]}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs font-bold uppercase opacity-80">{label}</div>
    </div>
  );
}

function Chart({ title, data }: { title: string; data: Record<string, number> }) {
  const [chartType, setChartType] = useState<ChartType>('horizontal');
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const max = Math.max(1, ...entries.map(([, value]) => value));

  return (
    <section className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        <div className="w-full sm:w-48">
          <SelectField
            value={chartType}
            placeholder="Visualização"
            options={chartOptions}
            compact
            onChange={(value) => setChartType(value as ChartType)}
          />
        </div>
      </div>

      {entries.length > 0 ? (
        <>
          {chartType === 'horizontal' && <HorizontalChart entries={entries} max={max} />}
          {chartType === 'vertical' && <VerticalChart entries={entries} max={max} />}
          {chartType === 'pie' && <PieChartView entries={entries} total={total} />}
        </>
      ) : (
        <div className="rounded-xl bg-gray-50 p-6 text-center text-sm font-semibold text-gray-500">
          Sem dados para os filtros selecionados.
        </div>
      )}
    </section>
  );
}

function HorizontalChart({ entries, max }: { entries: Array<[string, number]>; max: number }) {
  return (
    <div className="space-y-3">
      {entries.map(([label, value], index) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-bold text-gray-700">{label}</span>
            <span className="font-black text-primary-700">{value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(6, (value / max) * 100)}%`,
                backgroundColor: chartColors[index % chartColors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VerticalChart({ entries, max }: { entries: Array<[string, number]>; max: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[420px] items-end gap-3 pt-2">
        {entries.map(([label, value], index) => (
          <div key={label} className="flex min-w-14 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center rounded-xl bg-gray-50 px-2 py-2">
              <div
                className="w-full max-w-10 rounded-t-lg"
                style={{
                  height: `${Math.max(10, (value / max) * 100)}%`,
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
            </div>
            <span className="text-sm font-black text-primary-700">{value}</span>
            <span className="line-clamp-2 min-h-9 text-center text-xs font-bold text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartView({ entries, total }: { entries: Array<[string, number]>; total: number }) {
  let accumulated = 0;
  const gradient = entries
    .map(([, value], index) => {
      const start = accumulated;
      const end = accumulated + (value / total) * 100;
      accumulated = end;
      return `${chartColors[index % chartColors.length]} ${start}% ${end}%`;
    })
    .join(', ');

  return (
    <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center">
      <div
        className="mx-auto h-44 w-44 rounded-full border-8 border-white shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-label="Gráfico de pizza"
      />
      <div className="grid gap-2">
        {entries.map(([label, value], index) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-bold text-gray-700">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <span className="truncate">{label}</span>
            </span>
            <span className="font-black text-primary-700">
              {value} ({Math.round((value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <span className="font-bold text-gray-600">{label}</span>
      <span className="font-black text-gray-900">{value}</span>
    </div>
  );
}
