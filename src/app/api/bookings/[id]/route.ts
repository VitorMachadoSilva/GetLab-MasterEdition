import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH - Atualizar status da reserva
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Apenas admins podem aprovar/rejeitar
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem aprovar/rejeitar reservas' },
        { status: 403 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
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

// DELETE - Excluir reserva
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
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

    // Apenas o professor dono ou admin pode excluir
    if (
      session.user.role !== 'ADMIN' &&
      booking.professorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir esta reserva' },
        { status: 403 }
      );
    }

    // ✅ Verificar se a reserva já foi finalizada
    // Usar toISOString().split('T')[0] para evitar problemas de timezone UTC vs local
    const isoDate = booking.date.toISOString().split('T')[0]; // "2026-02-20"
    const [year, month, day] = isoDate.split('-').map(Number);
    const [hours, minutes] = booking.endTime.split(':').map(Number);

    const bookingEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);

    if (new Date() > bookingEnd) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma reserva já finalizada' },
        { status: 400 }
      );
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