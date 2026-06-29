import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { readJsonObject } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';
import { parseRoomPayload } from '@/lib/room-validation';
import { demoWriteBlocked, isDemoRole } from '@/lib/demo-access';
import { createNotification } from '@/lib/notifications';

// GET - Listar salas
export async function GET(request: NextRequest) {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Erro ao buscar salas:', error);
    return apiError('Erro ao buscar salas', { status: 500 });
  }
}

// POST - Criar nova sala (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (isDemoRole(session?.user?.role)) {
      return demoWriteBlocked();
    }

    if (!session?.user || session.user.role !== 'ADMIN') {
      return apiError('Apenas administradores podem criar salas', { status: 403 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const parsedRoom = parseRoomPayload(parsedBody.data);

    if (!parsedRoom.ok) {
      return apiError(parsedRoom.error, { status: 400 });
    }

    const room = await prisma.room.create({
      data: parsedRoom.data,
    });

    await createNotification({
      title: 'Nova sala cadastrada',
      message: `${session.user.name} cadastrou a sala ${room.name}.`,
      type: 'ROOM',
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    return apiError('Erro ao criar sala', { status: 500 });
  }
}
