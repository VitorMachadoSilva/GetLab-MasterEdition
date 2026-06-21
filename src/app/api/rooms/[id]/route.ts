import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH - Atualizar sala
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem editar salas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, type, capacity, building, floor, equipment } = body;

    const room = await prisma.room.update({
      where: { id: params.id },
      data: {
        name,
        type,
        capacity: parseInt(capacity),
        building: building?.trim() || 'Não informado',
        floor: floor ? parseInt(floor) : null,
        equipment: equipment || [],
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar sala' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir sala
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir salas' },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: `Não é possível excluir. Existem ${bookingsCount} reserva(s) ativa(s) para esta sala.` },
        { status: 400 }
      );
    }

    await prisma.room.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Sala excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir sala:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir sala' },
      { status: 500 }
    );
  }
}
