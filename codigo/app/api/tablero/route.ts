import { NextResponse } from "next/server";
import { conSesionApi } from "@/lib/adaptadores";
import { obtenerTablero } from "@/servicios/tablero";

export async function GET() {
  return conSesionApi(async (usuario) => {
    const resultado = await obtenerTablero(usuario);
    return NextResponse.json(resultado, { status: 200 });
  });
}
