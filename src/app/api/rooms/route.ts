import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    return NextResponse.json(
      { error: 'Erro ao buscar salas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova sala (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar salas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, type, capacity, building, floor, equipment } = body;

    const room = await prisma.room.create({
      data: {
        name,
        type,
        capacity: parseInt(capacity),
        building,
        floor: floor ? parseInt(floor) : null,
        equipment: equipment || [],
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sala' },
      { status: 500 }
    );
  }
}
