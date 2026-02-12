import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha (CPF)', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const email = credentials.email.toLowerCase();
        const cpf = credentials.password;

        // Verificar se é login de ADMIN
        if (
          email === process.env.ADMIN_EMAIL &&
          cpf === process.env.ADMIN_PASSWORD
        ) {
          // Buscar ou criar admin
          let admin = await prisma.user.findUnique({
            where: { email },
          });

          if (!admin) {
            admin = await prisma.user.create({
              data: {
                email,
                cpf: 'ADMIN',
                name: 'Administrador',
                role: 'ADMIN',
              },
            });
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          };
        }

        // Validar formato de email institucional
        const isAluno = email.endsWith('@aluno.fmpsc.edu.br');
        const isProfessor = email.endsWith('@fmpsc.edu.br') && !isAluno;

        if (!isAluno && !isProfessor) {
          throw new Error('Email deve ser institucional (@aluno.fmpsc.edu.br ou @fmpsc.edu.br)');
        }

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error('Usuário não encontrado. Entre em contato com a administração.');
        }

        // Verificar CPF (senha)
        // Remove pontos, traços e espaços do CPF
        const cpfLimpo = cpf.replace(/[.\-\s]/g, '');
        const cpfBancoLimpo = user.cpf.replace(/[.\-\s]/g, '');

        if (cpfLimpo !== cpfBancoLimpo) {
          throw new Error('CPF incorreto');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
};
