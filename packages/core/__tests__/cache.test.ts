import { describe, expect, it, vi } from "vitest";
import { TranslationCache } from "../src/cache";
import type { PersistenceAdapter } from "../src/types";

describe("TranslationCache", () => {
  it("get returns null when miss", () => {
    const cache = new TranslationCache();
    expect(cache.get("hash1", "it")).toBeNull();
  });

  it("set then get returns value", () => {
    const cache = new TranslationCache();
    cache.set("hash1", "it", "Ciao");
    expect(cache.get("hash1", "it")).toBe("Ciao");
  });

  it("keeps separate entries per locale", () => {
    const cache = new TranslationCache();
    cache.set("h1", "it", "Ciao");
    cache.set("h1", "fr", "Bonjour");
    expect(cache.get("h1", "it")).toBe("Ciao");
    expect(cache.get("h1", "fr")).toBe("Bonjour");
  });

  it("loadBundle bulk loads translations", () => {
    const cache = new TranslationCache();
    cache.loadBundle("it", { h1: "Ciao", h2: "Grazie" });
    expect(cache.get("h1", "it")).toBe("Ciao");
    expect(cache.get("h2", "it")).toBe("Grazie");
    expect(cache.hasBundle("it")).toBe(true);
  });

  it("hasBundle is false before loading", () => {
    const cache = new TranslationCache();
    expect(cache.hasBundle("it")).toBe(false);
  });

  it("getAllForLocale returns full map", () => {
    const cache = new TranslationCache();
    cache.loadBundle("it", { h1: "Ciao" });
    cache.set("h2", "it", "Grazie");
    expect(cache.getAllForLocale("it")).toEqual({ h1: "Ciao", h2: "Grazie" });
  });

  it("getAllForLocale returns empty object for unknown locale", () => {
    const cache = new TranslationCache();
    expect(cache.getAllForLocale("xx")).toEqual({});
  });

  it("clear(locale) removes that locale only", () => {
    const cache = new TranslationCache();
    cache.loadBundle("it", { h1: "Ciao" });
    cache.loadBundle("fr", { h1: "Bonjour" });
    cache.clear("it");
    expect(cache.get("h1", "it")).toBeNull();
    expect(cache.get("h1", "fr")).toBe("Bonjour");
  });

  it("clear() without arg removes everything", () => {
    const cache = new TranslationCache();
    cache.loadBundle("it", { h1: "Ciao" });
    cache.clear();
    expect(cache.hasBundle("it")).toBe(false);
  });

  it("loadFromPersistence populates cache from adapter", async () => {
    const adapter: PersistenceAdapter = {
      load: vi.fn().mockResolvedValue({ h1: "Ciao" }),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const cache = new TranslationCache(adapter);
    const loaded = await cache.loadFromPersistence("it");
    expect(loaded).toBe(true);
    expect(cache.get("h1", "it")).toBe("Ciao");
    expect(adapter.load).toHaveBeenCalledWith("it");
  });

  it("loadFromPersistence returns false when adapter returns null", async () => {
    const adapter: PersistenceAdapter = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };
    const cache = new TranslationCache(adapter);
    expect(await cache.loadFromPersistence("it")).toBe(false);
  });

  it("loadFromPersistence returns false when no adapter", async () => {
    const cache = new TranslationCache();
    expect(await cache.loadFromPersistence("it")).toBe(false);
  });

  it("saveToPersistence writes current locale data via adapter", async () => {
    const saved: Record<string, Record<string, string>> = {};
    const adapter: PersistenceAdapter = {
      load: vi.fn(),
      save: vi.fn(async (locale, data) => {
        saved[locale] = data;
      }),
    };
    const cache = new TranslationCache(adapter);
    cache.set("h1", "it", "Ciao");
    await cache.saveToPersistence("it");
    expect(saved.it).toEqual({ h1: "Ciao" });
  });

  it("saveToPersistence is no-op when no adapter", async () => {
    const cache = new TranslationCache();
    await expect(cache.saveToPersistence("it")).resolves.toBeUndefined();
  });
});
