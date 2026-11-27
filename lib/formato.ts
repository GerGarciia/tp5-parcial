export const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

export const PUNTO_DE_VENTA = 1;

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export function formatearMoneda(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "—";

  return formatoMoneda.format(centavos / 100).replace(/\s/g, " ");
}

export function pesosACentavos(textoPesos: string): number | null {
  const limpio = textoPesos.trim().replace(/\$/g, "").replace(/\s/g, "");
  if (limpio === "") return null;

  let normalizado: string;
  if (limpio.includes(",")) {
    normalizado = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    normalizado = limpio.replace(/\./g, "");
  } else {
    normalizado = limpio;
  }
  const pesos = Number(normalizado);

  if (Number.isNaN(pesos)) return null;

  return Math.round(pesos * 100);
}

export function centavosATextoPesos(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "";
  return (centavos / 100).toFixed(2).replace(".", ",");
}

export function formatearFecha(fecha: Date | string | number): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatearFechaHora(fecha: Date | string | number): string {
  const dia = formatearFecha(fecha);
  const hora = new Date(fecha).toLocaleTimeString("es-AR", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dia} ${hora}`;
}

export function diaArgentino(fecha: Date): string {
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

export function inicioDelDia(diaTexto: string): Date {
  return new Date(`${diaTexto}T00:00:00-03:00`);
}

export function finDelDia(diaTexto: string): Date {
  return new Date(`${diaTexto}T23:59:59.999-03:00`);
}

export function formatearNumeroFactura(puntoVenta: number, numero: number): string {
  return `${String(puntoVenta).padStart(4, "0")}-${String(numero).padStart(8, "0")}`;
}

export function formatearNumeroRecibo(puntoVenta: number, numero: number): string {
  return `R ${formatearNumeroFactura(puntoVenta, numero)}`;
}

export function formatearDocumento(tipoDoc: string, nroDoc: string): string {
  const digitos = nroDoc.replace(/\D/g, "");
  if (tipoDoc === "CUIT" && digitos.length === 11) {
    return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
  }
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export const NOMBRES_FORMA_PAGO: Record<string, string> = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
};

export const NOMBRES_MEDIO_PAGO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta de débito",
};

export const NOMBRES_TIPO_MOVIMIENTO: Record<string, string> = {
  venta: "Venta",
  anulacion: "Anulación",
  ingreso: "Ingreso",
  egreso: "Egreso",
};
