import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar usuários (apenas admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem listar usuários' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, cpf, name, role, department } = body;

    // Validar email
    const emailLower = email.toLowerCase();
    const isAluno = emailLower.endsWith('@aluno.fmpsc.edu.br');
    const isProfessor = emailLower.endsWith('@fmpsc.edu.br') && !isAluno;

    if (!isAluno && !isProfessor && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Email deve ser institucional' },
        { status: 400 }
      );
    }

    // Verificar se já existe
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { cpf },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Usuário já existe (email ou CPF duplicado)' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        cpf,
        name,
        role,
        department,
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
