import { useState } from "react";
import { useTranslation } from "@i18nez/react";

export function DynamicDemo() {
  const { t } = useTranslation();
  const [text, setText] = useState("I love pizza");

  return (
    <div>
      <h2>Dynamic translation</h2>
      <p className="hint">
        Text that is not part of the bundle. The SDK hashes it, enqueues to
        the mock `/translate/batch` endpoint, and re-renders when the
        translation returns. The mock returns <code>[LOCALE] text</code> for
        unknown sources so you can see the round-trip happen.
      </p>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          New source text:{" "}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: "60%", padding: "0.3rem 0.5rem" }}
          />
        </label>
      </div>
      <p>
        Translation: <strong>{t(text, { dynamic: true })}</strong>
      </p>
    </div>
  );
}
