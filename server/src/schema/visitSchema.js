import { z } from "zod";
 
export const visitSchema = z.object({
  jobId: z.string().uuid("Invalid job"),
  assignedTechId: z.string().uuid("Invalid technician").optional(),
 
  scheduledDate: z.coerce.date({ errorMap: () => ({ message: "A valid scheduled date is required" }) }),
  scheduledTime: z.string().trim().optional(),
 
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "SKIPPED", "CANCELLED"]).optional(),
 
  notes: z.string().trim().optional(),
  serviceData: z.any().optional(),
  routeOrder: z.coerce.number().int().optional(),
});
 
// For PUT /update/:visitId - every field optional, but still validated if present.
export const visitUpdateSchema = visitSchema.partial();
