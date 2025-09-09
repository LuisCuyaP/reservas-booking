import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "../../infrastructure/aws/config/client";


export const handler = async (event: any) => {
  const body = JSON.parse(event.body);

  const bookingId = crypto.randomUUID();

  const item = {
    PK: `ROOM#${body.roomId}#DATE#${body.start.replace(/-/g, "")}`,
    SK: `BOOKING#${bookingId}`,
    GSI1PK: `BOOKING#${bookingId}`,
    bookingId,
    roomId: body.roomId,
    userId: body.userId,
    start: body.start,
    end: body.end,
    note: body.note,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  await ddbDoc.send(new PutCommand({
    TableName: process.env.TABLE_NAME!,
    Item: item,
  }));

  return {
    statusCode: 201,
    body: JSON.stringify({ bookingId, status: "PENDING" }),
  };
};
