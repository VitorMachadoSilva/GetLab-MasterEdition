export const testRooms = {
  availableLab: {
    name: 'Laboratorio Teste 01',
    type: 'LABORATORIO',
    capacity: 30,
    building: 'Bloco Teste',
    floor: '1',
    equipment: ['Projetor', 'Quadro', 'Computadores'],
  },
  smallRoom: {
    name: 'Sala Pequena Teste',
    type: 'SALA_AULA',
    capacity: 10,
    building: 'Bloco Teste',
    floor: '2',
    equipment: ['Quadro'],
  },
} as const;

export const testBookings = {
  validCourse: 'Validacao automatizada',
  conflictCourse: 'Validacao automatizada conflito',
  students: 20,
  oversizedStudents: 99,
  startTime: '08:00',
  endTime: '10:00',
  rejectionReason: 'Reserva rejeitada por teste automatizado.',
} as const;
