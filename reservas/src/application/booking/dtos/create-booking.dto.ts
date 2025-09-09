export interface CreateBookingDto {
  roomId: string;
  userId: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  note?: string;
}

export function validateCreateBookingDto(input: any): asserts input is CreateBookingDto {
  if (!input || typeof input !== "object") throw new Error("Invalid body");

  const { roomId, userId, start, end, note } = input;

  if (!roomId || typeof roomId !== "string") throw new Error("roomId required");
  if (!userId || typeof userId !== "string") throw new Error("userId required");

  // Validar formato YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!start || !dateRegex.test(start)) throw new Error("start must be in format YYYY-MM-DD");
  if (!end   || !dateRegex.test(end)) throw new Error("end must be in format YYYY-MM-DD");

  // Validar que sean fechas válidas del calendario
  const startDate = new Date(start + "T00:00:00Z");
  const endDate = new Date(end + "T00:00:00Z");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid date values");
  }

  // Validar que start < end
  if (startDate >= endDate) throw new Error("start must be before end");

  // Nota opcional
  if (note && (typeof note !== "string" || note.length > 200)) {
    throw new Error("note too long");
  }
}
