import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Deleta automaticamente reservas cujo período já encerrou
async function deletePastBookings() {
  try {
    const now = new Date();

    const allBookings = await prisma.booking.findMany({
      select: { id: true, date: true, endTime: true },
    });

    const expiredIds = allBookings
      .filter(({ date, endTime }) => {
        const isoDate = date.toISOString().split('T')[0];
        const [year, month, day] = isoDate.split('-').map(Number);
        const [hours, minutes] = endTime.split(':').map(Number);
        const end = new Date(year, month - 1, day, hours, minutes, 0, 0);
        return now > end;
      })
      .map((b) => b.id);

    if (expiredIds.length > 0) {
      await prisma.booking.deleteMany({ where: { id: { in: expiredIds } } });
      console.log(`🧹 ${expiredIds.length} reserva(s) expirada(s) removida(s) do banco.`);
    }
  } catch (error) {
    console.error('Erro ao limpar reservas expiradas:', error);
  }
}

// GET - Listar reservas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Limpa reservas expiradas a cada requisição autenticada
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const professorId = searchParams.get('professorId');
    const roomId = searchParams.get('roomId'); // ✅ ADICIONADO

    const where: any = {};

    // Filtrar por sala específica ✅
    if (roomId) {
      where.roomId = roomId;
    }

    // Filtrar por data - usa range para pegar qualquer hora do dia
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Filtrar por status
    if (status) {
      where.status = status;
    }

    // Filtrar por professor (para ver "Minhas Reservas")
    if (professorId) {
      where.professorId = professorId;
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
    return NextResponse.json(
      { error: 'Erro ao buscar reservas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova reserva
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas professores e admins podem criar reservas
    if (session.user.role !== 'PROFESSOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas professores podem criar reservas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { roomId, course, startTime, endTime, date, students, notes } = body;

    // Validações
    if (!roomId || !course || !startTime || !endTime || !date || !students) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 });
    }

    // Verificar capacidade
    if (students > room.capacity) {
      return NextResponse.json(
        { error: `Sala comporta apenas ${room.capacity} alunos` },
        { status: 400 }
      );
    }

    // Verificar conflitos de horário
    // Cria data no formato local sem conversão UTC
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const conflicts = await prisma.booking.findMany({
      where: {
        roomId,
        date: dateObj,
        status: {
          in: ['PENDENTE', 'APROVADA'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Conflito de horário',
          conflicts: conflicts.map((c) => ({
            course: c.course,
            startTime: c.startTime,
            endTime: c.endTime,
          })),
        },
        { status: 409 }
      );
    }

    // Criar reserva
    const booking = await prisma.booking.create({
      data: {
        roomId,
        professorId: session.user.id,
        course,
        startTime,
        endTime,
        date: dateObj,
        students: parseInt(students),
        notes,
        status: session.user.role === 'ADMIN' ? 'APROVADA' : 'PENDENTE',
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
    return NextResponse.json(
      { error: 'Erro ao criar reserva' },
      { status: 500 }
    );
  }
}