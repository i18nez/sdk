import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { I18nezProvider } from "../src/provider";
import { useTranslation } from "../src/hooks/useTranslation";

function Probe() {
  const { locale, status, t } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="status">{status}</span>
      <span data-testid="text">{t("Hello")}</span>
    </div>
  );
}

function mockFetchOnce(body: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  ) as unknown as typeof fetch;
}

describe("I18nezProvider", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes default locale and initializing status before bundle arrives", () => {
    globalThis.fetch = vi.fn(
      () => new Promise(() => {}),
    ) as unknown as typeof fetch;
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <Probe />
      </I18nezProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("it");
    expect(screen.getByTestId("status")).toHaveTextContent("initializing");
  });

  it("transitions to ready after bundle fetch succeeds", async () => {
    mockFetchOnce({
      locale: "it",
      translations: {},
      updatedAt: "2026-04-16T00:00:00Z",
    });
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <Probe />
      </I18nezProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );
  });

  it("renders translated text after bundle contains the hash", async () => {
    // SHA-256("Hello") = 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969
    mockFetchOnce({
      locale: "it",
      translations: {
        "185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969":
          "Ciao",
      },
      updatedAt: "now",
    });
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <Probe />
      </I18nezProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("text")).toHaveTextContent("Ciao"));
  });

  it("setLocale fetches a new bundle", async () => {
    const bundles: Record<string, unknown> = {
      it: {
        locale: "it",
        translations: {},
        updatedAt: "now",
      },
      fr: {
        locale: "fr",
        translations: {},
        updatedAt: "now",
      },
    };
    globalThis.fetch = vi.fn((url: string) => {
      const match = url.match(/target_locale=([^&]+)/);
      const loc = match ? match[1] : "it";
      return Promise.resolve(
        new Response(JSON.stringify(bundles[loc]), { status: 200 }),
      );
    }) as unknown as typeof fetch;

    function SwitcherProbe() {
      const { locale, setLocale, status } = useTranslation();
      return (
        <div>
          <span data-testid="locale">{locale}</span>
          <span data-testid="status">{status}</span>
          <button onClick={() => setLocale("fr")}>to fr</button>
        </div>
      );
    }

    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <SwitcherProbe />
      </I18nezProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("ready"),
    );

    act(() => {
      screen.getByRole("button").click();
    });
    await waitFor(() =>
      expect(screen.getByTestId("locale")).toHaveTextContent("fr"),
    );
  });
});
