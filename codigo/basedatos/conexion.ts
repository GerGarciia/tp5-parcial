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

export const db = drizzle(clienteSql, { schema: esquema });

export type BaseDatos = typeof db;
export type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Conexion = BaseDatos | Transaccion;
