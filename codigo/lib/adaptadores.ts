import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "@/servicios/errores";
import { exigirUsuarioApi } from "./sesion";
import type { UsuarioSesion } from "@/servicios/comunes";

export function responderErrorApi(errorCapturado: unknown) {
  if (errorCapturado instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: errorCapturado.code,
          message: errorCapturado.message,
          ...(errorCapturado.details ? { details: errorCapturado.details } : {}),
        },
      },
      { status: errorCapturado.status },
    );
  }

  console.error("Error inesperado en la API:", errorCapturado);

  return NextResponse.json(
    {
      error: {
        code: "ERROR_INTERNO",
        message: "Ocurrió un error interno en el servidor.",
      },
    },
    { status: 500 },
  );
}

export async function leerJsonPedido(pedido: NextRequest | Request): Promise<unknown> {
  try {
    return await pedido.json();
  } catch {
    throw new ApiError(400, "JSON_INVALIDO", "El cuerpo del pedido no es un JSON válido.");
  }
}

export function leerParametrosUrl(pedido: NextRequest | Request): Record<string, string> {
  const url = new URL(pedido.url);
  return Object.fromEntries(url.searchParams.entries());
}

export async function conSesionApi(
  manejador: (usuario: UsuarioSesion) => Promise<NextResponse | Response>,
): Promise<NextResponse | Response> {
  try {
    const usuario = await exigirUsuarioApi();
    return await manejador(usuario);
  } catch (errorCapturado) {
    return responderErrorApi(errorCapturado);
  }
}

export type ResultadoAccion<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, unknown>[];
      };
    };

export async function ejecutarAccion<T>(
  operacion: (usuario: UsuarioSesion) => Promise<T>,
): Promise<ResultadoAccion<T>> {
  try {
    const usuario = await exigirUsuarioApi();
    const data = await operacion(usuario);
    return { ok: true, data };
  } catch (errorCapturado) {
    if (errorCapturado instanceof ApiError) {
      return {
        ok: false,
        error: {
          code: errorCapturado.code,
          message: errorCapturado.message,
          details: errorCapturado.details,
        },
      };
    }
    console.error("Error inesperado en Server Action:", errorCapturado);
    return {
      ok: false,
      error: {
        code: "ERROR_INTERNO",
        message: "Ocurrió un error inesperado.",
      },
    };
  }
}
