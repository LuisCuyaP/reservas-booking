import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "../config/clients";


const TABLE = process.env.TABLE_NAME!;

function toYYYYMMDD(d: string) {
  return d.replace(/-/g, "");
}

function* eachDateISO(startISO: string, endISO: string) {
  // Itera por días: [start, end)
  const start = new Date(startISO + "T00:00:00Z");
  const end = new Date(endISO + "T00:00:00Z");
  for (let dt = new Date(start); dt < end; dt.setUTCDate(dt.getUTCDate() + 1)) {
    yield dt.toISOString().slice(0, 10); // YYYY-MM-DD
  }
}

export class DynamoBookingRepository {
  async savePending(entity: {
    bookingId: string;
    roomId: string;
    userId: string;
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
    note?: string;
    status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELED";
    createdAt: string;
    confirmedAt?: string;
    rejectedAt?: string;
    rejectReason?: string;
  }): Promise<void> {
    const PK = `ROOM#${entity.roomId}#DATE#${toYYYYMMDD(entity.start)}`;
    const SK = `BOOKING#${entity.bookingId}`;
    const Item = {
      PK,
      SK,
      GSI1PK: `BOOKING#${entity.bookingId}`,
      ...entity,
    };
    await ddbDoc.send(new PutCommand({
      TableName: TABLE,
      Item,
    }));
  }

  async getById(bookingId: string) {
    const res = await ddbDoc.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :g",
      ExpressionAttributeValues: { ":g": `BOOKING#${bookingId}` },
      Limit: 1,
    }));
    return res.Items?.[0] ?? null;
  }

  async listByRoomDate(roomId: string, date: string) {
    const yyyyMMdd = toYYYYMMDD(date);
    const PK = `ROOM#${roomId}#DATE#${yyyyMMdd}`;
    const res = await ddbDoc.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": PK },
      ScanIndexForward: true, // asc por SK
    }));
    return res.Items ?? [];
  }

  async cancel(bookingId: string): Promise<boolean> {
    const current = await this.getById(bookingId);
    if (!current) return false;

    const yyyyMMdd = toYYYYMMDD(current.start);
    const PK = `ROOM#${current.roomId}#DATE#${yyyyMMdd}`;
    const SK = `BOOKING#${bookingId}`;

    const res = await ddbDoc.send(new UpdateCommand({
      TableName: TABLE,
      Key: { PK, SK },
      ConditionExpression: "attribute_exists(PK) AND #st <> :canceled",
      UpdateExpression: "SET #st = :canceled",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":canceled": "CANCELED" },
      ReturnValues: "ALL_NEW",
    }));

    return !!res.Attributes;
  }

  /**
   * Detecta solape de intervalos para una sala en el rango [start, end).
   * Regresa true si encuentra cualquier booking (no cancelado) que se cruce.
   */
  async hasOverlap(roomId: string, startISO: string, endISO: string): Promise<boolean> {
    // Si el rango cruza varios días, consultamos por cada día
    for (const iso of eachDateISO(startISO, endISO)) {
      const pk = `ROOM#${roomId}#DATE#${toYYYYMMDD(iso)}`;

      const res = await ddbDoc.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
      }));

      const items = res.Items ?? [];
      if (items.length === 0) continue;

      // Convertimos a milis para comparación; [start, end)
      const newStart = Date.parse(`${startISO}T00:00:00Z`);
      const newEnd   = Date.parse(`${endISO}T00:00:00Z`);

      const overlap = items.some((it: any) => {
        if (it.status === "CANCELED") return false;

        const si = Date.parse(`${it.start}T00:00:00Z`);
        const ei = Date.parse(`${it.end}T00:00:00Z`);

        // Regla de solape: [a,b) se cruza con [c,d) si a < d && c < b
        return newStart < ei && si < newEnd;
      });

      if (overlap) return true;
    }

    return false;
  }
}
