import { useContext } from "react";
import { I18nezContext, type I18nezContextValue } from "../context";

export function useTranslation(): I18nezContextValue {
  const ctx = useContext(I18nezContext);
  if (!ctx) {
    throw new Error(
      "useTranslation must be used within an <I18nezProvider>",
    );
  }
  return ctx;
}
