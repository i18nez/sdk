import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nezProvider } from "../src/provider";
import { useTranslation } from "../src/hooks/useTranslation";

function mockBundle(translations: Record<string, string>) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        locale: "it",
        translations,
        updatedAt: "now",
      }),
      { status: 200 },
    ),
  ) as unknown as typeof fetch;
}

function wrapper(props: { children: ReactNode }) {
  return (
    <I18nezProvider apiKey="sk_test" defaultLocale="it">
      {props.children}
    </I18nezProvider>
  );
}

describe("useTranslation", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useTranslation())).toThrow(
      /I18nezProvider/,
    );
  });

  it("returns t, locale, setLocale, isLoading, status", () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(typeof result.current.t).toBe("function");
    expect(result.current.locale).toBe("it");
    expect(typeof result.current.setLocale).toBe("function");
    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBe("initializing");
  });

  it("interpolates {param} tokens in translated text", async () => {
    // SHA-256 hash for the source string below — computed at runtime by the test
    // We rely on the hash library to compute this; the bundle response here uses
    // a placeholder and we replace it with the real hash at setup time.
    const source = "Hello, {name}!";
    const { hashText } = await import("@i18nez/core");
    const hash = await hashText(source);

    mockBundle({ [hash]: "Ciao, {name}!" });

    function Probe() {
      const { t, status } = useTranslation();
      if (status !== "ready") return <span data-testid="out">loading</span>;
      return (
        <span data-testid="out">
          {t(source, { params: { name: "Dani" } })}
        </span>
      );
    }
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <Probe />
      </I18nezProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("out")).toHaveTextContent("Ciao, Dani!"),
    );
  });
});
