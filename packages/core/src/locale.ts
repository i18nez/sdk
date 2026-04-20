export function isValidLocale(locale: string): boolean {
  if (!locale || typeof locale !== "string") return false;
  try {
    new Intl.Locale(locale);
    return true;
  } catch {
    return false;
  }
}

export function normalizeLocale(
  locale: string,
  options: { keepRegion?: boolean } = {},
): string {
  if (!locale) return locale;
  let parsed: Intl.Locale;
  try {
    parsed = new Intl.Locale(locale);
  } catch {
    return locale;
  }
  const lang = parsed.language;
  const script = parsed.script;
  const region = parsed.region;
  let out = lang;
  if (script) out += `-${script}`;
  if (options.keepRegion && region) out += `-${region}`;
  return out;
}

export function detectLocale(fallback: string): string {
  try {
    const nav = (globalThis as {
      navigator?: { language?: string; languages?: readonly string[] };
    }).navigator;
    if (nav?.languages && nav.languages.length > 0 && nav.languages[0]) {
      return nav.languages[0];
    }
    if (nav && typeof nav.language === "string" && nav.language) {
      return nav.language;
    }
  } catch {
    // ignore
  }
  return fallback;
}
