// Conexión con la base de datos.
// - En desarrollo: DATABASE_URL="file:./local.db" (un archivo SQLite local).
// - En producción (Vercel): DATABASE_URL="libsql://....turso.io" y DATABASE_AUTH_TOKEN (o copia segura a /tmp).
// La aplicación sabe cuál usar SOLO por las variables de entorno.
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as esquema from "./esquema";

let urlBaseDatos = process.env.DATABASE_URL ?? "file:./local.db";
const tokenBaseDatos = process.env.DATABASE_AUTH_TOKEN;

// Si estamos en Vercel (servidor sin estado de solo lectura) y usando archivo local,
// copiamos la base de datos sembrada a /tmp para permitir lecturas y escrituras sin error de EROFS.
if (process.env.VERCEL && urlBaseDatos.startsWith("file:")) {
  const rutaArchivo = urlBaseDatos.replace("file:", "");
  const rutaTmp = "/tmp/local.db";
  try {
    const origen = path.resolve(process.cwd(), rutaArchivo);
    if (!fs.existsSync(rutaTmp) && fs.existsSync(origen)) {
      fs.copyFileSync(origen, rutaTmp);
    }
    urlBaseDatos = `file:${rutaTmp}`;
  } catch (error) {
    console.error("Error preparando base de datos en /tmp:", error);
  }
}

const clienteSql = createClient({
  url: urlBaseDatos,
  authToken: tokenBaseDatos || undefined,
});

// "db" es el objeto que usan todos los servicios para leer y escribir.
export const db = drizzle(clienteSql, { schema: esquema });

// Tipo de "db" o de una transacción: los servicios aceptan cualquiera de los dos.
export type BaseDatos = typeof db;
export type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Conexion = BaseDatos | Transaccion;
