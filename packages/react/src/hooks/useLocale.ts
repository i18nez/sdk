import { useContext } from "react";
import { I18nezContext } from "../context";

export function useLocale(): {
  locale: string;
  setLocale: (locale: string) => void;
  availableLocales: string[];
} {
  const ctx = useContext(I18nezContext);
  if (!ctx) {
    throw new Error("useLocale must be used within an <I18nezProvider>");
  }
  return {
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    availableLocales: ctx.availableLocales,
  };
}
