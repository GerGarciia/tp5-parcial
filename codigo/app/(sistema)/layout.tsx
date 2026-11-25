import { exigirUsuarioPagina } from "@/lib/sesion";

import { EstructuraAplicacion } from "@/componentes/estructura/panel-lateral";

export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuarioPagina();

  return <EstructuraAplicacion usuario={usuario}>{children}</EstructuraAplicacion>;
}
