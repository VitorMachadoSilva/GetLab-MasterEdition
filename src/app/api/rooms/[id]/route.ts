import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { isValidCuid, readJsonObject } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';
import { parseRoomPayload } from '@/lib/room-validation';
import { demoWriteBlocked, isDemoRole } from '@/lib/demo-access';

// PATCH - Atualizar sala
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();

    if (isDemoRole(session?.user?.role)) {
      return demoWriteBlocked();
    }

    if (!session?.user || session.user.role !== 'ADMIN') {
      return apiError('Apenas administradores podem editar salas', { status: 403 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Sala inválida', { status: 400 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const parsedRoom = parseRoomPayload(parsedBody.data);

    if (!parsedRoom.ok) {
      return apiError(parsedRoom.error, { status: 400 });
    }

    const room = await prisma.room.update({
      where: { id: params.id },
      data: parsedRoom.data,
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    return apiError('Erro ao atualizar sala', { status: 500 });
  }
}

// DELETE - Excluir sala
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();

    if (isDemoRole(session?.user?.role)) {
      return demoWriteBlocked();
    }

    if (!session?.user || session.user.role !== 'ADMIN') {
      return apiError('Apenas administradores podem excluir salas', { status: 403 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Sala inválida', { status: 400 });
    }

    // Verificar se existem reservas para esta sala
    const bookingsCount = await prisma.booking.count({
      where: {
        roomId: params.id,
        status: {
          in: ['PENDENTE', 'APROVADA'],
        },
      },
    });

    if (bookingsCount > 0) {
      return apiError(
        `Não é possível excluir. Existem ${bookingsCount} reserva(s) ativa(s) para esta sala.`,
        { status: 400 }
      );
    }

    await prisma.room.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Sala excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir sala:', error);
    return apiError('Erro ao excluir sala', { status: 500 });
  }
}
