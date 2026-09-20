import type { Metadata } from "next";
import InfoShell from "../_components/InfoShell";
import { SITE_URL } from "@/lib/guest";

export const metadata: Metadata = {
  title: "Cookies",
  description: "Cookies y almacenamiento en AUMARA: lo esencial primero. Medición de Google, denegada por defecto.",
  alternates: { canonical: `${SITE_URL}/cookies` },
};

export default function CookiesPage() {
  return <InfoShell eyebrow="Cookies & browser storage" title="Essential first. Optional only when allowed.">
    <h2>Current configuration</h2>
    <p>AUMARA may use essential browser storage required for site operation, security, language/session continuity and interactive guest features.</p>
    <h2>Google measurement</h2>
    <p>If Google Analytics or Google Ads identifiers are configured, the site initialises Google Consent Mode with <strong>ad_storage</strong>, <strong>analytics_storage</strong>, <strong>ad_user_data</strong> and <strong>ad_personalization</strong> set to <strong>denied</strong> by default.</p>
    <h2>Third-party booking</h2>
    <p>Opening Beds24 moves you to a third-party booking environment. Cookies or storage used there are governed by that service and the reservation process.</p>
    <h2>Browser controls</h2>
    <p>You can inspect, delete or block cookies and local storage using your browser settings. Blocking storage that is technically necessary can prevent parts of the site or booking flow from operating correctly.</p>
    <p>Last updated: 13 September 2026.</p>
  </InfoShell>;
}
