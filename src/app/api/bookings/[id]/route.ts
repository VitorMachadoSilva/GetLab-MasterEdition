import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const validStatuses = ['PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA'] as const;

function getDateRange(date: Date) {
  return {
    startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
  };
}

function appendNote(currentNote: string | null, label: string, reason: string) {
  const cleanReason = reason.trim();
  const entry = `${label}: ${cleanReason}`;
  return currentNote ? `${currentNote}\n\n${entry}` : entry;
}

// PATCH - Atualizar status da reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { status, reason } = body;

    // Apenas admins podem aprovar/rejeitar
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem aprovar/rejeitar reservas' },
        { status: 403 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const currentBooking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    if (
      (status === 'APROVADA' || status === 'REJEITADA') &&
      currentBooking.status !== 'PENDENTE'
    ) {
      return NextResponse.json(
        { error: 'Apenas reservas pendentes podem ser aprovadas ou rejeitadas' },
        { status: 400 }
      );
    }

    const reasonText = typeof reason === 'string' ? reason.trim() : '';

    if (status === 'REJEITADA' && !reasonText) {
      return NextResponse.json(
        { error: 'Informe o motivo da rejeição' },
        { status: 400 }
      );
    }

    if (status === 'APROVADA') {
      const { startDate, endDate } = getDateRange(currentBooking.date);
      const approvedConflict = await prisma.booking.findFirst({
        where: {
          id: { not: params.id },
          roomId: currentBooking.roomId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'APROVADA',
          startTime: { lt: currentBooking.endTime },
          endTime: { gt: currentBooking.startTime },
        },
      });

      if (approvedConflict) {
        return NextResponse.json(
          { error: 'Já existe uma reserva aprovada nesse horário' },
          { status: 409 }
        );
      }
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        notes: status === 'REJEITADA'
          ? appendNote(currentBooking.notes, 'Motivo da rejeicao', reasonText)
          : currentBooking.notes,
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

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar reserva' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir ou cancelar reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar a reserva
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Apenas o professor dono ou admin pode excluir/cancelar
    if (
      session.user.role !== 'ADMIN' &&
      booking.professorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir esta reserva' },
        { status: 403 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      if (booking.status !== 'PENDENTE') {
        return NextResponse.json(
          { error: 'Apenas reservas pendentes podem ser canceladas pelo professor' },
          { status: 400 }
        );
      }

      let body: any = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const reasonText = typeof body.reason === 'string' ? body.reason.trim() : '';

      if (!reasonText) {
        return NextResponse.json(
          { error: 'Informe o motivo do cancelamento' },
          { status: 400 }
        );
      }

      const canceledBooking = await prisma.booking.update({
        where: { id: params.id },
        data: {
          status: 'CANCELADA',
          notes: appendNote(booking.notes, 'Motivo do cancelamento', reasonText),
        },
      });

      return NextResponse.json(canceledBooking);
    }

    await prisma.booking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Reserva excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir reserva:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir reserva' },
      { status: 500 }
    );
  }
}
