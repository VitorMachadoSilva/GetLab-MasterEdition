import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha (CPF)', type: 'password' },
      },

      async authorize(
        credentials
      ): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        department?: string;
      } | null> {

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const email = credentials.email.toLowerCase();
        const cpf = credentials.password;
        const demoEmail = process.env.DEMO_EMAIL?.toLowerCase();
        const demoPassword = process.env.DEMO_PASSWORD;

        // ================= ADMIN =================
        if (
          email === process.env.ADMIN_EMAIL &&
          cpf === process.env.ADMIN_PASSWORD
        ) {
          let admin = await prisma.user.findUnique({
            where: { email },
          });

          if (!admin) {
            admin = await prisma.user.create({
              data: {
                email,
                cpf: 'ADMIN',
                name: 'Administrador',
                role: UserRole.ADMIN,
              },
            });
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            department: undefined, // 🔥 sempre definir
          };
        }

        // ================= DEMO =================
        if (demoEmail && demoPassword && email === demoEmail && cpf === demoPassword) {
          let demoUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!demoUser) {
            demoUser = await prisma.user.create({
              data: {
                email,
                cpf: 'DEMO',
                name: 'Usuário Demo',
                role: UserRole.DEMO,
                department: 'Demonstração',
              },
            });
          }

          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role,
            department: demoUser.department ?? undefined,
          };
        }

        // ============== VALIDA EMAIL ==============
        const isAluno = email.endsWith('@aluno.fmpsc.edu.br');
        const isProfessor =
          email.endsWith('@fmpsc.edu.br') && !isAluno;

        if (!isAluno && !isProfessor) {
          throw new Error(
            'Email deve ser institucional (@aluno.fmpsc.edu.br ou @fmpsc.edu.br)'
          );
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new Error(
            'Usuário não encontrado. Entre em contato com a administração.'
          );
        }

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
          department: user.department ?? undefined, // 🔥 normalização definitiva
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const sessionId = randomUUID();
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { activeSessionId: true },
        });
        const hadPreviousSession = Boolean(
          currentUser?.activeSessionId && currentUser.activeSessionId !== sessionId
        );

        await prisma.user.update({
          where: { id: user.id },
          data: {
            activeSessionId: sessionId,
            activeSessionAt: new Date(),
          },
        });

        token.id = user.id;
        token.role = user.role;
        token.department = user.department ?? undefined;
        token.sessionId = sessionId;
        token.sessionError = undefined;
        token.sessionNotice = hadPreviousSession ? 'PREVIOUS_SESSION_CLOSED' : undefined;
      } else if (token.id && token.sessionId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { activeSessionId: true },
        });

        token.sessionError =
          !currentUser || (currentUser.activeSessionId && currentUser.activeSessionId !== token.sessionId)
            ? 'SESSION_REPLACED'
            : undefined;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.department =
          (token.department as string | undefined) ?? undefined;
      }
      session.sessionId = token.sessionId;
      session.sessionError = token.sessionError;
      session.sessionNotice = token.sessionNotice;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  events: {
    async signOut({ token }) {
      if (!token?.id || !token?.sessionId) return;

      await prisma.user.updateMany({
        where: {
          id: token.id,
          activeSessionId: token.sessionId,
        },
        data: {
          activeSessionId: null,
          activeSessionAt: null,
        },
      });
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
