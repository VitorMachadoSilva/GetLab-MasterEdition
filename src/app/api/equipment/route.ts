import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { cleanString, readJsonObject } from '@/lib/api-validation';
import { demoWriteBlocked, isDemoRole } from '@/lib/demo-access';
import { createNotification } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';

const defaultEquipment = [
  'Computador',
  'Projetor',
  'Quadro branco',
  'Ar condicionado',
  'Microfone',
  'Som',
  'TV',
  'Internet',
  'Lousa digital',
  'Palco',
];

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

export async function GET() {
  try {
    const count = await prisma.equipment.count();

    if (count === 0) {
      await prisma.equipment.createMany({
        data: defaultEquipment.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    const equipment = await prisma.equipment.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    return apiError('Erro ao buscar equipamentos', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (isDemoRole(session?.user?.role)) {
      return demoWriteBlocked();
    }

    if (!session?.user || session.user.role !== 'ADMIN') {
      return apiError('Apenas administradores podem criar equipamentos', { status: 403 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const parsedName = parseEquipmentName(parsedBody.data.name);

    if (!parsedName.ok) {
      return apiError(parsedName.error, { status: 400 });
    }

    const existing = await prisma.equipment.findUnique({
      where: { name: parsedName.value },
    });

    if (existing) {
      return apiError('Este equipamento já existe', { status: 409 });
    }

    const equipment = await prisma.equipment.create({
      data: { name: parsedName.value },
    });

    await createNotification({
      title: 'Novo equipamento cadastrado',
      message: `${session.user.name} adicionou "${equipment.name}" ao catálogo de equipamentos.`,
      type: 'ROOM',
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    return apiError('Erro ao criar equipamento', { status: 500 });
  }
}
