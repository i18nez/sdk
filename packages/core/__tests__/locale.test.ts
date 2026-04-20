import { describe, expect, it, afterEach } from "vitest";
import { detectLocale, isValidLocale, normalizeLocale } from "../src/locale";

describe("isValidLocale", () => {
  it.each([
    "en",
    "en-US",
    "zh-Hans",
    "zh-Hans-CN",
    "pt-BR",
    "sr-Latn-RS",
    "es-419",
    "EN-us",
  ])("accepts valid BCP-47: %s", (locale) => {
    expect(isValidLocale(locale)).toBe(true);
  });

  it.each(["", "123", "en_US", "en-"])(
    "rejects invalid: %s",
    (locale) => {
      expect(isValidLocale(locale)).toBe(false);
    },
  );
});

describe("normalizeLocale", () => {
  it("strips region by default", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("pt-BR")).toBe("pt");
  });

  it("preserves region when keepRegion=true", () => {
    expect(normalizeLocale("en-US", { keepRegion: true })).toBe("en-US");
  });

  it("preserves numeric region when keepRegion=true", () => {
    expect(normalizeLocale("es-419", { keepRegion: true })).toBe("es-419");
  });

  it("preserves script subtag", () => {
    expect(normalizeLocale("zh-Hans-CN")).toBe("zh-Hans");
    expect(normalizeLocale("zh-Hans-CN", { keepRegion: true })).toBe(
      "zh-Hans-CN",
    );
  });

  it("lowercases language subtag", () => {
    expect(normalizeLocale("EN-US")).toBe("en");
  });

  it("returns input unchanged for invalid input", () => {
    expect(normalizeLocale("")).toBe("");
    expect(normalizeLocale("not a locale")).toBe("not a locale");
  });
});

describe("detectLocale", () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    if (originalNavigator === undefined) {
      Reflect.deleteProperty(globalThis, "navigator");
    } else {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  });

  it("prefers navigator.languages[0] over navigator.language", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { language: "en-US", languages: ["fr-FR", "en-US"] },
      configurable: true,
    });
    expect(detectLocale("en")).toBe("fr-FR");
  });

  it("falls back to navigator.language when languages is missing", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { language: "fr-FR" },
      configurable: true,
    });
    expect(detectLocale("en")).toBe("fr-FR");
  });

  it("falls back when navigator.language is missing", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: {},
      configurable: true,
    });
    expect(detectLocale("en")).toBe("en");
  });

  it("falls back when navigator absent", () => {
    // @ts-expect-error removing navigator
    delete globalThis.navigator;
    expect(detectLocale("it")).toBe("it");
  });

  it("falls back when languages is empty and language empty", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { language: "", languages: [] },
      configurable: true,
    });
    expect(detectLocale("it")).toBe("it");
  });
});
