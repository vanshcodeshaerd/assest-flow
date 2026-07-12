import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(100, "Department name must be less than 100 characters"),
  code: z.string().trim().min(1, "Department code is required").max(20, "Department code must be less than 20 characters").toUpperCase(),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
  headId: z.string().uuid("Invalid head ID").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateDepartmentSchema = departmentSchema.partial();

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export function validationErrors(error: z.ZodError) {
  return error.issues.map((err: any) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
