import { json } from "../../shared/http";
import { sha256, newUuid } from "../../shared/crypto";
import { normalizeHeaders } from "../../shared/headers";
import { validateCreateBookingDto } from "../../application/booking/dtos/create-booking.dto";

// Cache en memoria para Idempotency
const idemStore = new Map<string, { hash: string; result: any }>();

export const handler = async (event: any) => {
  try {
    const body = JSON.parse(event?.body ?? "{}");
    validateCreateBookingDto(body);

    const headers = normalizeHeaders(event?.headers);
    const idemKey = headers["idempotency-key"];
    const requestHash = sha256(JSON.stringify(body));

    if (idemKey) {
      const cached = idemStore.get(idemKey);
      if (cached) {
        if (cached.hash === requestHash) {
          return json(201, cached.result);
        }
        return json(429, { error: "Idempotency key conflict" });
      }
    }

    const bookingId = newUuid();
    const result = { bookingId, status: "PENDING" };

    console.log("Event: BookingValidationRequested", { bookingId, ...body });

    if (idemKey) idemStore.set(idemKey, { hash: requestHash, result });

    return json(201, result);
  } catch (err: any) {
    return json(400, { error: err?.message || "Bad Request" });
  }
};
