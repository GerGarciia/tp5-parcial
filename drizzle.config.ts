import "dotenv/config";
import { defineConfig } from "drizzle-kit";

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

const esTurso = urlBaseDatos.startsWith("libsql://");

export default defineConfig({
  schema: "./basedatos/esquema.ts",
  out: "./basedatos/migraciones",
  dialect: esTurso ? "turso" : "sqlite",
  dbCredentials: esTurso
    ? { url: urlBaseDatos, authToken: tokenBaseDatos }
    : { url: urlBaseDatos },
});
