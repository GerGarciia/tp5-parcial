import { NextResponse, type NextRequest } from "next/server";
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from "./lib/sesion";

export async function proxy(pedido: NextRequest) {
  const { pathname } = pedido.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = pedido.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const idUsuario = token ? await verificarTokenSesion(token) : null;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!idUsuario) {
    const urlLogin = new URL("/login", pedido.url);
    return NextResponse.redirect(urlLogin);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
