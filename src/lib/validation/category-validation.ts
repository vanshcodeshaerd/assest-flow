import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  code: z.string().trim().min(1, "Category code is required").max(20, "Category code must be less than 20 characters").toUpperCase(),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateCategorySchema = categorySchema.partial();

export type CategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export function validationErrors(error: z.ZodError) {
  return error.issues.map((err: any) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
