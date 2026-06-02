import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      webauthnEnabled: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    webauthnEnabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    webauthnEnabled: boolean;
  }
}
