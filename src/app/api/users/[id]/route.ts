import { NextRequest, NextResponse } from 'next/server';
import { getActiveServerSession } from '@/lib/session';
import { apiError } from '@/lib/api-response';
import { isValidCuid, readJsonObject } from '@/lib/api-validation';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();
    
    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Usuário inválido', { status: 400 });
    }

    if (!canReadAdminViews(session.user.role) && session.user.id !== params.id) {
      return apiError('Sem permissão', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
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

    if (!user) {
      return apiError('Usuário não encontrado', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return apiError('Erro ao buscar usuário', { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getActiveServerSession();
    
    if (!session?.user) {
      return apiError('Não autenticado', { status: 401 });
    }

    if (isDemoRole(session.user.role)) {
      return demoWriteBlocked();
    }

    if (!isValidCuid(params.id)) {
      return apiError('Usuário inválido', { status: 400 });
    }

    // Apenas admin pode editar outros usuários
    if (session.user.role !== 'ADMIN' && session.user.id !== params.id) {
      return apiError('Sem permissão', { status: 403 });
    }

    const parsedBody = await readJsonObject(request);

    if (!parsedBody.ok) {
      return apiError(parsedBody.error, { status: 400 });
    }

    const body = parsedBody.data;
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        cpf: true,
        role: true,
      },
    });

    if (!currentUser) {
      return apiError('Usuário não encontrado', { status: 404 });
    }

    const updateData: any = {};

    if (body.name !== undefined) {
      const name = validateName(body.name);

      if (!name.ok) {
        return apiError(name.error, { status: 400 });
      }

      updateData.name = name.value;
    }

    if (body.department !== undefined) {
      const department = validateDepartment(body.department);

      if (!department.ok) {
        return apiError(department.error, { status: 400 });
      }

      updateData.department = department.value;
    }
    
    // Admin pode alterar role, email e cpf
    if (session.user.role === 'ADMIN') {
      const nextRole = body.role !== undefined ? parseUserRole(body.role) : currentUser.role;

      if (!nextRole) {
        return apiError('Tipo de usuário inválido', { status: 400 });
      }

      const nextEmail = body.email !== undefined ? normalizeEmail(body.email) : currentUser.email;
      const emailError = validateEmailForRole(nextEmail, nextRole);

      if (emailError) {
        return apiError(emailError, { status: 400 });
      }

      if (body.role !== undefined) updateData.role = nextRole;
      if (body.email !== undefined) updateData.email = nextEmail;

      if (body.cpf !== undefined) {
        const cpf = validateCpf(body.cpf);

        if (!cpf.ok) {
          return apiError(cpf.error, { status: 400 });
        }

        updateData.cpf = cpf.value;
      }

      const duplicateFilters = [];

      if (updateData.email) duplicateFilters.push({ email: updateData.email });
      if (updateData.cpf) duplicateFilters.push({ cpf: updateData.cpf });

      if (duplicateFilters.length > 0) {
        const duplicate = await prisma.user.findFirst({
          where: {
            id: { not: params.id },
            OR: duplicateFilters,
          },
        });

        if (duplicate) {
          return apiError('Usuário já existe (email ou CPF duplicado)', { status: 409 });
        }
      }
    } else if (body.role !== undefined || body.email !== undefined || body.cpf !== undefined) {
      return apiError('Sem permissão para alterar email, CPF ou tipo de usuário', { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        cpf: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return apiError('Erro ao atualizar usuário', { status: 500 });
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
      return apiError('Apenas administradores podem excluir usuários', { status: 403 });
    }

    if (!isValidCuid(params.id)) {
      return apiError('Usuário inválido', { status: 400 });
    }

    // Não pode excluir a si mesmo
    if (session.user.id === params.id) {
      return apiError('Você não pode excluir seu próprio usuário', { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!targetUser) {
      return apiError('Usuário não encontrado', { status: 404 });
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return apiError('Erro ao excluir usuário', { status: 500 });
  }
}
