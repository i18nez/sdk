import { hashText } from "@i18nez/core";

const SOURCE_TO_TRANSLATIONS: Record<
  string,
  Record<string, string>
> = {
  Hello: { it: "Ciao", fr: "Bonjour", es: "Hola", de: "Hallo" },
  Welcome: { it: "Benvenuto", fr: "Bienvenue", es: "Bienvenido", de: "Willkommen" },
  "Add to cart": {
    it: "Aggiungi al carrello",
    fr: "Ajouter au panier",
    es: "Añadir al carrito",
    de: "In den Warenkorb",
  },
  "Hi {name}": {
    it: "Ciao {name}",
    fr: "Salut {name}",
    es: "Hola {name}",
    de: "Hallo {name}",
  },
  "You have {count} messages": {
    it: "Hai {count} messaggi",
    fr: "Vous avez {count} messages",
    es: "Tienes {count} mensajes",
    de: "Sie haben {count} Nachrichten",
  },
  "Please wait while we load your content...": {
    it: "Attendere il caricamento dei contenuti...",
    fr: "Veuillez patienter pendant le chargement...",
    es: "Por favor espere mientras cargamos el contenido...",
    de: "Bitte warten, während wir Ihre Inhalte laden...",
  },
};

export const SUPPORTED_LOCALES = ["en", "it", "fr", "es", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export async function buildBundle(
  locale: Locale,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const [source, byLocale] of Object.entries(SOURCE_TO_TRANSLATIONS)) {
    const hash = await hashText(source);
    if (locale === "en") {
      out[hash] = source;
    } else if (byLocale[locale]) {
      out[hash] = byLocale[locale];
    }
  }
  return out;
}

export async function translateOne(
  text: string,
  targetLocale: Locale,
): Promise<string> {
  const byLocale = SOURCE_TO_TRANSLATIONS[text];
  if (!byLocale) return `[${targetLocale.toUpperCase()}] ${text}`;
  return byLocale[targetLocale] ?? `[${targetLocale.toUpperCase()}] ${text}`;
}
