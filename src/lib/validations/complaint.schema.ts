import { z } from "zod";

export const createComplaintSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100),
    description: z.string().min(10, "Description is too short").max(1000),
    category: z.enum(["maintenance", "security", "cleaning", "other"]),
});

export const updateComplaintStatusSchema = z.object({
    status: z.enum(["pending", "in-progress", "resolved"]),
});
