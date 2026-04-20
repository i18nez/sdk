import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nezProvider } from "../src/provider";
import { useLocale } from "../src/hooks/useLocale";

function mockBundle() {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    const match = url.match(/target_locale=([^&]+)/);
    const loc = match ? match[1] : "it";
    return Promise.resolve(
      new Response(
        JSON.stringify({ locale: loc, translations: {}, updatedAt: "now" }),
        { status: 200 },
      ),
    );
  }) as unknown as typeof fetch;
}

function wrapper(props: { children: ReactNode }) {
  return (
    <I18nezProvider apiKey="sk_test" defaultLocale="it">
      {props.children}
    </I18nezProvider>
  );
}

describe("useLocale", () => {
  beforeEach(() => {
    mockBundle();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useLocale())).toThrow(/I18nezProvider/);
  });

  it("returns locale, setLocale, availableLocales", async () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.locale).toBe("it");
    expect(typeof result.current.setLocale).toBe("function");
    await waitFor(() =>
      expect(result.current.availableLocales).toContain("it"),
    );
  });

  it("setLocale switches locale and updates availableLocales", async () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    await waitFor(() =>
      expect(result.current.availableLocales).toContain("it"),
    );
    act(() => result.current.setLocale("fr"));
    await waitFor(() => expect(result.current.locale).toBe("fr"));
    await waitFor(() =>
      expect(result.current.availableLocales).toEqual(
        expect.arrayContaining(["it", "fr"]),
      ),
    );
  });
});
