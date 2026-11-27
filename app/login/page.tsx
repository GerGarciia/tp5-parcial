import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { FormularioLogin } from "@/componentes/dominio/formulario-login";
import { Apilar, Caja, Texto } from "@/componentes/primitivas/maquetacion";

export default async function PaginaLogin() {
  const usuario = await obtenerUsuarioActual();

  if (usuario) redirect("/");

  return (
    <Caja className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50/40 to-slate-200 p-4">
      <FormularioLogin />
      <Apilar className="mt-6 self-end sm:mt-0 sm:fixed sm:right-4 sm:bottom-4 gap-0.5 rounded-lg border border-border/70 bg-card/85 px-3.5 py-2.5 text-right shadow-xs backdrop-blur-xs">
        <Texto tamano="xs" negrita>
          Grupo 25
        </Texto>
        <Texto tamano="xs" tono="suave">
          Germán García - 63204
        </Texto>
        <Texto tamano="xs" tono="suave">
          Caro Marcos - 63627
        </Texto>
        <Texto tamano="xs" tono="suave">
          Mateo Palacios - 61246
        </Texto>
      </Apilar>
    </Caja>
  );
}
