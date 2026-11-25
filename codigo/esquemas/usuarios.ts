import { z } from "zod";

export const ROLES = ["admin", "vendedor"] as const;

export const esquemaLogin = z.strictObject({
  email: z.string().trim().min(1, "Ingresá tu email."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export const esquemaCambioContrasena = z.strictObject({
  actual: z.string().min(1, "Ingresá tu contraseña actual."),
  nueva: z.string().min(8, "La contraseña nueva debe tener al menos 8 caracteres."),
});

export const esquemaUsuarioNuevo = z.strictObject({
  nombre: z.string().trim().min(1, "Es obligatorio."),
  email: z.email("El email no es válido."),
  rol: z.enum(ROLES, "Elegí un rol."),
  password: z.string().min(8, "La contraseña temporal debe tener al menos 8 caracteres."),
});

export const esquemaUsuarioEdicion = z.strictObject({
  nombre: z.string().trim().min(1, "Es obligatorio.").optional(),
  email: z.email("El email no es válido.").optional(),
  rol: z.enum(ROLES, "Elegí un rol.").optional(),
  activo: z.boolean().optional(),
});

export type DatosUsuarioNuevo = z.infer<typeof esquemaUsuarioNuevo>;
