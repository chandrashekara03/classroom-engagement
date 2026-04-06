import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { adminDb } from "@/lib/firebaseAdmin";
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
        const paymentRef = adminDb.ref(`payments/${paymentId}`);
        const paymentSnapshot = await paymentRef.get();

        if (!paymentSnapshot.exists()) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }

        await paymentRef.update({
            status,
            verified_by: session.user.id,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        const updatedSnapshot = await paymentRef.get();
        const payment = updatedSnapshot.val();

        return NextResponse.json(payment, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Payment Verify PATCH error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}, ["admin"]);
