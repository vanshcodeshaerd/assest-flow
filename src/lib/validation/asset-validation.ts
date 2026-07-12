import { z } from "zod";

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  categoryId: z.string().uuid("Invalid category ID"),
  assetTag: z.string().trim().min(1, "Asset tag is required").max(50),
  serialNumber: z.string().trim().max(100).optional().nullable(),
  brand: z.string().trim().max(100).optional().nullable(),
  model: z.string().trim().max(100).optional().nullable(),
  manufacturer: z.string().trim().max(100).optional().nullable(),
  vendor: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  storageRoom: z.string().trim().max(100).optional().nullable(),
  assignedManager: z.string().uuid("Invalid manager ID").optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchaseCost: z.number().min(0).optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]).default("GOOD"),
  status: z.enum(["AVAILABLE", "ALLOCATED", "MAINTENANCE", "RESERVED", "DAMAGED", "LOST", "DISPOSED", "RETIRED", "ARCHIVED"]).default("AVAILABLE"),
});

export const updateAssetSchema = createAssetSchema.partial().omit({ assetTag: true });

export const allocateAssetSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  expectedReturn: z.string().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const returnAssetSchema = z.object({
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const transferAssetSchema = z.object({
  toEmployeeId: z.string().uuid("Invalid employee ID").optional().nullable(),
  toDepartmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  toLocation: z.string().trim().max(200).optional().nullable(),
  reason: z.string().trim().max(1000).optional().nullable(),
});

export const maintenanceSchema = z.object({
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "EMERGENCY", "WARRANTY_REPAIR"]).default("CORRECTIVE"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  vendor: z.string().trim().max(200).optional().nullable(),
  engineer: z.string().trim().max(200).optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  beforeCondition: z.string().optional().nullable(),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  cost: z.number().min(0).optional().nullable(),
  afterCondition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional().nullable(),
  description: z.string().trim().max(2000).optional(),
  vendor: z.string().trim().max(200).optional().nullable(),
  engineer: z.string().trim().max(200).optional().nullable(),
  completedDate: z.string().optional().nullable(),
});

export function validationErrors(error: z.ZodError) {
  return error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
}
