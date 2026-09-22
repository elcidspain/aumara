"use client";

import { useEffect } from "react";
import {
  GOOGLE_ADS_CONFIRMED_BOOKING_SEND_TO,
  isGoogleAdsConversionSendTo,
  trackGoogleAdsConversion,
} from "@/lib/gtag";

type Props = {
  bookId: string;
  value: number;
};

export default function BookingConfirmedConversion({ bookId, value }: Props) {
  useEffect(() => {
    if (!bookId || !Number.isFinite(value) || value < 0) return;
    if (!isGoogleAdsConversionSendTo(GOOGLE_ADS_CONFIRMED_BOOKING_SEND_TO)) return;

    const key = `aumara:confirmed-booking:${bookId}`;
    try {
      if (sessionStorage.getItem(key) === "sent") return;
    } catch {}

    trackGoogleAdsConversion(GOOGLE_ADS_CONFIRMED_BOOKING_SEND_TO, {
      value,
      currency: "EUR",
      transaction_id: bookId,
      event_category: "booking",
      event_label: "beds24_confirmed",
    });

    try {
      sessionStorage.setItem(key, "sent");
    } catch {}
  }, [bookId, value]);

  return null;
}
