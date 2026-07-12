import { z } from "zod";

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  phone: z.string().trim().max(20).optional(),
  departmentId: z.string().uuid("Invalid department ID").nullable().optional(),
});

export const promoteSchema = z.object({
  newRole: z.enum(["EMPLOYEE", "MANAGER", "HR", "ADMIN"]),
});

export const statusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type PromoteInput = z.infer<typeof promoteSchema>;
export type StatusInput = z.infer<typeof statusSchema>;

export function validationErrors(error: z.ZodError) {
  return error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
