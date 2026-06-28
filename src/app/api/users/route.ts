import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { readJsonObject } from '@/lib/api-validation';
import { prisma } from '@/lib/prisma';
import {
  normalizeEmail,
  parseUserRole,
  validateCpf,
  validateDepartment,
  validateEmailForRole,
  validateName,
} from '@/lib/user-validation';
import { canReadAdminViews, demoWriteBlocked, isDemoRole } from '@/lib/demo-access';
import { createNotification } from '@/lib/notifications';

const defaultPageSize = 10;
const maxPageSize = 100;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// GET - Listar usuários (apenas admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getActiveServerSession();
    
    if (!session?.user || !canReadAdminViews(session.user.role)) {
      return apiError('Apenas administradores podem listar usuários', { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search')?.trim();
    const department = searchParams.get('department')?.trim();
    const paginated = searchParams.get('paginated') === 'true';
    const summaryOnly = searchParams.get('summaryOnly') === 'true';
    const includeSummary = searchParams.get('includeSummary') !== 'false' || summaryOnly;
    const includeDepartments = searchParams.get('includeDepartments') !== 'false';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), defaultPageSize), maxPageSize);

    const where: any = {};
    if (role) {
      const parsedRole = parseUserRole(role);

      if (!parsedRole) {
        return apiError('Tipo de usuário inválido', { status: 400 });
      }

      where.role = parsedRole;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.department = department;
    }

    const select = {
      id: true,
      email: true,
      cpf: true,
      name: true,
      role: true,
      department: true,
      createdAt: true,
      _count: {
        select: {
          bookingsCreated: true,
        },
      },
    };

    if (paginated || summaryOnly) {
      const [users, total, roleCounts, departments] = await Promise.all([
        summaryOnly
          ? Promise.resolve([])
          : prisma.user.findMany({
              where,
              select,
              orderBy: {
                createdAt: 'desc',
              },
              skip: (page - 1) * limit,
              take: limit,
            }),
        prisma.user.count({ where }),
        includeSummary
          ? prisma.user.groupBy({
              by: ['role'],
              _count: {
                _all: true,
              },
            })
          : Promise.resolve([]),
        includeDepartments
          ? prisma.user.findMany({
              where: {
                ...(role ? { role: where.role } : {}),
                department: {
                  not: null,
                },
              },
              select: {
                department: true,
              },
              distinct: ['department'],
              orderBy: {
                department: 'asc',
              },
            })
          : Promise.resolve([]),
      ]);

      return NextResponse.json({
        data: users,
        total,
        page,
        limit,
        pageCount: Math.max(1, Math.ceil(total / limit)),
        ...(includeSummary
          ? {
              summary: {
                total: roleCounts.reduce((sum, item) => sum + item._count._all, 0),
                byRole: roleCounts.reduce<Record<string, number>>((acc, item) => {
                  acc[item.role] = item._count._all;
                  return acc;
                }, {}),
              },
            }
          : {}),
        departments: departments
          .map((item) => item.department)
          .filter((department): department is string => Boolean(department)),
      });
    }

    const users = await prisma.user.findMany({
      where,
      select,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return apiError('Erro ao buscar usuários', { status: 500 });
  }
}

// POST - Criar novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getActiveServerSession();

    if (isDemoRole(session?.user?.role)) {
      return demoWriteBlocked();
    }

    if (!session?.user || session.user.role !== 'ADMIN') {
      return apiError('Apenas administradores podem criar usuários', { status: 403 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const body = parsedBody.data;
    const emailLower = normalizeEmail(body.email);
    const role = parseUserRole(body.role);
    const name = validateName(body.name);
    const cpf = validateCpf(body.cpf);
    const department = validateDepartment(body.department);

    if (!role) {
      return apiError('Tipo de usuário inválido', { status: 400 });
    }

    if (!name.ok) {
      return apiError(name.error, { status: 400 });
    }

    if (!cpf.ok) {
      return apiError(cpf.error, { status: 400 });
    }

    if (!department.ok) {
      return apiError(department.error, { status: 400 });
    }

    if (role === 'ALUNO' && !department.value) {
      return apiError('Curso é obrigatório para alunos', { status: 400 });
    }

    const emailError = validateEmailForRole(emailLower, role);

    if (emailError) {
      return apiError(emailError, { status: 400 });
    }

    // Verificar se já existe
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { cpf: cpf.value },
        ],
      },
    });

    if (existing) {
      return apiError('Usuário já existe (email ou CPF duplicado)', { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        cpf: cpf.value,
        name: name.value,
        role,
        department: department.value,
      },
      select: {
        id: true,
        email: true,
        cpf: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    await createNotification({
      title: 'Novo usuário cadastrado',
      message: `${session.user.name} cadastrou ${user.name} como ${user.role}.`,
      type: 'USER',
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return apiError('Erro ao criar usuário', { status: 500 });
  }
}
