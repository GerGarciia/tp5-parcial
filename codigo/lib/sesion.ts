import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { buscarUsuarioDeSesion } from "@/servicios/autenticacion";
import { noAutenticado } from "@/servicios/errores";
import type { UsuarioSesion } from "@/servicios/comunes";

export const NOMBRE_COOKIE_SESION = "mostrador_sesion";

const DURACION_SEGUNDOS = 60 * 60 * 24 * 7;

function obtenerSecreto(): Uint8Array {
  const textoSecreto =
    process.env.SESSION_SECRET ?? "secreto-desarrollo-mostrador-comercial-2026-tup";
  return new TextEncoder().encode(textoSecreto);
}

export async function firmarTokenSesion(idUsuario: number): Promise<string> {
  return new SignJWT({ uid: idUsuario })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SEGUNDOS}s`)
    .sign(obtenerSecreto());
}

export async function verificarTokenSesion(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    const idUsuario = Number(payload.uid);
    return Number.isInteger(idUsuario) && idUsuario > 0 ? idUsuario : null;
  } catch {
    return null;
  }
}

export function opcionesCookieSesion() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: DURACION_SEGUNDOS,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function obtenerUsuarioActual(): Promise<UsuarioSesion | null> {
  let token: string | undefined;

  try {
    const almacenCookies = await cookies();
    token = almacenCookies.get(NOMBRE_COOKIE_SESION)?.value;
  } catch {
  }

  if (!token) {
    try {
      const almacenHeaders = await headers();
      const encabezadoAuth = almacenHeaders.get("authorization");
      if (encabezadoAuth && encabezadoAuth.startsWith("Bearer ")) {
        token = encabezadoAuth.slice(7).trim();
      }
    } catch {
    }
  }

  if (!token) return null;

  const idUsuario = await verificarTokenSesion(token);
  if (!idUsuario) return null;

  return buscarUsuarioDeSesion(idUsuario);
}

export async function exigirUsuarioApi(): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) throw noAutenticado();
  return usuario;
}

export async function exigirUsuarioPagina(): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}
