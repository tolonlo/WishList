import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/** Protege todas las páginas y APIs salvo el login. Los handlers vuelven a verificar la sesión (defensa en profundidad). */
const PUBLICAS = new Set(["/login", "/api/auth/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }
  const usuario = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (PUBLICAS.has(pathname)) {
    if (usuario && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!usuario) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads/|favicon.ico|icon.svg|robots.txt).*)"],
};
