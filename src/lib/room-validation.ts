import { RoomType } from '@prisma/client';
import { cleanString } from '@/lib/api-validation';

const validRoomTypes = ['LABORATORIO', 'SALA_AULA', 'AUDITORIO'] as const;

export function parseRoomPayload(body: Record<string, unknown>) {
  const name = cleanString(body.name);
  const type = cleanString(body.type);
  const building = cleanString(body.building) || 'Não informado';
  const capacityText = typeof body.capacity === 'number'
    ? String(body.capacity)
    : cleanString(body.capacity);
  const capacity = capacityText === '' ? null : Number(body.capacity);
  const floorInput = body.floor;
  const floorText = cleanString(floorInput);
  const floor = floorInput === null || floorInput === undefined || floorText === ''
    ? null
    : Number(floorInput);

  if (!name) {
    return { ok: false as const, error: 'Nome da sala é obrigatório' };
  }

  if (name.length > 80) {
    return { ok: false as const, error: 'Nome da sala deve ter no máximo 80 caracteres' };
  }

  if (!validRoomTypes.includes(type as RoomType)) {
    return { ok: false as const, error: 'Tipo de sala inválido' };
  }

  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 500)) {
    return { ok: false as const, error: 'Capacidade deve ser um número entre 1 e 500' };
  }

  if (building.length > 80) {
    return { ok: false as const, error: 'Prédio deve ter no máximo 80 caracteres' };
  }

  if (floor !== null && (!Number.isInteger(floor) || floor < 0 || floor > 100)) {
    return { ok: false as const, error: 'Andar deve ser um número entre 0 e 100' };
  }

  if (!Array.isArray(body.equipment)) {
    return { ok: false as const, error: 'Equipamentos devem ser uma lista' };
  }

  const equipment = Array.from(
    new Set(
      body.equipment
        .map((item) => cleanString(item))
        .filter(Boolean)
    )
  );

  if (equipment.length > 20) {
    return { ok: false as const, error: 'Selecione no máximo 20 equipamentos' };
  }

  if (equipment.some((item) => item.length > 40)) {
    return { ok: false as const, error: 'Cada equipamento deve ter no máximo 40 caracteres' };
  }

  return {
    ok: true as const,
    data: {
      name,
      type: type as RoomType,
      capacity,
      building,
      floor,
      equipment,
    },
  };
}

