import { z } from "zod";

export const FORMAS_PAGO = ["contado", "tarjeta", "cuenta_corriente"] as const;
export const MARCAS_TARJETA = ["Visa", "Mastercard", "American Express", "Cabal", "Naranja"] as const;

const esquemaTarjeta = z.strictObject({
  tipo: z.enum(["debito", "credito"], "Elegí débito o crédito."),
  marca: z.string().trim().min(1, "Elegí la marca."),
  ultimos4: z.string().regex(/^\d{4}$/, "Deben ser exactamente 4 dígitos."),
});

const esquemaPagoFactura = z.discriminatedUnion("forma", [
  z.strictObject({
    forma: z.literal("contado"),
    montoRecibido: z.number().int().positive("El monto debe ser mayor que cero.").optional(),
  }),
  z.strictObject({
    forma: z.literal("tarjeta"),
    tarjeta: esquemaTarjeta,
  }),
  z.strictObject({
    forma: z.literal("cuenta_corriente"),
  }),
]);

const esquemaItem = z.strictObject({
  productoId: z.number().int().positive(),
  cantidad: z.number().int("La cantidad debe ser entera.").positive("La cantidad debe ser mayor que cero."),
});

export const esquemaFacturaNueva = z.strictObject({
  clienteId: z.number().int().positive().nullable(),
  items: z
    .array(esquemaItem)
    .min(1, "La venta debe tener al menos un producto.")
    .refine(
      (items) => new Set(items.map((item) => item.productoId)).size === items.length,
      "Hay productos repetidos.",
    ),
  pago: esquemaPagoFactura,
});

export const esquemaAnulacion = z.strictObject({
  motivo: z.string("El motivo es obligatorio.").trim().min(1, "El motivo es obligatorio."),
});

export type DatosFacturaNueva = z.infer<typeof esquemaFacturaNueva>;
