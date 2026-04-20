import type { ChangeEvent } from "react";
import { useMemo } from "react";
import { useTranslation } from "../hooks/useTranslation";

export interface LocaleSwitcherProps {
  display?: "native" | "english" | "code";
  locales?: string[];
  className?: string;
  onChange?: (locale: string) => void;
}

export function LocaleSwitcher(props: LocaleSwitcherProps) {
  const { display = "native", locales, className, onChange } = props;
  const { locale, setLocale, availableLocales } = useTranslation();

  const list = locales && locales.length > 0 ? locales : availableLocales;

  const labelFor = useMemo(() => {
    const cache = new Map<string, string>();
    return (loc: string) => {
      if (display === "code") return loc;
      const cached = cache.get(loc + display);
      if (cached) return cached;
      try {
        const dn = new Intl.DisplayNames(
          [display === "native" ? loc : "en"],
          { type: "language" },
        );
        const label = dn.of(loc) ?? loc;
        cache.set(loc + display, label);
        return label;
      } catch {
        return loc;
      }
    };
  }, [display]);

  const handle = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setLocale(next);
    onChange?.(next);
  };

  return (
    <select
      className={className}
      value={locale}
      onChange={handle}
      aria-label="locale"
    >
      {list.map((loc) => (
        <option key={loc} value={loc}>
          {labelFor(loc)}
        </option>
      ))}
    </select>
  );
}
