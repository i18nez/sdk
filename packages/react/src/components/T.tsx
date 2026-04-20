import type { ReactNode } from "react";
import { useTranslation } from "../hooks/useTranslation";

export interface TProps {
  children: string;
  k?: string;
  dynamic?: boolean;
  context?: string;
  fallback?: ReactNode;
  params?: Record<string, string | number>;
}

export function T(props: TProps): ReactNode {
  const { children, context, fallback, params, dynamic } = props;
  const { t, status } = useTranslation();

  if (fallback && status === "initializing") {
    return fallback;
  }

  const result = t(children, { params, context, dynamic });
  return result;
}
