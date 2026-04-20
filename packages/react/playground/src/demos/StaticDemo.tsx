import { T, useTranslation } from "@i18nez/react";

export function StaticDemo() {
  const { t } = useTranslation();
  return (
    <div>
      <h2>Static translation</h2>
      <p className="hint">
        Uses `&lt;T&gt;` and the `t()` function with text that is seeded in the
        mock bundle. On first render the raw string shows; once the bundle
        arrives (should be instant in dev) the translation replaces it.
      </p>
      <ul>
        <li>
          <code>&lt;T&gt;Hello&lt;/T&gt;</code> → <strong><T>Hello</T></strong>
        </li>
        <li>
          <code>&lt;T&gt;Welcome&lt;/T&gt;</code> → <strong><T>Welcome</T></strong>
        </li>
        <li>
          <code>t("Add to cart")</code> → <strong>{t("Add to cart")}</strong>
        </li>
      </ul>
    </div>
  );
}
