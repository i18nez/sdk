import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type I18nezClient,
  type PersistenceAdapter,
  type TranslationStatus,
  TranslationCache,
  TranslationQueue,
  createClient,
  hashText,
  hashTextSync,
} from "@i18nez/core";
import {
  I18nezContext,
  type I18nezContextValue,
  type TranslateFunction,
} from "./context";

export interface I18nezProviderProps {
  apiKey: string;
  defaultLocale: string;
  fallbackLocale?: string;
  apiUrl?: string;
  preloadLocales?: string[];
  context?: string;
  tone?: string;
  persistence?: PersistenceAdapter;
  batchInterval?: number;
  batchSize?: number;
  children: ReactNode;
}

export function I18nezProvider(props: I18nezProviderProps) {
  const {
    apiKey,
    defaultLocale,
    fallbackLocale,
    apiUrl,
    preloadLocales,
    context: globalContext,
    persistence,
    batchInterval = 50,
    batchSize = 10,
    children,
  } = props;

  const clientRef = useRef<I18nezClient | null>(null);
  const cacheRef = useRef<TranslationCache | null>(null);
  const queueRef = useRef<TranslationQueue | null>(null);

  if (!clientRef.current) {
    clientRef.current = createClient({
      apiKey,
      apiUrl,
      defaultLocale,
      context: globalContext,
    });
    cacheRef.current = new TranslationCache(persistence);
    queueRef.current = new TranslationQueue(
      clientRef.current,
      cacheRef.current,
      { batchInterval, batchSize, sourceLocale: defaultLocale },
    );
  }

  const [locale, setLocaleState] = useState(defaultLocale);
  const [status, setStatus] = useState<TranslationStatus>("initializing");
  const [renderTick, setRenderTick] = useState(0);
  const availableLocalesRef = useRef<Set<string>>(new Set());

  const bump = useCallback(() => {
    setRenderTick((n) => n + 1);
  }, []);

  const loadLocale = useCallback(
    async (target: string) => {
      const cache = cacheRef.current;
      const client = clientRef.current;
      if (!cache || !client) return;

      let hadLocal = false;
      if (persistence) {
        hadLocal = await cache.loadFromPersistence(target);
        if (hadLocal) {
          availableLocalesRef.current.add(target);
          setStatus("ready");
          bump();
        }
      }

      try {
        const bundle = await client.getBundle(target);
        cache.loadBundle(target, bundle.translations);
        if (persistence) {
          await cache.saveToPersistence(target);
        }
        availableLocalesRef.current.add(target);
        setStatus("ready");
        bump();
      } catch (err) {
        if (!hadLocal) setStatus("error");
      }
    },
    [persistence, bump],
  );

  useEffect(() => {
    void loadLocale(locale);
    if (preloadLocales) {
      for (const loc of preloadLocales) {
        if (loc !== locale) void loadLocale(loc);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const setLocale = useCallback(
    (next: string) => {
      setLocaleState(next);
      setStatus(cacheRef.current?.hasBundle(next) ? "ready" : "initializing");
      void loadLocale(next);
    },
    [loadLocale],
  );

  const interpolate = useCallback(
    (text: string, params?: Record<string, string | number>) => {
      if (!params) return text;
      return text.replace(/\{(\w+)\}/g, (_, k) =>
        params[k] !== undefined ? String(params[k]) : `{${k}}`,
      );
    },
    [],
  );

  const t = useCallback<TranslateFunction>(
    (keyOrText, options) => {
      const cache = cacheRef.current;
      const queue = queueRef.current;
      if (!cache || !queue) return keyOrText;

      const source = keyOrText;
      const fallback = options?.default ?? source;
      const activeLocale = locale;
      const fallbackActive = fallbackLocale ?? defaultLocale;

      if (activeLocale === defaultLocale) {
        return interpolate(source, options?.params);
      }

      const bundleReady = cache.hasBundle(activeLocale);

      const syncHash = hashTextSync(source);
      if (syncHash) {
        const activeHit = cache.get(syncHash, activeLocale);
        if (activeHit) return interpolate(activeHit, options?.params);
        const fallbackHit =
          activeLocale !== fallbackActive
            ? cache.get(syncHash, fallbackActive)
            : null;
        if (!bundleReady) {
          return interpolate(fallbackHit ?? fallback, options?.params);
        }
        void queue
          .enqueue(source, syncHash, activeLocale, options?.context, options?.dynamic)
          .then(bump)
          .catch(() => {});
        return interpolate(fallbackHit ?? fallback, options?.params);
      }

      void hashText(source).then((h) => {
        const activeHit = cache.get(h, activeLocale);
        if (activeHit) {
          bump();
          return;
        }
        if (!cache.hasBundle(activeLocale)) {
          bump();
          return;
        }
        queue
          .enqueue(source, h, activeLocale, options?.context, options?.dynamic)
          .then(bump)
          .catch(() => {});
      });

      return interpolate(fallback, options?.params);
    },
    [locale, fallbackLocale, defaultLocale, interpolate, bump],
  );

  const value = useMemo<I18nezContextValue>(
    () => ({
      t,
      locale,
      setLocale,
      isLoading: status === "initializing" || status === "translating",
      status,
      availableLocales: Array.from(availableLocalesRef.current),
    }),
    [t, locale, setLocale, status, renderTick],
  );

  return <I18nezContext.Provider value={value}>{children}</I18nezContext.Provider>;
}
