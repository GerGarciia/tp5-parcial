import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db, type Conexion } from "@/basedatos/conexion";

import { facturas, movimientosStock, productos, usuarios } from "@/basedatos/esquema";

import { esquemaMovimientoStock } from "@/esquemas/productos";

import { finDelDia, formatearNumeroFactura, inicioDelDia } from "@/lib/formato";

import { ApiError, noEncontrado } from "./errores";

import { exigirAdmin, leerPaginacion, respuestaPaginada, validar, type UsuarioSesion } from "./comunes";

type TipoMovimiento = "venta" | "anulacion" | "ingreso" | "egreso";

type DatosMovimiento = {
  productoId: number;
  cantidad: number;
  tipo: TipoMovimiento;
  motivo: string;
  observacion?: string;
  usuarioId: number;
  facturaId?: number;
  fecha?: Date;
};

export async function moverStock(tx: Conexion, datos: DatosMovimiento) {
  const filasModificadas = await tx
    .update(productos)
    .set({ existencia: sql`${productos.existencia} + ${datos.cantidad}` })
    .where(and(eq(productos.id, datos.productoId), gte(productos.existencia, -datos.cantidad)))
    .returning({ existencia: productos.existencia });

  if (filasModificadas.length === 0) {
    const producto = await tx
      .select({ existencia: productos.existencia, descripcion: productos.descripcion })
      .from(productos)
      .where(eq(productos.id, datos.productoId))
      .get();

    if (!producto) throw noEncontrado("El producto");

    throw new ApiError(409, "STOCK_INSUFICIENTE", `No hay existencia suficiente de "${producto.descripcion}".`, [
      { productoId: datos.productoId, solicitado: -datos.cantidad, disponible: producto.existencia },
    ]);
  }

  const existenciaResultante = filasModificadas[0].existencia;

  const [movimientoCreado] = await tx
    .insert(movimientosStock)
    .values({
      productoId: datos.productoId,
      usuarioId: datos.usuarioId,
      facturaId: datos.facturaId ?? null,
      tipo: datos.tipo,
      cantidad: datos.cantidad,
      existenciaResultante,
      motivo: datos.motivo,
      observacion: datos.observacion ?? null,
      fecha: datos.fecha ?? new Date(),
    })
    .returning();

  return movimientoCreado;
}

export async function registrarMovimientoManual(
  usuario: UsuarioSesion,
  idProducto: number,
  datosSinValidar: unknown,
  opciones: { fecha?: Date } = {},
) {
  exigirAdmin(usuario);

  const datos = validar(esquemaMovimientoStock, datosSinValidar);

  const cantidadConSigno = datos.tipo === "ingreso" ? datos.cantidad : -datos.cantidad;

  const movimientoCreado = await db.transaction(async (tx) => {
    return moverStock(tx, {
      productoId: idProducto,
      cantidad: cantidadConSigno,
      tipo: datos.tipo,
      motivo: datos.motivo,
      observacion: datos.observacion,
      usuarioId: usuario.id,
      fecha: opciones.fecha,
    });
  });

  return buscarMovimientoPublico(movimientoCreado.id);
}

export async function listarMovimientosDeProducto(
  usuario: UsuarioSesion,
  idProducto: number,
  parametros: { page?: string; pageSize?: string },
) {
  return listarMovimientosStock(usuario, { ...parametros, productoId: String(idProducto) });
}

type FiltrosMovimientos = {
  productoId?: string;
  tipo?: string;
  desde?: string;
  hasta?: string;
  page?: string;
  pageSize?: string;
};

export async function listarMovimientosStock(_usuario: UsuarioSesion, parametros: FiltrosMovimientos) {
  const { pagina, tamanoPagina, salto } = leerPaginacion(parametros);

  const condiciones = [];

  if (parametros.productoId) condiciones.push(eq(movimientosStock.productoId, Number(parametros.productoId)));

  if (parametros.tipo) condiciones.push(eq(movimientosStock.tipo, parametros.tipo as TipoMovimiento));

  if (parametros.desde) condiciones.push(gte(movimientosStock.fecha, inicioDelDia(parametros.desde)));

  if (parametros.hasta) condiciones.push(lte(movimientosStock.fecha, finDelDia(parametros.hasta)));

  const filtro = and(...condiciones);

  const filas = await consultaMovimientos()
    .where(filtro)
    .orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id))
    .limit(tamanoPagina)
    .offset(salto);

  const [{ total }] = await db.select({ total: count() }).from(movimientosStock).where(filtro);

  return respuestaPaginada(filas.map(aMovimientoPublico), pagina, tamanoPagina, total);
}

function consultaMovimientos() {
  return db
    .select({
      movimiento: movimientosStock,
      productoCodigo: productos.codigo,
      productoDescripcion: productos.descripcion,
      usuarioNombre: usuarios.nombre,
      facturaPuntoVenta: facturas.puntoVenta,
      facturaNumero: facturas.numero,
    })
    .from(movimientosStock)
    .innerJoin(productos, eq(movimientosStock.productoId, productos.id))
    .innerJoin(usuarios, eq(movimientosStock.usuarioId, usuarios.id))
    .leftJoin(facturas, eq(movimientosStock.facturaId, facturas.id));
}

type FilaMovimiento = Awaited<ReturnType<ReturnType<typeof consultaMovimientos>["get"]>>;

function aMovimientoPublico(fila: NonNullable<FilaMovimiento>) {
  const { movimiento } = fila;

  const referencia =
    movimiento.facturaId && fila.facturaNumero !== null && fila.facturaPuntoVenta !== null
      ? {
          facturaId: movimiento.facturaId,
          numero: formatearNumeroFactura(fila.facturaPuntoVenta, fila.facturaNumero),
        }
      : null;

  return {
    id: movimiento.id,
    producto: { id: movimiento.productoId, codigo: fila.productoCodigo, descripcion: fila.productoDescripcion },
    tipo: movimiento.tipo,
    cantidad: movimiento.cantidad,
    existenciaResultante: movimiento.existenciaResultante,
    motivo: movimiento.motivo,
    observacion: movimiento.observacion,
    referencia,
    usuario: { id: movimiento.usuarioId, nombre: fila.usuarioNombre },
    fecha: movimiento.fecha.toISOString(),
  };
}

async function buscarMovimientoPublico(idMovimiento: number) {
  const fila = await consultaMovimientos().where(eq(movimientosStock.id, idMovimiento)).get();
  if (!fila) throw noEncontrado("El movimiento");
  return aMovimientoPublico(fila);
}

export type MovimientoPublico = ReturnType<typeof aMovimientoPublico>;
