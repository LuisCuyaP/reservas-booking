export function normalizeHeaders(h: any = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(h)) {
    out[k.toLowerCase()] = h[k];
  }
  return out;
}
