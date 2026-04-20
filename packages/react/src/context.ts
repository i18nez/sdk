import { createContext } from "react";
import type { TranslateOptions, TranslationStatus } from "@i18nez/core";

export type TranslateFunction = (
  keyOrText: string,
  options?: TranslateOptions,
) => string;

export interface I18nezContextValue {
  t: TranslateFunction;
  locale: string;
  setLocale: (locale: string) => void;
  isLoading: boolean;
  status: TranslationStatus;
  availableLocales: string[];
}

export const I18nezContext = createContext<I18nezContextValue | null>(null);
I18nezContext.displayName = "I18nezContext";
