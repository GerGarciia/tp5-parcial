export type DetalleError = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: DetalleError[];

  constructor(status: number, code: string, message: string, details?: DetalleError[]) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const noEncontrado = (queCosa: string) =>
  new ApiError(404, "NO_ENCONTRADO", `${queCosa} no existe.`);

export const sinPermiso = () =>
  new ApiError(403, "SIN_PERMISO", "Tu rol no permite realizar esta operación.");

export const noAutenticado = () =>
  new ApiError(401, "NO_AUTENTICADO", "Tenés que iniciar sesión.");
