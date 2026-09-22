import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import BookingConfirmedConversion from "@/components/site/BookingConfirmedConversion";

export const metadata: Metadata = {
  title: "Reserva confirmada",
  description: "Confirmación de una reserva directa AUMARA.",
  robots: { index: false, follow: false },
};

type Query = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parsePrice(raw: string): number {
  const normalized = raw.trim().replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export default function BookingConfirmedPage({ searchParams }: { searchParams?: Query }) {
  const params = searchParams ?? {};
  const bookId = first(params.bookid).trim();
  const propId = first(params.propid).trim();
  const status = first(params.status).trim();
  const price = parsePrice(first(params.price));
  const checkIn = first(params.firstnight).trim();
  const checkOut = first(params.checkout).trim();

  const isAumara = propId === "324882";
  const isConfirmed = status === "1" || status === "2";
  const hasReference = /^\d+$/.test(bookId);
  const trackConfirmedBooking = isAumara && isConfirmed && hasReference;

  return (
    <InfoShell eyebrow="Direct booking" title={trackConfirmedBooking ? "Reserva confirmada" : "Reserva recibida"}>
      {trackConfirmedBooking ? <BookingConfirmedConversion bookId={bookId} value={price} /> : null}
      <p>
        {trackConfirmedBooking
          ? "Gracias. Beds24 ha confirmado tu reserva directa en AUMARA."
          : "Hemos recibido el retorno del motor de reservas. La confirmación final depende del estado mostrado por Beds24."}
      </p>
      {hasReference ? <p><strong>Referencia:</strong> {bookId}</p> : null}
      {checkIn ? <p><strong>Entrada:</strong> {checkIn}{checkOut ? <> · <strong>Salida:</strong> {checkOut}</> : null}</p> : null}
      {trackConfirmedBooking && price > 0 ? <p><strong>Total registrado:</strong> €{price.toFixed(2)}</p> : null}
      <p>Conserva el correo de confirmación de Beds24 para los detalles de la estancia, condiciones y contacto.</p>
    </InfoShell>
  );
}
