/**
 * Auth.js (next-auth v5) — login con Google para la vista cliente /5gatos.
 *
 * Allowlist: solo los correos de AUTH_ALLOWED_EMAILS (CSV) pueden entrar.
 * Env necesarias: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
 * AUTH_ALLOWED_EMAILS. Ver docs/LOGIN_SETUP.md.
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/** Correos permitidos (CSV en env, case-insensitive). */
export function allowedEmails(): string[] {
  return (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowedEmails().includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login-denegado",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    // Primera barrera: si el correo no está en la allowlist, ni siquiera
    // se crea la sesión.
    signIn({ user }) {
      return isEmailAllowed(user.email) ? true : "/login-denegado";
    },
  },
});
