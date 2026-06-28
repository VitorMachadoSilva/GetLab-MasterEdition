import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

const defaultPageSize = 20;
const maxPageSize = 50;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paginated = searchParams.get('paginated') === 'true';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), defaultPageSize), maxPageSize);
    const where = {
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
    };
    const unreadWhere = {
      AND: [
        ...where.AND,
        {
          NOT: {
            readBy: {
              has: session.user.id,
            },
          },
        },
      ],
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: unreadWhere }),
    ]);

    const data = notifications.map((notification) => ({
      ...notification,
      read: notification.readBy.includes(session.user.id),
    }));

    if (paginated) {
      return NextResponse.json({
        data,
        total,
        unreadCount,
        page,
        limit,
        pageCount: Math.max(1, Math.ceil(total / limit)),
      });
    }

    return NextResponse.json(data);
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

    const unreadWhere = {
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
    };

    await prisma.notification.updateMany({
      ...unreadWhere,
      data: {
        readBy: {
          push: session.user.id,
        },
      },
    });

    return NextResponse.json({ message: 'Notificações marcadas como lidas' });
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error);
    return apiError('Erro ao atualizar notificações', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    await prisma.notification.updateMany({
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
      data: {
        deletedBy: {
          push: session.user.id,
        },
      },
    });

    return NextResponse.json({ message: 'Notificações removidas' });
  } catch (error) {
    console.error('Erro ao remover notificações:', error);
    return apiError('Erro ao remover notificações', { status: 500 });
  }
}
