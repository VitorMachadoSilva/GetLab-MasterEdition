import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { cleanString, isValidCuid, readJsonObject } from '@/lib/api-validation';
import { demoWriteBlocked, isDemoRole } from '@/lib/demo-access';
import { createNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

function parseEquipmentName(value: unknown) {
  const name = cleanString(value);

  if (!name) {
    return { ok: false as const, error: 'Nome do equipamento é obrigatório' };
  }

  if (name.length > 40) {
    return { ok: false as const, error: 'Nome do equipamento deve ter no máximo 40 caracteres' };
  }

  return { ok: true as const, value: name };
}

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
      return apiError('Apenas administradores podem editar equipamentos', { status: 403 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Equipamento inválido', { status: 400 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const parsedName = parseEquipmentName(parsedBody.data.name);

    if (!parsedName.ok) {
      return apiError(parsedName.error, { status: 400 });
    }

    const current = await prisma.equipment.findUnique({
      where: { id: params.id },
    });

    if (!current) {
      return apiError('Equipamento não encontrado', { status: 404 });
    }

    const duplicate = await prisma.equipment.findFirst({
      where: {
        id: { not: params.id },
        name: parsedName.value,
      },
    });

    if (duplicate) {
      return apiError('Este equipamento já existe', { status: 409 });
    }

    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: { name: parsedName.value },
    });

    if (current.name !== equipment.name) {
      const rooms = await prisma.room.findMany({
        where: {
          equipment: {
            has: current.name,
          },
        },
        select: {
          id: true,
          equipment: true,
        },
      });

      await Promise.all(
        rooms.map((room) =>
          prisma.room.update({
            where: { id: room.id },
            data: {
              equipment: room.equipment.map((item) =>
                item === current.name ? equipment.name : item
              ),
            },
          })
        )
      );
    }

    await createNotification({
      title: 'Equipamento atualizado',
      message: `${session.user.name} atualizou "${current.name}" para "${equipment.name}".`,
      type: 'ROOM',
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    return apiError('Erro ao atualizar equipamento', { status: 500 });
  }
}

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
      return apiError('Apenas administradores podem excluir equipamentos', { status: 403 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Equipamento inválido', { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: params.id },
    });

    if (!equipment) {
      return apiError('Equipamento não encontrado', { status: 404 });
    }

    const roomsUsingEquipment = await prisma.room.count({
      where: {
        equipment: {
          has: equipment.name,
        },
      },
    });

    if (roomsUsingEquipment > 0) {
      return apiError(
        `Não é possível excluir. ${roomsUsingEquipment} sala(s) usam este equipamento.`,
        { status: 400 }
      );
    }

    await prisma.equipment.delete({
      where: { id: params.id },
    });

    await createNotification({
      title: 'Equipamento removido',
      message: `${session.user.name} removeu "${equipment.name}" do catálogo de equipamentos.`,
      type: 'ROOM',
    });

    return NextResponse.json({ message: 'Equipamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir equipamento:', error);
    return apiError('Erro ao excluir equipamento', { status: 500 });
  }
}
