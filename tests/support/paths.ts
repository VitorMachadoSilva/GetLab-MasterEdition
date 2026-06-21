export const appPaths = {
  login: '/login',
  dashboard: '/dashboard',
  display: '/display',
  admin: {
    reservas: '/admin',
    salas: '/admin/salas',
    usuarios: '/admin/usuarios',
  },
  professor: {
    novaReserva: '/professor/nova-reserva',
    minhasReservas: '/professor/minhas-reservas',
  },
  perfil: '/perfil',
} as const;
