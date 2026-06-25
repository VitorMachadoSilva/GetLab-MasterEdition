import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { targetUserIds: { isEmpty: true } },
              { targetUserIds: { has: session.user.id } },
            ],
          },
          {
            NOT: {
              deletedBy: {
                has: session.user.id,
              },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json(
      notifications.map((notification) => ({
        ...notification,
        read: notification.readBy.includes(session.user.id),
      }))
    );
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return apiError('Erro ao buscar notificações', { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    const unread = await prisma.notification.findMany({
      where: {
        AND: [
          {
            OR: [
              { targetUserIds: { isEmpty: true } },
              { targetUserIds: { has: session.user.id } },
            ],
          },
          {
            NOT: {
              readBy: {
                has: session.user.id,
              },
            },
          },
          {
            NOT: {
              deletedBy: {
                has: session.user.id,
              },
            },
          },
        ],
      },
      select: { id: true, readBy: true },
    });

    await Promise.all(
      unread.map((notification) =>
        prisma.notification.update({
          where: { id: notification.id },
          data: {
            readBy: {
              set: [...notification.readBy, session.user.id],
            },
          },
        })
      )
    );

    return NextResponse.json({ message: 'Notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error);
    return apiError('Erro ao atualizar notificações', { status: 500 });
  }
}
