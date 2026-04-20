import { useState } from "react";
import { TranslationBoundary } from "@i18nez/react";

function Boom(): never {
  throw new Error("intentional demo error");
}

export function BoundaryDemo() {
  const [armed, setArmed] = useState(false);
  const [caught, setCaught] = useState<string | null>(null);

  return (
    <div>
      <h2>TranslationBoundary</h2>
      <p className="hint">
        Click <em>Arm</em> to trigger an in-render throw; the boundary catches
        it and renders the fallback. The parent-level boundary in{" "}
        <code>App.tsx</code> also exists but is invisible unless a global
        failure happens.
      </p>
      <button
        className="action"
        onClick={() => {
          setCaught(null);
          setArmed(true);
        }}
      >
        Arm explosion
      </button>
      {caught && (
        <p style={{ color: "tomato", marginTop: "1rem" }}>
          Caught: <strong>{caught}</strong>
        </p>
      )}
      <div style={{ marginTop: "1rem" }}>
        <TranslationBoundary
          fallback={<p>Boundary caught the throw and rendered this fallback.</p>}
          onError={(err) => {
            setCaught(err.message);
            setArmed(false);
          }}
        >
          {armed ? <Boom /> : <p>Boundary is idle.</p>}
        </TranslationBoundary>
      </div>
    </div>
  );
}
