import { NextRequest, NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { canReadAdminViews } from '@/lib/demo-access';
import { prisma } from '@/lib/prisma';
import { getActiveServerSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const validStatuses = ['PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA'] as const;
const validPeriods = ['30', '60', '90', '180', 'CURRENT_YEAR'] as const;

type ReportStatus = 'TODAS' | (typeof validStatuses)[number];
type ReportPeriod = (typeof validPeriods)[number];

const roomTypeLabels: Record<string, string> = {
  LABORATORIO: 'Laboratório',
  SALA_AULA: 'Sala de Aula',
  AUDITORIO: 'Auditório',
};

function parseStatus(value: string | null): ReportStatus | null {
  if (!value || value === 'TODAS') return 'TODAS';
  return validStatuses.includes(value as BookingStatus) ? (value as ReportStatus) : null;
}

function parsePeriod(value: string | null): ReportPeriod {
  return validPeriods.includes(value as ReportPeriod) ? (value as ReportPeriod) : '30';
}

function getPeriodStartDate(period: ReportPeriod) {
  const today = new Date();

  if (period === 'CURRENT_YEAR') {
    return new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  const start = new Date(today);
  start.setDate(today.getDate() - Number(period));
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR');
}

function formatMonthKey(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });
}

function toCountMap<T extends string>(items: Array<{ key: T; count: number }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = item.count;
    return acc;
  }, {});
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session?.user || !canReadAdminViews(session.user.role)) {
      return apiError('Apenas administradores podem consultar relatórios', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = parseStatus(searchParams.get('status'));
    const period = parsePeriod(searchParams.get('period'));
    const exportCsv = searchParams.get('export') === 'csv';

    if (!status) {
      return apiError('Status inválido', { status: 400 });
    }

    const where: {
      date: { gte: Date };
      status?: BookingStatus;
    } = {
      date: {
        gte: getPeriodStartDate(period),
      },
    };

    if (status !== 'TODAS') {
      where.status = status;
    }

    if (exportCsv) {
      const rows = await prisma.booking.findMany({
        where,
        select: {
          course: true,
          date: true,
          startTime: true,
          endTime: true,
          students: true,
          status: true,
          room: {
            select: {
              name: true,
            },
          },
          professor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { date: 'desc' },
          { startTime: 'desc' },
        ],
      });

      const csv = [
        ['Data', 'Horario', 'Status', 'Disciplina', 'Sala', 'Professor', 'Alunos informados'],
        ...rows.map((booking) => [
          formatDate(booking.date),
          `${booking.startTime}-${booking.endTime}`,
          booking.status,
          booking.course,
          booking.room.name,
          booking.professor.name,
          booking.students ? String(booking.students) : 'Não informado',
        ]),
      ]
        .map((row) => row.map(csvCell).join(';'))
        .join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorios-getlab-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const [
      totalBookings,
      statusRows,
      roomRows,
      professorRows,
      bookingsForMonthAndType,
      activeRooms,
      totalUsers,
      registeredStudents,
      professors,
    ] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.booking.groupBy({
        by: ['roomId'],
        where,
        _count: { _all: true },
      }),
      prisma.booking.groupBy({
        by: ['professorId'],
        where,
        _count: { _all: true },
      }),
      prisma.booking.findMany({
        where,
        select: {
          date: true,
          room: {
            select: {
              id: true,
              type: true,
            },
          },
        },
      }),
      prisma.room.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          capacity: true,
          equipment: true,
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ALUNO' } }),
      prisma.user.count({ where: { role: 'PROFESSOR' } }),
    ]);

    const [roomsForCharts, professorsForCharts] = await Promise.all([
      roomRows.length
        ? prisma.room.findMany({
            where: {
              id: {
                in: roomRows.map((row) => row.roomId),
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : Promise.resolve([]),
      professorRows.length
        ? prisma.user.findMany({
            where: {
              id: {
                in: professorRows.map((row) => row.professorId),
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const roomNameById = new Map(roomsForCharts.map((room) => [room.id, room.name]));
    const professorNameById = new Map(professorsForCharts.map((professor) => [professor.id, professor.name]));
    const statusUse = statusRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});
    const monthUse = bookingsForMonthAndType.reduce<Record<string, number>>((acc, booking) => {
      const key = formatMonthKey(booking.date);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const roomTypeUse = bookingsForMonthAndType.reduce<Record<string, number>>((acc, booking) => {
      const key = roomTypeLabels[booking.room.type] || booking.room.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const approved = statusUse.APROVADA || 0;

    return NextResponse.json({
      metrics: {
        totalBookings,
        approved,
        pending: statusUse.PENDENTE || 0,
        canceled: statusUse.CANCELADA || 0,
        registeredStudents,
        approvalRate: totalBookings ? Math.round((approved / totalBookings) * 100) : 0,
      },
      charts: {
        roomUse: toCountMap(
          roomRows
            .map((row) => ({
              key: roomNameById.get(row.roomId) || 'Sala removida',
              count: row._count._all,
            }))
            .sort((a, b) => b.count - a.count),
        ),
        statusUse,
        professorUse: toCountMap(
          professorRows
            .map((row) => ({
              key: professorNameById.get(row.professorId) || 'Professor removido',
              count: row._count._all,
            }))
            .sort((a, b) => b.count - a.count),
        ),
        monthUse,
        roomTypeUse,
      },
      operational: {
        rooms: activeRooms.length,
        users: totalUsers,
        students: registeredStudents,
        professors,
        capacity: activeRooms.reduce((sum, room) => sum + (room.capacity || 0), 0),
        equipment: new Set(activeRooms.flatMap((room) => room.equipment || [])).size,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    return apiError('Erro ao gerar relatórios', { status: 500 });
  }
}
