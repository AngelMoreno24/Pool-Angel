import { z } from "zod";

export const propertySchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(200, "Address is too long"),
  city: z
    .string()
    .trim()
    .max(100, "City is too long")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .trim()
    .max(100, "State is too long")
    .optional()
    .or(z.literal("")),
  zip: z
    .string()
    .trim()
    .max(20, "ZIP code is too long")
    .optional()
    .or(z.literal("")),
  poolType: z
    .string()
    .trim()
    .max(100, "Pool type is too long")
    .optional()
    .or(z.literal("")),
});
