import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renomeou Middleware para Proxy (mesma funcionalidade, nome novo
// pra não confundir com middleware do Express). O arquivo precisa se chamar
// proxy.ts (não middleware.ts) e a função exportada precisa se chamar
// exatamente "proxy" — se os dois existirem juntos, o comportamento fica
// indefinido. O `matcher` abaixo continua igual ao formato anterior.
export function proxy(request: NextRequest) {
  const session = request.cookies.get("session_token");
  const { pathname } = request.nextUrl;

  // Sem sessão fora do /login -> força login
  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Com sessão tentando acessar /login -> já autenticado, manda pro dashboard
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Rotas que passam pelo proxy antes de chegar na página. Fora daqui, o
// request segue direto (evita rodar isso em assets/_next/api sem necessidade)
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/requisicao/:path*",
    "/historico/:path*",
    "/login",
  ],
};
