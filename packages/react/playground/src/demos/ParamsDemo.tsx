import { useState } from "react";
import { T, useTranslation } from "@i18nez/react";

export function ParamsDemo() {
  const { t } = useTranslation();
  const [name, setName] = useState("Dani");
  const [count, setCount] = useState(3);

  return (
    <div>
      <h2>Params interpolation</h2>
      <p className="hint">
        Replace <code>{"{name}"}</code> and <code>{"{count}"}</code> tokens in
        the translated string with runtime values.
      </p>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <label>
          Name:{" "}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: "0.3rem 0.5rem" }}
          />
        </label>
        <label>
          Count:{" "}
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: "5rem", padding: "0.3rem 0.5rem" }}
          />
        </label>
      </div>
      <ul>
        <li>
          <T params={{ name }}>{"Hi {name}"}</T>
        </li>
        <li>{t("You have {count} messages", { params: { count } })}</li>
      </ul>
    </div>
  );
}
