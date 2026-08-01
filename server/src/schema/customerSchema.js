import { z } from "zod";
 
// Single source of truth for what a valid customer looks like.
// Import this on the frontend (form validation) and backend (route validation)
// so the rules can never drift out of sync between the two.
export const customerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name is too long"),
 
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),
 
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
 
  // Optional field - allow empty string or a loosely-shaped phone number.
  // Adjust the regex if you want to enforce a stricter format (e.g. US-only).
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[\d\s()+-]{7,20}$/.test(val), {
      message: "Enter a valid phone number",
    }),
});
 
// For partial updates (e.g. PATCH), reuse the same rules but make every field optional.
export const customerUpdateSchema = customerSchema.partial();
 