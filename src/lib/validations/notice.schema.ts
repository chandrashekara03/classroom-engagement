import { z } from "zod";

export const createNoticeSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200),
    content: z.string().min(10, "Content must be at least 10 characters"),
    isImportant: z.boolean().optional(),
});
