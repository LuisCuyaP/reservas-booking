import { json } from "../../shared/http";
import { DynamoBookingRepository } from "../../infrastructure/aws/dynamodb/dynamo-booking.repository";

const repo = new DynamoBookingRepository();

export const handler = async (event: any) => {
  try {
    const id = event?.pathParameters?.id;
    if (!id) return json(400, { error: "Missing path parameter 'id'" });

    const ok = await repo.cancel(id);
    if (!ok) return json(404, { error: "Booking not found" });

    // 204 sin body
    return { statusCode: 204, headers: { "Content-Type": "application/json" }, body: "" };
  } catch (err: any) {
    const msg = err?.message || "Internal error";
    if (/ConditionalCheckFailedException/i.test(msg)) {
      return json(409, { error: "Booking already canceled" });
    }
    return json(500, { error: msg });
  }
};
