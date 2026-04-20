import type { PersistenceAdapter } from "./types";

export class TranslationCache {
  private store = new Map<string, Map<string, string>>();
  private bundleLoaded = new Set<string>();

  constructor(private persistence?: PersistenceAdapter) {}

  private localeMap(locale: string): Map<string, string> {
    let m = this.store.get(locale);
    if (!m) {
      m = new Map();
      this.store.set(locale, m);
    }
    return m;
  }

  get(hash: string, locale: string): string | null {
    return this.store.get(locale)?.get(hash) ?? null;
  }

  set(hash: string, locale: string, text: string): void {
    this.localeMap(locale).set(hash, text);
  }

  loadBundle(locale: string, translations: Record<string, string>): void {
    const map = this.localeMap(locale);
    for (const [hash, text] of Object.entries(translations)) {
      map.set(hash, text);
    }
    this.bundleLoaded.add(locale);
  }

  hasBundle(locale: string): boolean {
    return this.bundleLoaded.has(locale);
  }

  getAllForLocale(locale: string): Record<string, string> {
    const map = this.store.get(locale);
    if (!map) return {};
    return Object.fromEntries(map);
  }

  clear(locale?: string): void {
    if (locale) {
      this.store.delete(locale);
      this.bundleLoaded.delete(locale);
    } else {
      this.store.clear();
      this.bundleLoaded.clear();
    }
  }

  async loadFromPersistence(locale: string): Promise<boolean> {
    if (!this.persistence) return false;
    const data = await this.persistence.load(locale);
    if (!data) return false;
    this.loadBundle(locale, data);
    return true;
  }

  async saveToPersistence(locale: string): Promise<void> {
    if (!this.persistence) return;
    await this.persistence.save(locale, this.getAllForLocale(locale));
  }
}
