import { useTranslation } from "@i18nez/react";

export function StatusDemo() {
  const { status, isLoading, locale } = useTranslation();
  return (
    <div>
      <h2>Provider status</h2>
      <p className="hint">
        Raw values exposed by the provider. Flip locales from the header to
        watch <code>status</code> cycle through <code>initializing</code> →{" "}
        <code>ready</code>.
      </p>
      <pre>
        {JSON.stringify({ locale, status, isLoading }, null, 2)}
      </pre>
    </div>
  );
}
