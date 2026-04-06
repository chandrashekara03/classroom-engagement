import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { createPaymentSchema } from "@/lib/validations/payment.schema";
import { z } from "zod";

export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const validatedData = createPaymentSchema.parse(body);
        const paymentsRef = adminDb.ref("payments");
        const snapshot = await paymentsRef.get();
        const existingPayments = snapshot.exists() ? Object.values(snapshot.val()) as Record<string, unknown>[] : [];
        const isDuplicateTransaction = existingPayments.some(
            (payment) => payment.transaction_id === validatedData.transactionId
        );

        if (isDuplicateTransaction) {
            return NextResponse.json({ error: "Transaction ID already exists" }, { status: 400 });
        }

        const paymentRef = paymentsRef.push();
        const now = new Date().toISOString();
        const payment = {
            id: paymentRef.key,
            amount: validatedData.amount,
            month: validatedData.month,
            transactionId: validatedData.transactionId,
            transaction_id: validatedData.transactionId,
            user_id: session.user.id,
            status: "pending",
            created_at: now,
            updated_at: now,
            verified_by: null,
        };

        await paymentRef.set(payment);

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Payment POST error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

// Admin fetching monthly reports
export const GET = withAuth(async (req, ctx, session) => {
    const { searchParams } = new URL(req.url);
    const monthFilter = searchParams.get("month"); // Format: YYYY-MM

    try {
        const snapshot = await adminDb.ref("payments").get();
        let payments = snapshot.exists() ? Object.values(snapshot.val()) as Record<string, unknown>[] : [];
        if (monthFilter) {
            payments = payments.filter((payment) => payment.month === monthFilter);
        }
        payments.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        return NextResponse.json(payments, { status: 200 });
    } catch (error) {
        console.error("Payment GET error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}, ["admin"]);
