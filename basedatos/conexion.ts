// Conexión con la base de datos (Drizzle ORM + @libsql/client).
// - En desarrollo: DATABASE_URL="file:./local.db" (archivo SQLite local).
// - En producción (Vercel): TURSO_DATABASE_URL / DATABASE_URL="libsql://....turso.io" y su token.
// La aplicación sabe si usar la base local o la de Turso únicamente por las variables de entorno.
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as esquema from "./esquema";

const urlBaseDatos =
  process.env.TURSO_DATABASE_URL ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL !== "file:./local.db"
    ? process.env.DATABASE_URL
    : undefined) ||
  process.env.DATABASE_URL ||
  "file:./local.db";

const tokenBaseDatos =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN;

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
