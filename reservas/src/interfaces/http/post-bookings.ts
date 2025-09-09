// src/interfaces/http/post-bookings.ts
import { json, type ApiResult } from "../../shared/http";
import { sha256, newUuid } from "../../shared/crypto";
import { normalizeHeaders } from "../../shared/headers";
import { validateCreateBookingDto } from "../../application/booking/dtos/create-booking.dto";
import { DynamoBookingRepository } from "../../infrastructure/aws/dynamodb/dynamo-booking.repository";

const repo = new DynamoBookingRepository();

// Cache simple de idempotencia en memoria (solo para desarrollo/offline)
const idemStore = new Map<string, { hash: string; result: any }>();

export const handler = async (event: any): Promise<ApiResult> => {
  try {
    // event.body puede venir string o ya parseado según el emulador
    const bodyRaw = event?.body ?? "{}";
    const body = typeof bodyRaw === "string" ? JSON.parse(bodyRaw) : bodyRaw;

    // Valida DTO: roomId/userId/start/end (YYYY-MM-DD) y start < end
    validateCreateBookingDto(body);

    // Idempotencia
    const headers = normalizeHeaders(event?.headers);
    const idemKey = headers["idempotency-key"];
    const requestHash = sha256(JSON.stringify(body));
    if (idemKey) {
      const cached = idemStore.get(idemKey);
      if (cached) {
        if (cached.hash === requestHash) return json(201, cached.result);
        return json(429, { error: "Idempotency key conflict" });
      }
    }

    // Validación de solape (conflicto de horarios en misma sala)
    const conflict = await repo.hasOverlap(body.roomId, body.start, body.end);
    if (conflict) return json(409, { error: "Time range overlaps existing booking for this room" });

    // Persistencia (estado inicial PENDING)
    const bookingId = newUuid();
    const entity = {
      bookingId,
      roomId: body.roomId,
      userId: body.userId,
      start: body.start, // YYYY-MM-DD
      end: body.end,     // YYYY-MM-DD (fin exclusivo)
      note: body.note,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
    };

    await repo.savePending(entity);

    const result = { bookingId, status: "PENDING" as const };

    // Guarda resultado para idempotencia
    if (idemKey) idemStore.set(idemKey, { hash: requestHash, result });

    return json(201, result);
  } catch (err: any) {
    const msg = String(err?.message ?? err ?? "Bad Request");

    // Mapea errores comunes a códigos HTTP
    const code =
      msg.includes("Idempotency key conflict") ? 429 :
      msg.includes("before end") ? 422 :
      msg.includes("required") || msg.includes("format") || msg.includes("Invalid") ? 400 :
      400;

    return json(code, { error: msg });
  }
};
