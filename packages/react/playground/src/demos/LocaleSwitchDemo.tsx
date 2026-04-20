import { LocaleSwitcher, useLocale, useTranslation } from "@i18nez/react";

export function LocaleSwitchDemo() {
  const { locale, setLocale, availableLocales } = useLocale();
  const { status } = useTranslation();

  return (
    <div>
      <h2>Locale switching</h2>
      <p className="hint">
        Two ways: the <code>&lt;LocaleSwitcher&gt;</code> component below, or
        the programmatic <code>setLocale()</code> from <code>useLocale()</code>.
      </p>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div>
          <strong>Current:</strong> {locale} (status: {status})
          <br />
          <strong>Available:</strong>{" "}
          {availableLocales.length > 0 ? availableLocales.join(", ") : "(none yet)"}
        </div>
        <div>
          <LocaleSwitcher
            locales={["en", "it", "fr", "es", "de"]}
            display="native"
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["en", "it", "fr", "es", "de"].map((l) => (
            <button
              key={l}
              className="action"
              onClick={() => setLocale(l)}
              disabled={l === locale}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
