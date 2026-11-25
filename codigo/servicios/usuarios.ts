import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { and, count, eq, like, or, asc } from "drizzle-orm";
import { db } from "@/basedatos/conexion";
import { usuarios } from "@/basedatos/esquema";
import { esquemaUsuarioEdicion, esquemaUsuarioNuevo } from "@/esquemas/usuarios";
import { ApiError, noEncontrado } from "./errores";
import { exigirAdmin, leerPaginacion, respuestaPaginada, validar, type UsuarioSesion } from "./comunes";
import { aUsuarioPublico } from "./autenticacion";

type ParametrosListado = { q?: string; activo?: string; page?: string; pageSize?: string };

export async function listarVendedoresParaFiltro(_usuario: UsuarioSesion) {
  return db
    .select({ id: usuarios.id, nombre: usuarios.nombre })
    .from(usuarios)
    .orderBy(asc(usuarios.nombre));
}

export async function listarUsuarios(usuario: UsuarioSesion, parametros: ParametrosListado) {
  exigirAdmin(usuario);

  const { pagina, tamanoPagina, salto } = leerPaginacion(parametros);

  const condiciones = [];

  if (parametros.q) {
    const textoBuscado = `%${parametros.q}%`;
    condiciones.push(or(like(usuarios.nombre, textoBuscado), like(usuarios.email, textoBuscado)));
  }

  if (parametros.activo === "true") condiciones.push(eq(usuarios.activo, true));
  if (parametros.activo === "false") condiciones.push(eq(usuarios.activo, false));

  const filtro = and(...condiciones);

  const filas = await db
    .select()
    .from(usuarios)
    .where(filtro)
    .orderBy(asc(usuarios.nombre))
    .limit(tamanoPagina)
    .offset(salto);

  const [{ total }] = await db.select({ total: count() }).from(usuarios).where(filtro);

  const datos = filas.map((fila) => ({ ...aUsuarioPublico(fila), activo: fila.activo }));

  return respuestaPaginada(datos, pagina, tamanoPagina, total);
}

export async function crearUsuario(usuario: UsuarioSesion, datosSinValidar: unknown) {
  exigirAdmin(usuario);

  const datos = validar(esquemaUsuarioNuevo, datosSinValidar);

  const emailNuevo = datos.email.toLowerCase();

  await verificarEmailLibre(emailNuevo);

  const hashContrasena = await bcrypt.hash(datos.password, 10);

  const [usuarioCreado] = await db
    .insert(usuarios)
    .values({ nombre: datos.nombre, email: emailNuevo, rol: datos.rol, hashContrasena, activo: true })
    .returning();

  return { ...aUsuarioPublico(usuarioCreado), activo: usuarioCreado.activo };
}

export async function editarUsuario(usuario: UsuarioSesion, idUsuario: number, datosSinValidar: unknown) {
  exigirAdmin(usuario);

  const datos = validar(esquemaUsuarioEdicion, datosSinValidar);

  const usuarioExistente = await db.select().from(usuarios).where(eq(usuarios.id, idUsuario)).get();
  if (!usuarioExistente) throw noEncontrado("El usuario");

  const esElMismo = idUsuario === usuario.id;
  if (esElMismo && (datos.activo === false || (datos.rol !== undefined && datos.rol !== "admin"))) {
    throw new ApiError(422, "OPERACION_SOBRE_SI_MISMO", "No podés desactivarte ni quitarte el rol de administrador.");
  }

  if (datos.email) {
    datos.email = datos.email.toLowerCase();
    if (datos.email !== usuarioExistente.email) await verificarEmailLibre(datos.email);
  }

  const [usuarioEditado] = await db.update(usuarios).set(datos).where(eq(usuarios.id, idUsuario)).returning();

  return { ...aUsuarioPublico(usuarioEditado), activo: usuarioEditado.activo };
}

export async function restablecerContrasena(usuario: UsuarioSesion, idUsuario: number) {
  exigirAdmin(usuario);

  const usuarioExistente = await db.select().from(usuarios).where(eq(usuarios.id, idUsuario)).get();
  if (!usuarioExistente) throw noEncontrado("El usuario");

  const passwordTemporal = generarContrasenaTemporal();

  const hashContrasena = await bcrypt.hash(passwordTemporal, 10);

  await db.update(usuarios).set({ hashContrasena }).where(eq(usuarios.id, idUsuario));

  return { passwordTemporal };
}

async function verificarEmailLibre(email: string) {
  const otroUsuario = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).get();
  if (otroUsuario) {
    throw new ApiError(409, "EMAIL_DUPLICADO", "Ya existe un usuario con ese email.", [
      { campo: "email", mensaje: "Ya existe un usuario con ese email." },
    ]);
  }
}

function generarContrasenaTemporal(): string {
  const caracteres = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let contrasena = "";
  for (let i = 0; i < 10; i++) {
    contrasena += caracteres[randomInt(caracteres.length)];
  }
  return contrasena;
}
