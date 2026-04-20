import { useState } from "react";
import {
  I18nezProvider,
  LocaleSwitcher,
  TranslationBoundary,
} from "@i18nez/react";
import { StaticDemo } from "./demos/StaticDemo";
import { ParamsDemo } from "./demos/ParamsDemo";
import { DynamicDemo } from "./demos/DynamicDemo";
import { FallbackDemo } from "./demos/FallbackDemo";
import { LocaleSwitchDemo } from "./demos/LocaleSwitchDemo";
import { BoundaryDemo } from "./demos/BoundaryDemo";
import { PersistenceDemo } from "./demos/PersistenceDemo";
import { StatusDemo } from "./demos/StatusDemo";

const TABS = [
  { id: "static", label: "Static <T>", Component: StaticDemo },
  { id: "params", label: "Params", Component: ParamsDemo },
  { id: "dynamic", label: "Dynamic", Component: DynamicDemo },
  { id: "fallback", label: "Fallback", Component: FallbackDemo },
  { id: "switch", label: "Locale switch", Component: LocaleSwitchDemo },
  { id: "boundary", label: "Boundary", Component: BoundaryDemo },
  { id: "persist", label: "Persistence", Component: PersistenceDemo },
  { id: "status", label: "Status", Component: StatusDemo },
] as const;

export function App() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("static");
  const Current = TABS.find((t) => t.id === active)!.Component;

  return (
    <I18nezProvider
      apiKey="demo_key"
      apiUrl="https://mock.i18nez.test"
      defaultLocale="en"
    >
      <div className="shell">
        <header className="header">
          <h1>i18nez playground</h1>
          <LocaleSwitcher locales={["en", "it", "fr", "es", "de"]} />
        </header>
        <nav className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <section className="panel" role="tabpanel">
          <TranslationBoundary
            fallback={<p>Translation subsystem errored. See console.</p>}
          >
            <Current />
          </TranslationBoundary>
        </section>
      </div>
    </I18nezProvider>
  );
}
