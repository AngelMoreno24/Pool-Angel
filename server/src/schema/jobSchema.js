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
});
 
// For PUT /update/:jobId - every field optional, but still validated if present.
export const jobUpdateSchema = jobSchema.partial();