import { z } from "zod";

export const createPaymentSchema = z.object({
    amount: z.number().min(0, "Amount must be a positive number"),
    month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
    transactionId: z.string().min(1, "Transaction ID is required"),
});

export const updatePaymentStatusSchema = z.object({
    status: z.enum(["pending", "verified", "rejected"]),
});
