import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nezProvider } from "../src/provider";
import { LocaleSwitcher } from "../src/components/LocaleSwitcher";

function mockBundles() {
  globalThis.fetch = vi.fn((url: string) => {
    const match = url.match(/target_locale=([^&]+)/);
    const loc = match ? match[1] : "en";
    return Promise.resolve(
      new Response(
        JSON.stringify({ locale: loc, translations: {}, updatedAt: "now" }),
        { status: 200 },
      ),
    );
  }) as unknown as typeof fetch;
}

describe("LocaleSwitcher", () => {
  beforeEach(() => {
    mockBundles();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a select with options from explicit locales prop", async () => {
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="en">
        <LocaleSwitcher locales={["en", "it", "fr"]} />
      </I18nezProvider>,
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Italiano/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Français/i })).toBeInTheDocument();
  });

  it("display='code' renders code labels", () => {
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="en">
        <LocaleSwitcher locales={["en", "it"]} display="code" />
      </I18nezProvider>,
    );
    expect(screen.getByRole("option", { name: "en" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "it" })).toBeInTheDocument();
  });

  it("display='english' renders English names", () => {
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="en">
        <LocaleSwitcher locales={["it"]} display="english" />
      </I18nezProvider>,
    );
    expect(screen.getByRole("option", { name: /Italian/i })).toBeInTheDocument();
  });

  it("calls setLocale and onChange when user selects", async () => {
    const onChange = vi.fn();
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="en">
        <LocaleSwitcher locales={["en", "it"]} onChange={onChange} />
      </I18nezProvider>,
    );
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "it");
    expect(onChange).toHaveBeenCalledWith("it");
  });

  it("falls back to availableLocales when locales prop not given", async () => {
    render(
      <I18nezProvider apiKey="sk_test" defaultLocale="en">
        <LocaleSwitcher />
      </I18nezProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /English/i })).toBeInTheDocument(),
    );
  });
});
