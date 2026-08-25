import { z } from "zod";
 
export const jobSchema = z.object({
  customerId: z.string().uuid("Invalid customer"),
  propertyId: z.string().uuid("Invalid property"),
  poolId: z.string().uuid("Invalid pool").optional(),
 
  title: z.string().trim().min(1, "Title is required").max(100, "Title is too long"),
  jobType: z
    .enum(["RECURRING_CLEANING", "ONE_TIME_SERVICE", "REPAIR", "CHEMICAL_BALANCE"])
    .default("RECURRING_CLEANING"),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "ONE_TIME"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).optional(),
 
  defaultTechId: z.string().uuid("Invalid technician").optional(),
 
  startDate: z.coerce.date({ errorMap: () => ({ message: "A valid start date is required" }) }),
  endDate: z.coerce.date().optional(),
 
  price: z.coerce.number().nonnegative("Price can't be negative").optional(),
  notes: z.string().trim().optional(),
 
  // Which weekday this recurring job's route stop belongs to - 0 (Sun)
  // through 6 (Sat), matching JS's Date.getDay(). This is what makes
  // routeOrder per-day rather than one global order.
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
 
  // Where this job sits within its default tech's route for its dayOfWeek -
  // set via the route reordering UI, not typically on initial create.
  routeOrder: z.coerce.number().int().optional(),
});
 
// For PUT /update/:jobId - every field optional, but still validated if present.
export const jobUpdateSchema = jobSchema.partial();