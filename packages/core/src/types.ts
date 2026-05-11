export interface I18nezCoreConfig {
  apiKey: string;
  apiUrl?: string;
  defaultLocale: string;
  sourceLocale?: string;
  context?: string;
  tone?: string;
  batchInterval?: number;
  batchSize?: number;
  retries?: number;
  timeout?: number;
  // App bundle ID (iOS bundle ID / Android package name). Sent as
  // `X-Client-Bundle` header so the API can enforce the per-key bundle
  // allowlist on mobile (React Native, etc.) where there's no Origin header.
  clientBundle?: string;
}

export interface TranslateOptions {
  dynamic?: boolean;
  context?: string;
  params?: Record<string, string | number>;
  default?: string;
}

export interface TranslationResult {
  text: string;
  source: string;
  cached: boolean;
}

export interface BundleResult {
  locale: string;
  translations: Record<string, string>;
  updatedAt: string;
}

export type TranslationStatus =
  | "initializing"
  | "ready"
  | "translating"
  | "error"
  | "offline"
  | "quota_exceeded";

export interface PersistenceAdapter {
  load(locale: string): Promise<Record<string, string> | null>;
  save(locale: string, data: Record<string, string>): Promise<void>;
}

export class QuotaExceededError extends Error {
  constructor(message = "Quota exceeded") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export class RateLimitedError extends Error {
  retryAfter: number;
  constructor(retryAfter: number, message = "Rate limited") {
    super(message);
    this.name = "RateLimitedError";
    this.retryAfter = retryAfter;
  }
}

export class InvalidApiKeyError extends Error {
  constructor(message = "Invalid API key") {
    super(message);
    this.name = "InvalidApiKeyError";
  }
}
