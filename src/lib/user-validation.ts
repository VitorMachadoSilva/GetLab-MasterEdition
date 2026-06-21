import { UserRole } from '@prisma/client';
import { cleanString } from '@/lib/api-validation';

const validUserRoles = ['ALUNO', 'PROFESSOR', 'ADMIN'] as const;

export function normalizeEmail(value: unknown) {
  return cleanString(value).toLowerCase();
}

export function normalizeCpf(value: unknown) {
  return cleanString(value).replace(/[.\-\s]/g, '');
}

export function parseUserRole(value: unknown) {
  const role = cleanString(value);
  return validUserRoles.includes(role as UserRole) ? (role as UserRole) : null;
}

export function validateName(value: unknown) {
  const name = cleanString(value);

  if (!name) {
    return { ok: false as const, error: 'Nome é obrigatório' };
  }

  if (name.length > 100) {
    return { ok: false as const, error: 'Nome deve ter no máximo 100 caracteres' };
  }

  return { ok: true as const, value: name };
}

export function validateDepartment(value: unknown) {
  const department = cleanString(value);

  if (department.length > 80) {
    return { ok: false as const, error: 'Departamento deve ter no máximo 80 caracteres' };
  }

  return { ok: true as const, value: department || null };
}

export function validateCpf(value: unknown) {
  const cpf = normalizeCpf(value);

  if (!/^\d{11}$/.test(cpf)) {
    return { ok: false as const, error: 'CPF deve ter 11 números' };
  }

  return { ok: true as const, value: cpf };
}

export function validateEmailForRole(email: string, role: UserRole) {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isAluno = email.endsWith('@aluno.fmpsc.edu.br');
  const isProfessor = email.endsWith('@fmpsc.edu.br') && !isAluno;

  if (!isEmail) {
    return 'Email inválido';
  }

  if (role === 'ALUNO' && !isAluno) {
    return 'Alunos devem usar email @aluno.fmpsc.edu.br';
  }

  if (role === 'PROFESSOR' && !isProfessor) {
    return 'Professores devem usar email @fmpsc.edu.br';
  }

  return null;
}

