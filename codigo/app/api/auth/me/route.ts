import { NextResponse } from "next/server";
import { conSesionApi } from "@/lib/adaptadores";

export async function GET() {
  return conSesionApi(async (usuario) => NextResponse.json(usuario, { status: 200 }));
}
