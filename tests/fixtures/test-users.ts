export const testUsers = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@fmpsc.edu.br',
    password: process.env.E2E_ADMIN_PASSWORD || 'ADMIN',
    role: 'ADMIN',
  },
  professor: {
    email: process.env.E2E_PROFESSOR_EMAIL || 'professor.teste@fmpsc.edu.br',
    password: process.env.E2E_PROFESSOR_PASSWORD || '12345678900',
    role: 'PROFESSOR',
  },
  professor2: {
    email: process.env.E2E_PROFESSOR_2_EMAIL || 'professor2.teste@fmpsc.edu.br',
    password: process.env.E2E_PROFESSOR_2_PASSWORD || '12345678901',
    role: 'PROFESSOR',
  },
  student: {
    email: process.env.E2E_STUDENT_EMAIL || 'aluno.teste@aluno.fmpsc.edu.br',
    password: process.env.E2E_STUDENT_PASSWORD || '12345678902',
    role: 'ALUNO',
  },
} as const;

export type TestUser = (typeof testUsers)[keyof typeof testUsers];
