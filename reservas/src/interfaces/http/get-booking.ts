import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "../../infrastructure/aws/config/client";


export const handler = async (event: any) => {
  const id = event.pathParameters?.id;

  const res = await ddbDoc.send(new QueryCommand({
    TableName: process.env.TABLE_NAME!,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :g",
    ExpressionAttributeValues: { ":g": `BOOKING#${id}` },
    Limit: 1,
  }));

  if (!res.Items || res.Items.length === 0) {
    return { statusCode: 404, body: JSON.stringify({ error: "Booking not found" }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(res.Items[0]),
  };
};
