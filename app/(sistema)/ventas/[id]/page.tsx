import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Store } from "lucide-react";
import { exigirUsuarioPagina } from "@/lib/sesion";
import { obtenerFactura } from "@/servicios/facturas";
import { ApiError } from "@/servicios/errores";
import { formatearFechaHora, formatearMoneda, NOMBRES_FORMA_PAGO } from "@/lib/formato";
import { Button } from "@/componentes/ui/button";
import { Card } from "@/componentes/ui/card";
import { Separator } from "@/componentes/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/componentes/ui/table";
import { EncabezadoPagina } from "@/componentes/comunes/encabezado-pagina";
import { InsigniaEstadoFactura } from "@/componentes/comunes/insignias";
import { BotonImprimir } from "@/componentes/comunes/boton-imprimir";
import { BotonAnularFactura } from "@/componentes/dominio/modal-anular-factura";
import { Alinear, Apilar, Caja, Grilla, Pagina, Texto, Titulo } from "@/componentes/primitivas/maquetacion";

type Props = { params: Promise<{ id: string }> };

export default async function PaginaDetalleFactura({ params }: Props) {
  const usuario = await exigirUsuarioPagina();

  const { id } = await params;

  let factura;
  try {
    factura = await obtenerFactura(usuario, Number(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <Pagina>
      <EncabezadoPagina
        titulo={`Factura ${factura.numeroFormateado}`}
        subtitulo={`Emitida el ${formatearFechaHora(factura.fecha)} por ${factura.vendedor.nombre}`}
        acciones={
          <Alinear className="gap-2">
            <Link href="/ventas">
              <Button variant="outline">
                <ArrowLeft className="size-4" />
                Volver a facturas
              </Button>
            </Link>

            <BotonImprimir />

            {usuario.rol === "admin" && factura.estado === "emitida" && (
              <BotonAnularFactura
                idFactura={factura.id}
                numeroFormateado={factura.numeroFormateado}
              />
            )}
          </Alinear>
        }
      />

      {"anulacion" in factura && factura.anulacion && (
        <Card className="border-red-300 bg-red-50 p-4">
          <Alinear className="gap-3">
            <Ban className="size-5 text-red-600 shrink-0" />
            <Apilar className="gap-0.5">
              <Texto tono="peligro" negrita>
                FACTURA ANULADA · {formatearFechaHora(factura.anulacion.fecha)}
                {factura.anulacion.usuario ? ` por ${factura.anulacion.usuario.nombre}` : ""}
              </Texto>
              <Texto tamano="sm" tono="peligro">
                Motivo: {factura.anulacion.motivo}
              </Texto>
            </Apilar>
          </Alinear>
        </Card>
      )}

      <Card className="p-6 md:p-8 max-w-4xl">
        <Alinear className="justify-between items-start gap-4">
          <Alinear className="gap-3">
            <Caja className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="size-6" />
            </Caja>
            <Apilar className="gap-0.5">
              <Titulo nivel={2}>Ferretería El Yunque</Titulo>
              <Texto tamano="xs" tono="suave">
                Av. Belgrano 1850 · San Miguel de Tucumán · Tel: (0381) 432-1100
              </Texto>
              <Texto tamano="xs" tono="suave">
                Comprobante interno de venta (no válido como factura fiscal)
              </Texto>
            </Apilar>
          </Alinear>

          <Apilar className="items-end gap-1">
            <Alinear className="gap-2">
              <Texto mono negrita tamano="lg">
                Nº {factura.numeroFormateado}
              </Texto>
              <InsigniaEstadoFactura estado={factura.estado} />
            </Alinear>
            <Texto tamano="xs" tono="suave">
              Fecha y hora: {formatearFechaHora(factura.fecha)}
            </Texto>
            <Texto tamano="xs" tono="suave">
              Atendió: {factura.vendedor.nombre}
            </Texto>
          </Apilar>
        </Alinear>

        <Separator />

        <Grilla className="grid-cols-1 sm:grid-cols-2">
          <Apilar className="gap-1">
            <Texto tamano="xs" tono="suave" negrita>
              DATOS DEL COMPRADOR
            </Texto>
            {factura.cliente ? (
              <>
                <Texto negrita>{factura.cliente.nombre}</Texto>
                <Texto tamano="xs" tono="suave">
                  {factura.cliente.tipoDoc}: {factura.cliente.nroDoc}
                </Texto>
                {factura.cliente.domicilio && (
                  <Texto tamano="xs" tono="suave">
                    Domicilio: {factura.cliente.domicilio}
                  </Texto>
                )}
              </>
            ) : (
              <Texto negrita>Consumidor final</Texto>
            )}
          </Apilar>

          <Apilar className="gap-1">
            <Texto tamano="xs" tono="suave" negrita>
              CONDICIÓN Y FORMA DE PAGO
            </Texto>
            <Texto negrita>{NOMBRES_FORMA_PAGO[factura.pago.forma]}</Texto>

            {factura.pago.forma === "contado" && (
              <Texto tamano="xs" tono="suave">
                Recibido: {formatearMoneda(factura.pago.montoRecibido)} · Vuelto:{" "}
                {formatearMoneda(factura.pago.vuelto)}
              </Texto>
            )}

            {factura.pago.forma === "tarjeta" && (
              <Texto tamano="xs" tono="suave">
                Tarjeta de {factura.pago.tarjeta.tipo === "debito" ? "débito" : "crédito"}{" "}
                {factura.pago.tarjeta.marca} terminada en {factura.pago.tarjeta.ultimos4}
              </Texto>
            )}

            {factura.pago.forma === "cuenta_corriente" && "saldoCliente" in factura && (
              <Texto tamano="xs" tono="suave">
                Cargado en cuenta corriente · Saldo actual del cliente:{" "}
                {formatearMoneda(factura.saldoCliente)}
              </Texto>
            )}
          </Apilar>
        </Grilla>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factura.items.map((item) => (
              <TableRow key={item.productoId}>
                <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                <TableCell className="font-medium">{item.descripcion}</TableCell>
                <TableCell className="text-right font-mono">{item.cantidad}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatearMoneda(item.precioUnitario)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatearMoneda(item.subtotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Alinear className="justify-end border-t border-border pt-4">
          <Alinear className="gap-6">
            <Texto negrita tamano="base">
              TOTAL
            </Texto>
            <Texto mono negrita tamano="2xl" className="text-primary">
              {formatearMoneda(factura.total)}
            </Texto>
          </Alinear>
        </Alinear>
      </Card>
    </Pagina>
  );
}
