"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { detectLang, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "aumara-google-consent-v1";

type Choice = "granted" | "denied";

type ConsentCopy = {
  eyebrow: string;
  title: string;
  body: string;
  accept: string;
  decline: string;
  details: string;
  change: string;
};

const COPY: Partial<Record<Lang, ConsentCopy>> & { en: ConsentCopy } = {
  es: {
    eyebrow: "Privacidad",
    title: "Medición opcional",
    body:
      "AUMARA usa almacenamiento esencial para que el sitio funcione. Con tu permiso, Google Ads y Analytics pueden guardar identificadores de medición para atribuir reservas y mejorar la publicidad. Puedes continuar sin esta medición.",
    accept: "Aceptar medición",
    decline: "Continuar sin medición",
    details: "Más información",
    change: "Cambiar preferencias de medición",
  },
  en: {
    eyebrow: "Privacy",
    title: "Optional measurement",
    body:
      "AUMARA uses essential storage for the site to work. With your permission, Google Ads and Analytics may store measurement identifiers to attribute bookings and improve advertising. You can continue without this measurement.",
    accept: "Accept measurement",
    decline: "Continue without measurement",
    details: "More information",
    change: "Change measurement preferences",
  },
  ru: {
    eyebrow: "Конфиденциальность",
    title: "Необязательная аналитика",
    body:
      "AUMARA использует обязательное хранилище для работы сайта. С вашего согласия Google Ads и Analytics могут сохранять идентификаторы измерения для атрибуции бронирований и улучшения рекламы. Сайт работает и без этой аналитики.",
    accept: "Разрешить аналитику",
    decline: "Продолжить без аналитики",
    details: "Подробнее",
    change: "Изменить настройки аналитики",
  },
  fr: {
    eyebrow: "Confidentialité",
    title: "Mesure facultative",
    body:
      "AUMARA utilise le stockage essentiel au fonctionnement du site. Avec votre accord, Google Ads et Analytics peuvent enregistrer des identifiants de mesure afin d'attribuer les réservations et d'améliorer la publicité. Vous pouvez continuer sans cette mesure.",
    accept: "Accepter la mesure",
    decline: "Continuer sans mesure",
    details: "En savoir plus",
    change: "Modifier les préférences de mesure",
  },
  de: {
    eyebrow: "Datenschutz",
    title: "Optionale Messung",
    body:
      "AUMARA verwendet erforderlichen Speicher für den Betrieb der Website. Mit Ihrer Zustimmung dürfen Google Ads und Analytics Messkennungen speichern, um Buchungen zuzuordnen und Werbung zu verbessern. Sie können ohne diese Messung fortfahren.",
    accept: "Messung akzeptieren",
    decline: "Ohne Messung fortfahren",
    details: "Mehr erfahren",
    change: "Messeinstellungen ändern",
  },
  nl: {
    eyebrow: "Privacy",
    title: "Optionele meting",
    body:
      "AUMARA gebruikt essentiële opslag om de site te laten werken. Met uw toestemming mogen Google Ads en Analytics meet-ID's opslaan om boekingen toe te wijzen en advertenties te verbeteren. U kunt doorgaan zonder deze meting.",
    accept: "Meting accepteren",
    decline: "Doorgaan zonder meting",
    details: "Meer informatie",
    change: "Meetvoorkeuren wijzigen",
  },
};

function readChoice(): Choice | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function updateGoogleConsent(choice: Choice) {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;

  gtag("consent", "update", {
    ad_storage: choice,
    analytics_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
}

export default function GoogleConsent() {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>("es");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setLang(detectLang());
    const saved = readChoice();
    setChoice(saved);
    setShow(saved === null);
  }, []);

  const copy = useMemo(() => COPY[lang] ?? COPY.en, [lang]);

  const choose = (next: Choice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Consent update still applies for the current page even if storage is unavailable.
    }
    updateGoogleConsent(next);
    setChoice(next);
    setShow(false);
  };

  if (!show) {
    if (pathname !== "/cookies" || choice === null) return null;
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        style={{
          position: "fixed",
          right: "max(18px, env(safe-area-inset-right))",
          bottom: "max(18px, env(safe-area-inset-bottom))",
          zIndex: 120,
          border: "1px solid rgba(191,146,87,.7)",
          borderRadius: 999,
          background: "rgba(24,32,25,.96)",
          color: "var(--cream)",
          padding: "10px 16px",
          cursor: "pointer",
          boxShadow: "0 12px 34px rgba(0,0,0,.22)",
        }}
      >
        {copy.change}
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="aumara-consent-title"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "max(18px, env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        zIndex: 120,
        width: "min(760px, calc(100% - 28px))",
        border: "1px solid rgba(191,146,87,.55)",
        borderRadius: 18,
        background: "rgba(24,32,25,.97)",
        color: "var(--cream)",
        padding: "20px",
        boxShadow: "0 24px 70px rgba(0,0,0,.34)",
        backdropFilter: "blur(14px)",
      }}
    >
      <p
        style={{
          margin: "0 0 7px",
          color: "var(--gold-bright)",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        {copy.eyebrow}
      </p>
      <h2 id="aumara-consent-title" style={{ fontSize: "clamp(24px, 3vw, 34px)", marginBottom: 8 }}>
        {copy.title}
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.55, color: "rgba(242,234,220,.86)" }}>
        {copy.body}{" "}
        <Link href="/cookies" style={{ color: "var(--gold-bright)", textDecoration: "underline" }}>
          {copy.details}
        </Link>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={() => choose("granted")} style={choiceStyle}>
          {copy.accept}
        </button>
        <button type="button" onClick={() => choose("denied")} style={choiceStyle}>
          {copy.decline}
        </button>
      </div>
    </section>
  );
}

const choiceStyle = {
  flex: "1 1 220px",
  minHeight: 44,
  border: "1px solid rgba(242,234,220,.42)",
  borderRadius: 999,
  background: "rgba(242,234,220,.08)",
  color: "var(--cream)",
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
} as const;
