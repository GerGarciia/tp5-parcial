"use client";

import { useState } from "react";

import { toast } from "sonner";

import type { z } from "zod";

import type { ResultadoAccion } from "@/lib/adaptadores";

export type ErroresPorCampo = Record<string, string>;

export function usarFormulario<TEntrada, TSalida>({
  esquema,
  accion,
  mensajeExito,
  alTerminar,
}: {
  esquema: z.ZodType<TEntrada>;
  accion: (datosValidados: TEntrada) => Promise<ResultadoAccion<TSalida>>;
  mensajeExito?: string;
  alTerminar?: (resultado: TSalida) => void;
}) {
  const [errores, setErrores] = useState<ErroresPorCampo>({});

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);

  function limpiarErrores() {
    setErrores({});
    setErrorGeneral(null);
  }

  async function enviar(datosCrudos: unknown): Promise<TSalida | null> {
    limpiarErrores();

    const validacion = esquema.safeParse(datosCrudos);
    if (!validacion.success) {
      const mapaErrores: ErroresPorCampo = {};
      for (const issue of validacion.error.issues) {
        const nombreCampo = issue.path.join(".") || "general";
        if (!mapaErrores[nombreCampo]) mapaErrores[nombreCampo] = issue.message;
      }
      setErrores(mapaErrores);
      return null;
    }

    setEnviando(true);
    try {
      const respuesta = await accion(validacion.data);

      if (!respuesta.ok) {
        const mapaServidor: ErroresPorCampo = {};
        if (respuesta.error.details) {
          for (const d of respuesta.error.details) {
            if (typeof d.campo === "string" && typeof d.mensaje === "string") {
              mapaServidor[d.campo] = d.mensaje;
            }
          }
        }
        setErrores(mapaServidor);
        setErrorGeneral(respuesta.error.message);
        toast.error(respuesta.error.message);
        return null;
      }

      if (mensajeExito) toast.success(mensajeExito);
      alTerminar?.(respuesta.data);
      return respuesta.data;
    } finally {
      setEnviando(false);
    }
  }

  return {
    errores,
    errorGeneral,
    enviando,
    enviar,
    limpiarErrores,
    setErrores,
    setErrorGeneral,
  };
}
