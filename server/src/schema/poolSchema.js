import { z } from "zod";

export const poolSchema = z.object({
  propertyId: z
    .string()
    .trim()
    .min(1, "Property is required"),
  type: z
    .string()
    .trim()
    .max(100, "Pool type is too long")
    .optional()
    .or(z.literal("")),
  size: z
    .string()
    .trim()
    .max(100, "Pool size is too long")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export const poolUpdateSchema = z.object({
  type: z
    .string()
    .trim()
    .max(100, "Pool type is too long")
    .optional()
    .or(z.literal("")),
  size: z
    .string()
    .trim()
    .max(100, "Pool size is too long")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes are too long")
    .optional()
    .or(z.literal("")),
});
