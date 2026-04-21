import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { useTranslation } from "../hooks/useTranslation";

export type TAnimation = "fade" | "blur" | "slide" | "typewriter" | "none";

export interface TProps {
  children: string;
  k?: string;
  dynamic?: boolean;
  context?: string;
  fallback?: ReactNode;
  params?: Record<string, string | number>;
  animate?: TAnimation;
  duration?: number;
}

const STYLE_ID = "i18nez-t-animations";
const STYLE_CSS = `
@keyframes i18nez-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes i18nez-blur { from { opacity: 0; filter: blur(6px) } to { opacity: 1; filter: blur(0) } }
@keyframes i18nez-slide { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
.i18nez-t { display: inline-block }
.i18nez-t[data-anim="fade"] { animation: i18nez-fade var(--i18nez-dur, 220ms) ease both }
.i18nez-t[data-anim="blur"] { animation: i18nez-blur var(--i18nez-dur, 280ms) ease both }
.i18nez-t[data-anim="slide"] { animation: i18nez-slide var(--i18nez-dur, 240ms) ease both }
`;

function ensureStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = STYLE_CSS;
  document.head.appendChild(el);
}

export function T(props: TProps): ReactNode {
  const {
    children,
    context,
    fallback,
    params,
    dynamic,
    animate = "none",
    duration,
  } = props;
  const { t, status } = useTranslation();

  useEffect(() => { ensureStyles(); }, []);

  if (fallback && status === "initializing") {
    return fallback;
  }

  const result = t(children, { params, context, dynamic });
  if (animate === "none") return result;

  if (animate === "typewriter") {
    return (
      <Typewriter
        text={result}
        duration={duration ?? Math.min(1200, result.length * 25)}
      />
    );
  }

  const style = duration
    ? ({ "--i18nez-dur": `${duration}ms` } as CSSProperties)
    : undefined;

  return (
    <span key={result} className="i18nez-t" data-anim={animate} style={style}>
      {result}
    </span>
  );
}

function Typewriter({ text, duration }: { text: string; duration: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const step = Math.max(8, Math.floor(duration / Math.max(1, text.length)));
    let i = 0;
    el.textContent = "";
    const id = window.setInterval(() => {
      i += 1;
      el.textContent = text.slice(0, i);
      if (i >= text.length) window.clearInterval(id);
    }, step);
    return () => window.clearInterval(id);
  }, [text, duration]);
  return <span ref={ref} className="i18nez-t" />;
}
