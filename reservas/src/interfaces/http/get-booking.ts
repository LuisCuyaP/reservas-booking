type APIGatewayProxyResult = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  try {
    const id = event?.pathParameters?.id;
    if (!id) {
      return resp(400, { error: "Missing path parameter 'id'" });
    }

    // --- MOCK DE RESPUESTA ---
    // Simula un booking en estado PENDING (sin DB aún).
    // Si quieres un "not found" rápido, devuelve 404 cuando id === "notfound".
    if (id === "notfound") {
      return resp(404, { error: "Booking not found" });
    }

    const mock = {
      bookingId: id,
      roomId: "R-101",
      userId: "U-555",
      start: "2025-09-08T10:00:00Z",
      end: "2025-09-08T11:00:00Z",
      note: "Reserva mock para pruebas",
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    return resp(200, mock);
  } catch (err: any) {
    return resp(500, { error: err?.message || "Internal error" });
  }
};

function resp(code: number, payload: any): APIGatewayProxyResult {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}
