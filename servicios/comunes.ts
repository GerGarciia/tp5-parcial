import { z } from "zod";

import { ApiError, sinPermiso } from "./errores";

export type UsuarioSesion = {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "vendedor";
};

export function validar<T>(esquema: z.ZodType<T>, datosSinValidar: unknown): T {
  const resultado = esquema.safeParse(datosSinValidar);

  if (resultado.success) return resultado.data;

  const detalles = resultado.error.issues.map((problema) => ({
    campo: problema.path.join(".") || (problema.code === "unrecognized_keys" ? problema.keys.join(",") : ""),
    mensaje: problema.message,
  }));

  throw new ApiError(422, "VALIDACION", "Hay campos con errores.", detalles);
}

export function exigirAdmin(usuario: UsuarioSesion) {
  if (usuario.rol !== "admin") throw sinPermiso();
}

export function leerPaginacion(parametros: { page?: unknown; pageSize?: unknown }) {
  const pagina = Math.max(1, Number(parametros.page) || 1);
  const tamanoPagina = Math.min(100, Math.max(1, Number(parametros.pageSize) || 20));
  return { pagina, tamanoPagina, salto: (pagina - 1) * tamanoPagina };
}

export function respuestaPaginada<T>(datos: T[], pagina: number, tamanoPagina: number, total: number) {
  return { data: datos, page: pagina, pageSize: tamanoPagina, total };
}
