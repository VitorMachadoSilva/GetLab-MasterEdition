import { DefaultSession } from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    department?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      department?: string;
    } & DefaultSession["user"];
    sessionId?: string;
    sessionError?: "SESSION_REPLACED";
    sessionNotice?: "PREVIOUS_SESSION_CLOSED";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    department?: string;
    sessionId?: string;
    sessionError?: "SESSION_REPLACED";
    sessionNotice?: "PREVIOUS_SESSION_CLOSED";
  }
}
