export type ApiResult = { statusCode: number; headers?: Record<string,string>; body: string }
export const json = (code:number, payload:any): ApiResult => ({ statusCode: code, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
