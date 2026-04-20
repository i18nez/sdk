const cache = new Map<string, string>();

export async function hashText(text: string): Promise<string> {
  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  cache.set(text, hex);
  return hex;
}

export function hashTextSync(text: string): string | null {
  return cache.get(text) ?? null;
}

export function clearHashCache(): void {
  cache.clear();
}
