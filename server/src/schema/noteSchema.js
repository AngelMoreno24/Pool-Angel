import { z } from "zod";

export const noteSchema = z.object({
    body: z.string().trim().min(1, "Note text is required").max(5000),
    ownerOnly: z.boolean().optional().default(false),
    pinned: z.boolean().optional().default(false),
    customerId: z.string().uuid("Invalid customer").optional(),
    propertyId: z.string().uuid("Invalid property").optional(),
    visitId: z.string().uuid("Invalid visit").optional(),
}).refine(
    (data) => [data.customerId, data.propertyId, data.visitId].filter(Boolean).length === 1,
    { message: "A note must be attached to exactly one customer, property, or visit" }
);

export const noteUpdateSchema = z.object({
    body: z.string().trim().min(1, "Note text cannot be empty").max(5000).optional(),
    ownerOnly: z.boolean().optional(),
    pinned: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one note field must be provided",
});