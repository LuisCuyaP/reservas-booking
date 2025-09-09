import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "../../infrastructure/aws/config/clients";
import { json } from "../../shared/http";

export const handler = async (event: any) => {
  try {
    const id = event?.pathParameters?.id;
    if (!id) return json(400, { error: "Missing path parameter 'id'" });

    const res = await ddbDoc.send(new QueryCommand({
      TableName: process.env.TABLE_NAME!,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :g",
      ExpressionAttributeValues: { ":g": `BOOKING#${id}` },
      Limit: 1,
    }));

    if (!res.Items || res.Items.length === 0) {
      return json(404, { error: "Booking not found" });
    }

    return json(200, res.Items[0]);
  } catch (err: any) {
    return json(500, { error: err?.message || "Internal error" });
  }
};
