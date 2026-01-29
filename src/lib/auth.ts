import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

type Role = "EMPLOYEE" | "ADMIN";

declare module "next-auth" {
    interface User {
        id: string;
        email: string;
        name: string | null;
        roles: Role[];
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name: string | null;
            roles: Role[];
        };
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string;
        email: string;
        name: string | null;
        roles: Role[];
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                fmno: { label: "FMNO", type: "text" },
                loginType: { label: "Login Type", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.fmno) {
                    throw new Error("Email and FMNO are required");
                }

                const email = credentials.email as string;
                const fmno = credentials.fmno as string;
                const loginType = (credentials.loginType as string) || "employee";

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    throw new Error("Invalid email or FMNO");
                }

                // Compare FMNO directly (no hashing, plaintext comparison)
                if (user.fmno !== fmno) {
                    throw new Error("Invalid email or FMNO");
                }

                if (loginType === "admin" && !user.roles.includes("ADMIN")) {
                    throw new Error("Access denied: Admin role required");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roles: user.roles,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.email = user.email as string;
                token.name = user.name as string | null;
                token.roles = user.roles as Role[];
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...session.user,
                id: token.id as string,
                email: token.email as string,
                name: token.name as string | null,
                roles: token.roles as Role[],
            };
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    trustHost: true,
});
