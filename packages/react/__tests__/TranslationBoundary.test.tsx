import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TranslationBoundary } from "../src/components/TranslationBoundary";

function Boom(): never {
  throw new Error("boom");
}

describe("TranslationBoundary", () => {
  it("renders children when no error", () => {
    render(
      <TranslationBoundary>
        <span>ok</span>
      </TranslationBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders fallback node when child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <TranslationBoundary fallback={<span>fallback</span>}>
        <Boom />
      </TranslationBoundary>,
    );
    expect(screen.getByText("fallback")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("calls onError when child throws", () => {
    const onError = vi.fn();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <TranslationBoundary fallback={null} onError={onError}>
        <Boom />
      </TranslationBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    spy.mockRestore();
  });
});
