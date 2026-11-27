import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/basedatos/conexion";
import { usuarios, type Usuario } from "@/basedatos/esquema";
import { esquemaCambioContrasena, esquemaLogin } from "@/esquemas/usuarios";
import { ApiError } from "./errores";
import { validar, type UsuarioSesion } from "./comunes";

export function aUsuarioPublico(fila: Usuario): UsuarioSesion {
  return { id: fila.id, nombre: fila.nombre, email: fila.email, rol: fila.rol };
}

export async function iniciarSesion(datosSinValidar: unknown): Promise<UsuarioSesion> {
  const datos = validar(esquemaLogin, datosSinValidar);

  const emailBuscado = datos.email.toLowerCase();

  const usuarioEncontrado = await db.select().from(usuarios).where(eq(usuarios.email, emailBuscado)).get();

  const contrasenaCorrecta =
    usuarioEncontrado !== undefined && (await bcrypt.compare(datos.password, usuarioEncontrado.hashContrasena));

  if (!usuarioEncontrado || !contrasenaCorrecta || !usuarioEncontrado.activo) {
    throw new ApiError(401, "CREDENCIALES_INVALIDAS", "El email o la contraseña son incorrectos.");
  }

  return aUsuarioPublico(usuarioEncontrado);
}

export async function buscarUsuarioDeSesion(idUsuario: number): Promise<UsuarioSesion | null> {
  const usuarioEncontrado = await db.select().from(usuarios).where(eq(usuarios.id, idUsuario)).get();

  if (!usuarioEncontrado || !usuarioEncontrado.activo) return null;

  return aUsuarioPublico(usuarioEncontrado);
}

export async function cambiarContrasena(usuario: UsuarioSesion, datosSinValidar: unknown) {
  const datos = validar(esquemaCambioContrasena, datosSinValidar);

  const filaUsuario = await db.select().from(usuarios).where(eq(usuarios.id, usuario.id)).get();

  const actualCorrecta = filaUsuario && (await bcrypt.compare(datos.actual, filaUsuario.hashContrasena));

  if (!actualCorrecta) {
    throw new ApiError(422, "CONTRASENA_ACTUAL_INCORRECTA", "La contraseña actual no es correcta.", [
      { campo: "actual", mensaje: "La contraseña actual no es correcta." },
    ]);
  }

  const hashNuevo = await bcrypt.hash(datos.nueva, 10);

  await db.update(usuarios).set({ hashContrasena: hashNuevo }).where(eq(usuarios.id, usuario.id));
}
