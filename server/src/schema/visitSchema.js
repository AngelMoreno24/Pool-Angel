import { z } from "zod";
 
export const visitSchema = z.object({
  jobId: z.string().uuid("Invalid job"),
  assignedTechId: z.string().uuid("Invalid technician").optional(),
 
  scheduledDate: z.coerce.date({ errorMap: () => ({ message: "A valid scheduled date is required" }) }),
  scheduledTime: z.string().trim().optional(),
 
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "SKIPPED", "CANCELLED"]).optional(),
 
  notes: z.string().trim().optional(),
  serviceData: z.record(z.string(), z.unknown()).optional(),
  routeOrder: z.coerce.number().int().optional(),
});

export const visitCompleteSchema = z.object({
  notes: z.string().trim().optional(),
  readings: z.object({
    chlorine: z.coerce.number().min(0).max(20).optional(),
    ph: z.coerce.number().min(0).max(14).optional(),
    alkalinity: z.coerce.number().min(0).max(500).optional(),
    waterTemperature: z.coerce.number().min(0).max(150).optional(),
  }).partial().default({}),
});

export const visitSkipSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export const visitRescheduleSchema = z.object({
  scheduledDate: z.coerce.date({ errorMap: () => ({ message: "A valid scheduled date is required" }) }),
  scheduledTime: z.string().trim().optional(),
  assignedTechId: z.string().uuid("Invalid technician").optional(),
});

export const generateVisitsSchema = z.object({
  from: z.coerce.date({ errorMap: () => ({ message: "A valid start date is required" }) }),
  through: z.coerce.date({ errorMap: () => ({ message: "A valid end date is required" }) }),
}).refine(({ from, through }) => through >= from, {
  message: "The end date must be on or after the start date",
  path: ["through"],
});
 
// For PUT /update/:visitId - every field optional, but still validated if present.
export const visitUpdateSchema = visitSchema.partial();
