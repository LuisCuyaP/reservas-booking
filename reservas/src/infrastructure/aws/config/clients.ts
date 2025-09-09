import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isOffline = process.env.IS_OFFLINE === "true";
const endpoint = process.env.AWS_ENDPOINT_URL || (isOffline ? "http://localhost:4566" : undefined);

const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint,
  credentials: endpoint
    ? { accessKeyId: "luis", secretAccessKey: "luis" } // credenciales dummy para LocalStack
    : undefined,
});

export const ddbDoc = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: { removeUndefinedValues: true },
});
