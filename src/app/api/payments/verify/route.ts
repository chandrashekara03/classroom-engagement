import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { updatePaymentStatusSchema } from "@/lib/validations/payment.schema";
import { z } from "zod";

export const PATCH = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();

        // We assume the body also includes the payment ID to verify
        const { paymentId, status } = z.object({
            paymentId: z.string().min(1, "Payment ID is required"),
            status: updatePaymentStatusSchema.shape.status,
        }).parse(body);

        const { data: payment, error } = await supabaseAdmin
            .from("payments")
            .update({
                status,
                verified_by: session.user.id
            })
            .eq("id", paymentId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: "Payment not found" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(payment, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Payment Verify PATCH error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}, ["admin"]);
