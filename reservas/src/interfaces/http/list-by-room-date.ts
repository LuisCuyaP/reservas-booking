import { json } from "../../shared/http";
import { DynamoBookingRepository } from "../../infrastructure/aws/dynamodb/dynamo-booking.repository";

const repo = new DynamoBookingRepository();
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const handler = async (event: any) => {
  try {
    const roomId = event?.pathParameters?.roomId;
    const dateRaw = event?.queryStringParameters?.date;
    const date = typeof dateRaw === "string" ? dateRaw.trim() : dateRaw;

    if (!roomId) return json(400, { error: "roomId is required in path" });
    if (!date || !dateRegex.test(date)) return json(400, { error: "date must be YYYY-MM-DD" });

    const items = await repo.listByRoomDate(roomId, date);
    return json(200, items);
  } catch (err: any) {
    return json(500, { error: err?.message || "Internal error" });
  }
};
