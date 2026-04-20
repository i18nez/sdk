import { useState } from "react";
import type { PersistenceAdapter } from "@i18nez/core";
import { I18nezProvider, T, useLocale } from "@i18nez/react";

class MemoryAdapter implements PersistenceAdapter {
  private store = new Map<string, Record<string, string>>();
  writes: Array<{ locale: string; size: number }> = [];

  async load(locale: string) {
    const data = this.store.get(locale);
    return data ?? null;
  }

  async save(locale: string, data: Record<string, string>) {
    this.store.set(locale, data);
    this.writes.push({ locale, size: Object.keys(data).length });
  }
}

function Probe({ adapter }: { adapter: MemoryAdapter }) {
  const { locale, setLocale } = useLocale();
  const [tick, setTick] = useState(0);
  return (
    <div>
      <p>
        Current locale: <strong>{locale}</strong>{" "}
        <button className="action" onClick={() => setLocale(locale === "en" ? "it" : "en")}>
          Toggle en/it
        </button>{" "}
        <button className="action" onClick={() => setTick((n) => n + 1)}>
          Refresh adapter view
        </button>
      </p>
      <p>
        <T>Hello</T> · <T>Welcome</T>
      </p>
      <pre>
        {JSON.stringify(
          {
            writes: adapter.writes,
            localesPersisted: Array.from((adapter as unknown as { store: Map<string, unknown> }).store.keys()),
            tick,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}

export function PersistenceDemo() {
  const [adapter] = useState(() => new MemoryAdapter());
  return (
    <div>
      <h2>Custom PersistenceAdapter</h2>
      <p className="hint">
        A nested <code>&lt;I18nezProvider&gt;</code> with a custom in-memory
        adapter that logs every save. Plan C will add a real{" "}
        <code>LocalStorageAdapter</code>.
      </p>
      <I18nezProvider
        apiKey="demo_key"
        apiUrl="https://mock.i18nez.test"
        defaultLocale="en"
        persistence={adapter}
      >
        <Probe adapter={adapter} />
      </I18nezProvider>
    </div>
  );
}
