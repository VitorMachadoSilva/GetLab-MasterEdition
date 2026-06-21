import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { cleanString, isValidCuid, readJsonObject } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';
import { BookingStatus, UserRole } from '@prisma/client';

const activeBookingStatuses = ['PENDENTE', 'APROVADA'] as const;
const validBookingStatuses = ['PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA'] as const;
const businessHours = {
  start: 7 * 60,
  end: 22 * 60,
};

function parseDateOnly(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return null;
  }

  return {
    dateObj,
    startDate: new Date(year, month - 1, day, 0, 0, 0, 0),
    endDate: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
}

function timeToMinutes(time: string) {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return Number.NaN;
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

// GET - Listar reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const professorId = searchParams.get('professorId');
    const roomId = searchParams.get('roomId');
    const publicView = searchParams.get('public') === 'true';
    const session = publicView ? await getServerSession(authOptions) : await getActiveServerSession();

    if (!session?.user && !publicView) {
      return apiError('Não autenticado', { status: 401 });
    }

    if (publicView && (!date || professorId || status !== 'APROVADA')) {
      return apiError('Consulta pública inválida', { status: 400 });
    }

    if (status && !validBookingStatuses.includes(status as BookingStatus)) {
      return apiError('Status inválido', { status: 400 });
    }

    if (professorId && !isValidCuid(professorId)) {
      return apiError('Professor inválido', { status: 400 });
    }

    if (roomId && !isValidCuid(roomId)) {
      return apiError('Sala inválida', { status: 400 });
    }

    if (!publicView && session?.user?.role !== 'ADMIN') {
      const isOwnBookingsQuery = professorId === session?.user?.id;
      const isAvailabilityQuery = Boolean(date && roomId && !professorId);
      const isApprovedScheduleQuery = status === 'APROVADA' && !professorId;

      if (professorId && !isOwnBookingsQuery) {
        return apiError('Sem permissão para consultar reservas de outro usuário', { status: 403 });
      }

      if (!professorId && !isAvailabilityQuery && !isApprovedScheduleQuery) {
        return apiError('Consulta de reservas não permitida para este usuário', { status: 403 });
      }
    }

    const where: any = {};

    // Filtrar por data - usa range para pegar qualquer hora do dia
    if (date) {
      const parsedDate = parseDateOnly(date);

      if (!parsedDate) {
        return apiError('Data inválida', { status: 400 });
      }
      
      where.date = {
        gte: parsedDate.startDate,
        lte: parsedDate.endDate,
      };
    }

    // Filtrar por status
    if (publicView) {
      where.status = 'APROVADA';
    } else if (status) {
      where.status = status;
    } else if (session?.user?.role !== 'ADMIN' && date && roomId && !professorId) {
      where.status = {
        in: [...activeBookingStatuses],
      };
    }

    // Filtrar por professor (para ver "Minhas Reservas")
    if (professorId) {
      where.professorId = professorId;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (publicView) {
      const bookings = await prisma.booking.findMany({
        where,
        select: {
          id: true,
          course: true,
          startTime: true,
          endTime: true,
          date: true,
          students: true,
          room: {
            select: {
              id: true,
              name: true,
              type: true,
              building: true,
            },
          },
          professor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' },
        ],
      });

      return NextResponse.json(bookings);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    return apiError('Erro ao buscar reservas', { status: 500 });
  }
}

// POST - Criar nova reserva
export async function POST(request: NextRequest) {
  try {
    const session = await getActiveServerSession();
    
    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    const sessionEmail = session.user.email?.toLowerCase();

    if (!sessionEmail) {
      return apiError('Sessão inválida. Faça login novamente.', { status: 401 });
    }

    let currentUser = await prisma.user.findUnique({
      where: { email: sessionEmail },
    });

    if (
      !currentUser &&
      session.user.role === 'ADMIN' &&
      sessionEmail === process.env.ADMIN_EMAIL?.toLowerCase()
    ) {
      currentUser = await prisma.user.create({
        data: {
          email: sessionEmail,
          cpf: 'ADMIN',
          name: session.user.name || 'Administrador',
          role: UserRole.ADMIN,
        },
      });
    }

    if (!currentUser) {
      return apiError('Usuário da sessão não existe mais. Faça logout e entre novamente.', {
        status: 401,
      });
    }

    // Apenas professores e admins podem criar reservas
    if (currentUser.role !== 'PROFESSOR' && currentUser.role !== 'ADMIN') {
      return apiError('Apenas professores podem criar reservas', { status: 403 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const body = parsedBody.data;
    const { roomId, course, startTime, endTime, date, students, notes } = body;

    // Validações
    if (!roomId || !course || !startTime || !endTime || !date || !students) {
      return apiError('Campos obrigatórios faltando', { status: 400 });
    }

    if (!isValidCuid(roomId)) {
      return apiError('Sala inválida', { status: 400 });
    }

    const courseName = cleanString(course);
    const bookingNotes = cleanString(notes);

    if (!courseName) {
      return apiError('Disciplina/evento é obrigatório', { status: 400 });
    }

    if (courseName.length > 120) {
      return apiError('Disciplina/evento deve ter no máximo 120 caracteres', { status: 400 });
    }

    if (bookingNotes.length > 500) {
      return apiError('Observações devem ter no máximo 500 caracteres', { status: 400 });
    }

    if (typeof date !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string') {
      return apiError('Data e horários devem ser informados corretamente', { status: 400 });
    }

    const parsedDate = parseDateOnly(date);

    if (!parsedDate) {
      return apiError('Data inválida', { status: 400 });
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      return apiError('Horário inválido', { status: 400 });
    }

    if (endMinutes <= startMinutes) {
      return apiError('Horário de término deve ser após o início', { status: 400 });
    }

    if (endMinutes - startMinutes < 60) {
      return apiError('A reserva deve ter no mínimo 1 hora de duração', { status: 400 });
    }

    if (startMinutes < businessHours.start || endMinutes > businessHours.end) {
      return apiError('Reservas devem ocorrer entre 07:00 e 22:00', { status: 400 });
    }

    const bookingDateTime = new Date(parsedDate.dateObj);
    bookingDateTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    const hoursDiff = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursDiff <= 0) {
      return apiError('Não é possível criar reserva para data ou horário já passado', {
        status: 400,
      });
    }

    if (currentUser.role !== 'ADMIN' && hoursDiff < 24) {
      return apiError('A reserva deve ser feita com no mínimo 24 horas de antecedência', {
        status: 400,
      });
    }

    const studentsCount = Number(students);

    if (!Number.isInteger(studentsCount) || studentsCount < 1) {
      return apiError('Número de alunos inválido', { status: 400 });
    }

    // Verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return apiError('Sala não encontrada', { status: 404 });
    }

    if (!room.active) {
      return apiError('Sala inativa', { status: 400 });
    }

    // Verificar capacidade
    if (studentsCount > room.capacity) {
      return apiError(`Sala comporta apenas ${room.capacity} alunos`, { status: 400 });
    }

    const conflicts = await prisma.booking.findMany({
      where: {
        roomId,
        date: {
          gte: parsedDate.startDate,
          lte: parsedDate.endDate,
        },
        status: {
          in: [...activeBookingStatuses],
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflicts.length > 0) {
      return apiError('Conflito de horário', {
        status: 409,
        details: {
          conflicts: conflicts.map((c) => ({
            course: c.course,
            startTime: c.startTime,
            endTime: c.endTime,
          })),
        },
      });
    }

    // Criar reserva
    const booking = await prisma.booking.create({
      data: {
        roomId,
        professorId: currentUser.id,
        course: courseName,
        startTime,
        endTime,
        date: parsedDate.dateObj,
        students: studentsCount,
        notes: bookingNotes || null,
        status: currentUser.role === 'ADMIN' ? 'APROVADA' : 'PENDENTE',
      },
      include: {
        room: true,
        professor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    return apiError('Erro ao criar reserva', { status: 500 });
  }
}
