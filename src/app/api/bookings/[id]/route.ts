import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { cleanString, isValidCuid, readJsonObject } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';
import { demoWriteBlocked, isDemoRole } from '@/lib/demo-access';

const validDecisionStatuses = ['APROVADA', 'REJEITADA'] as const;

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
      return apiError('Não autenticado', { status: 401 });
    }

    if (isDemoRole(session.user.role)) {
      return demoWriteBlocked();
    }

    if (!isValidCuid(params.id)) {
      return apiError('Reserva inválida', { status: 400 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const body = parsedBody.data;
    const { status, reason } = body;

    // Apenas admins podem aprovar/rejeitar
    if (session.user.role !== 'ADMIN') {
      return apiError('Apenas administradores podem aprovar/rejeitar reservas', { status: 403 });
    }

    if (!validDecisionStatuses.includes(status as any)) {
      return apiError('Status inválido', { status: 400 });
    }

    const nextStatus = status as (typeof validDecisionStatuses)[number];

    const currentBooking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!currentBooking) {
      return apiError('Reserva não encontrada', { status: 404 });
    }

    if (
      (nextStatus === 'APROVADA' || nextStatus === 'REJEITADA') &&
      currentBooking.status !== 'PENDENTE'
    ) {
      return apiError('Apenas reservas pendentes podem ser aprovadas ou rejeitadas', {
        status: 400,
      });
    }

    const reasonText = cleanString(reason);

    if (nextStatus === 'REJEITADA' && !reasonText) {
      return apiError('Informe o motivo da rejeição', { status: 400 });
    }

    if (reasonText.length > 500) {
      return apiError('Motivo deve ter no máximo 500 caracteres', { status: 400 });
    }

    if (nextStatus === 'APROVADA') {
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
        return apiError('Já existe uma reserva aprovada nesse horário', { status: 409 });
      }
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status: nextStatus,
        notes: nextStatus === 'REJEITADA'
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
    return apiError('Erro ao atualizar reserva', { status: 500 });
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
      return apiError('Não autenticado', { status: 401 });
    }

    if (isDemoRole(session.user.role)) {
      return demoWriteBlocked();
    }

    if (!isValidCuid(params.id)) {
      return apiError('Reserva inválida', { status: 400 });
    }

    // Buscar a reserva
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return apiError('Reserva não encontrada', { status: 404 });
    }

    // Apenas o professor dono ou admin pode excluir/cancelar
    if (
      session.user.role !== 'ADMIN' &&
      booking.professorId !== session.user.id
    ) {
      return apiError('Sem permissão para excluir esta reserva', { status: 403 });
    }

    if (session.user.role !== 'ADMIN') {
      if (booking.status !== 'PENDENTE') {
        return apiError('Apenas reservas pendentes podem ser canceladas pelo professor', {
          status: 400,
        });
      }

      const parsedBody = await readJsonObject(request);
      const body = parsedBody.ok ? parsedBody.data : {};

      const reasonText = cleanString(body.reason);

      if (!reasonText) {
        return apiError('Informe o motivo do cancelamento', { status: 400 });
      }

      if (reasonText.length > 500) {
        return apiError('Motivo deve ter no máximo 500 caracteres', { status: 400 });
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
    return apiError('Erro ao excluir reserva', { status: 500 });
  }
}
