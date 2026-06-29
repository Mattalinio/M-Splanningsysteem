import { z } from "zod";

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ongeldige tijd")
  .nullable()
  .optional();

const countField = z.coerce
  .number()
  .int("Gebruik hele getallen")
  .min(0, "Mag niet negatief zijn")
  .nullable()
  .optional();

export const shiftInputSchema = z.object({
  date: z.string().min(1, "Datum is verplicht"),
  type: z.enum(["DHL_OCHTEND", "DHL_OCHTEND_MIDDAG", "DHL_AVOND", "DRAGONFLY_MIDDAG"]),
  startTime: timeField,
  endTime: timeField,
  packages: countField,
  stops: countField,
});

export type ShiftInput = z.infer<typeof shiftInputSchema>;

/**
 * Normaliseert de payload per type: Dragonfly houdt alleen start/eind,
 * DHL alleen pakketten/stops. De rest wordt op null gezet.
 */
export function normalizeShift(input: ShiftInput) {
  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    return { error: "Ongeldige datum" as const };
  }

  if (input.type === "DRAGONFLY_MIDDAG") {
    return {
      data: {
        date,
        type: input.type,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        packages: null,
        stops: null,
      },
    };
  }

  // Alle DHL-varianten (DHL_OCHTEND, DHL_OCHTEND_MIDDAG, DHL_AVOND):
  // alleen pakketten/stops, geen start/eindtijd.
  return {
    data: {
      date,
      type: input.type,
      startTime: null,
      endTime: null,
      packages: input.packages ?? null,
      stops: input.stops ?? null,
    },
  };
}
