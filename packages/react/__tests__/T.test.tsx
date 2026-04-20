import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { hashText } from "@i18nez/core";
import { I18nezProvider } from "../src/provider";
import { T } from "../src/components/T";

function mockBundleFn(translations: Record<string, string>) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({ locale: "it", translations, updatedAt: "now" }),
      { status: 200 },
    ),
  ) as unknown as typeof fetch;
}

describe("T", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders original text before translation arrives", () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <T>Welcome</T>
      </I18nezProvider>,
    );
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  it("renders translated text when cache resolves", async () => {
    const hash = await hashText("Welcome");
    mockBundleFn({ [hash]: "Benvenuto" });
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <T>Welcome</T>
      </I18nezProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("Benvenuto")).toBeInTheDocument(),
    );
  });

  it("renders fallback node while loading when fallback prop provided", () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <T fallback={<span data-testid="skeleton">...</span>}>Long text</T>
      </I18nezProvider>,
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("supports params interpolation", async () => {
    const source = "Hi {name}";
    const hash = await hashText(source);
    mockBundleFn({ [hash]: "Ciao {name}" });
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="it">
        <T params={{ name: "Dani" }}>{source}</T>
      </I18nezProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("Ciao Dani")).toBeInTheDocument(),
    );
  });
});
