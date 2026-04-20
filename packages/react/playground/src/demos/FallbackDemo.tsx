import { T } from "@i18nez/react";

export function FallbackDemo() {
  return (
    <div>
      <h2>Fallback rendering</h2>
      <p className="hint">
        The `fallback` prop renders while the provider is in{" "}
        <code>initializing</code> status. Switch locale to see the skeleton
        appear between bundle fetches.
      </p>
      <p>
        Without fallback:{" "}
        <T>Please wait while we load your content...</T>
      </p>
      <p>
        With fallback:{" "}
        <T
          fallback={
            <span
              style={{
                background: "#ddd",
                height: "1em",
                width: "12rem",
                display: "inline-block",
                borderRadius: "4px",
              }}
            />
          }
        >
          Please wait while we load your content...
        </T>
      </p>
    </div>
  );
}
