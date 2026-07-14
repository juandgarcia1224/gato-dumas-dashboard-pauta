/**
 * Middleware de protección de la vista cliente 5 Gatos.
 * Protege /5gatos y /api/5gatos/*:
 *   - sin sesión           → /login (o 401 JSON en APIs)
 *   - sesión no permitida  → /login-denegado (o 403 JSON en APIs)
 *
 * La ruta interna "/" (vista Cloud Design) y /api/cron/* NO pasan por aquí:
 * el matcher solo cubre lo de 5 Gatos.
 */

import { NextResponse } from "next/server";
import { auth, isEmailAllowed } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isApi = nextUrl.pathname.startsWith("/api/");
  const email = req.auth?.user?.email;

  if (!req.auth) {
    if (isApi) {
      return NextResponse.json(
        { error: "Sesión requerida. Inicia sesión en /login." },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (!isEmailAllowed(email)) {
    if (isApi) {
      return NextResponse.json(
        { error: "Tu cuenta no tiene acceso. Solicita acceso a Juan (juandgarcia1224@gmail.com)." },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/login-denegado", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/5gatos/:path*", "/api/5gatos/:path*"],
};
