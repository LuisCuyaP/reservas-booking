export type ApiResult = { statusCode: number; headers?: Record<string, string>; body: string };

export function json(statusCode: number, payload: any): ApiResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}
