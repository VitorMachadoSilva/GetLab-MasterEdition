import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { isValidCuid } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();

    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Notificação inválida', { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        targetUserIds: true,
        deletedBy: true,
      },
    });

    if (!notification) {
      return apiError('Notificação não encontrada', { status: 404 });
    }

    const canSeeNotification =
      notification.targetUserIds.length === 0 ||
      notification.targetUserIds.includes(session.user.id);

    if (!canSeeNotification) {
      return apiError('Sem permissão para remover esta notificação', { status: 403 });
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: {
        deletedBy: {
          set: Array.from(new Set([...notification.deletedBy, session.user.id])),
        },
      },
    });

    return NextResponse.json({ message: 'Notificação removida' });
  } catch (error) {
    console.error('Erro ao remover notificação:', error);
    return apiError('Erro ao remover notificação', { status: 500 });
  }
}
