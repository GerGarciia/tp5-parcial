import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

import { sql } from "drizzle-orm";

const fechaCreacion = () =>
  integer("creado_en", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  email: text("email").notNull().unique(),
  
  nombre: text("nombre").notNull(),
  
  hashContrasena: text("hash_contrasena").notNull(),
  
  rol: text("rol", { enum: ["admin", "vendedor"] }).notNull(),
  
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  
  creadoEn: fechaCreacion(),
});

export const categorias = sqliteTable("categorias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  nombre: text("nombre").notNull().unique(),
  
  activa: integer("activa", { mode: "boolean" }).notNull().default(true),
  
  creadoEn: fechaCreacion(),
});

export const productos = sqliteTable("productos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  codigo: text("codigo").notNull().unique(),
  
  descripcion: text("descripcion").notNull(),
  
  categoriaId: integer("categoria_id")
    .notNull()
    .references(() => categorias.id),
  
  precio: integer("precio").notNull(),
  
  existencia: integer("existencia").notNull().default(0),
  
  stockMinimo: integer("stock_minimo").notNull().default(0),
  
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  
  creadoEn: fechaCreacion(),
});

export const clientes = sqliteTable("clientes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  tipoDoc: text("tipo_doc", { enum: ["DNI", "CUIT"] }).notNull(),
  
  nroDoc: text("nro_doc").notNull().unique(),
  
  nombre: text("nombre").notNull(),
  
  domicilio: text("domicilio"),
  
  telefono: text("telefono"),
  
  email: text("email"),
  
  cuentaCorriente: integer("cuenta_corriente", { mode: "boolean" }).notNull().default(false),
  
  limiteCredito: integer("limite_credito"),
  
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  
  creadoEn: fechaCreacion(),
});

export const facturas = sqliteTable(
  "facturas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    
    puntoVenta: integer("punto_venta").notNull(),
    
    numero: integer("numero").notNull(),
    
    fecha: integer("fecha", { mode: "timestamp_ms" }).notNull(),
    
    clienteId: integer("cliente_id").references(() => clientes.id),
    
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    
    total: integer("total").notNull(),
    
    formaPago: text("forma_pago", { enum: ["contado", "tarjeta", "cuenta_corriente"] }).notNull(),
    
    montoRecibido: integer("monto_recibido"),
    
    tarjetaTipo: text("tarjeta_tipo", { enum: ["debito", "credito"] }),
    tarjetaMarca: text("tarjeta_marca"),
    tarjetaUltimos4: text("tarjeta_ultimos4"),
    
    estado: text("estado", { enum: ["emitida", "anulada"] }).notNull().default("emitida"),
    
    motivoAnulacion: text("motivo_anulacion"),
    
    fechaAnulacion: integer("fecha_anulacion", { mode: "timestamp_ms" }),
    
    usuarioAnulacionId: integer("usuario_anulacion_id").references(() => usuarios.id),
    
    creadoEn: fechaCreacion(),
  },
  (tabla) => [
    uniqueIndex("facturas_numero_unico").on(tabla.puntoVenta, tabla.numero),
  ],
);

export const facturaItems = sqliteTable("factura_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  facturaId: integer("factura_id")
    .notNull()
    .references(() => facturas.id),
  
  productoId: integer("producto_id")
    .notNull()
    .references(() => productos.id),
  
  codigo: text("codigo").notNull(),
  descripcion: text("descripcion").notNull(),
  
  cantidad: integer("cantidad").notNull(),
  
  precioUnitario: integer("precio_unitario").notNull(),
  
  subtotal: integer("subtotal").notNull(),
  
  creadoEn: fechaCreacion(),
});

export const movimientosStock = sqliteTable("movimientos_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  productoId: integer("producto_id")
    .notNull()
    .references(() => productos.id),
  
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id),
  
  facturaId: integer("factura_id").references(() => facturas.id),
  
  tipo: text("tipo", { enum: ["venta", "anulacion", "ingreso", "egreso"] }).notNull(),
  
  cantidad: integer("cantidad").notNull(),
  
  existenciaResultante: integer("existencia_resultante").notNull(),
  
  motivo: text("motivo").notNull(),
  
  observacion: text("observacion"),
  
  fecha: integer("fecha", { mode: "timestamp_ms" }).notNull(),
  
  creadoEn: fechaCreacion(),
});

export const pagos = sqliteTable(
  "pagos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    
    puntoVenta: integer("punto_venta").notNull(),
    
    numeroRecibo: integer("numero_recibo").notNull(),
    
    fecha: integer("fecha", { mode: "timestamp_ms" }).notNull(),
    
    clienteId: integer("cliente_id")
      .notNull()
      .references(() => clientes.id),
    
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    
    importe: integer("importe").notNull(),
    
    medio: text("medio", { enum: ["efectivo", "transferencia", "tarjeta_debito"] }).notNull(),
    
    observacion: text("observacion"),
    
    creadoEn: fechaCreacion(),
  },
  (tabla) => [
    uniqueIndex("pagos_numero_unico").on(tabla.puntoVenta, tabla.numeroRecibo),
  ],
);

export const movimientosCuenta = sqliteTable("movimientos_cuenta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  clienteId: integer("cliente_id")
    .notNull()
    .references(() => clientes.id),
  
  facturaId: integer("factura_id").references(() => facturas.id),
  
  pagoId: integer("pago_id").references(() => pagos.id),
  
  tipo: text("tipo", { enum: ["debito", "credito"] }).notNull(),
  
  importe: integer("importe").notNull(),
  
  descripcion: text("descripcion").notNull(),
  
  fecha: integer("fecha", { mode: "timestamp_ms" }).notNull(),
  
  creadoEn: fechaCreacion(),
});

export type Usuario = typeof usuarios.$inferSelect;
export type Producto = typeof productos.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Factura = typeof facturas.$inferSelect;
