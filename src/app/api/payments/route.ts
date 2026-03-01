import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { createPaymentSchema } from "@/lib/validations/payment.schema";
import { z } from "zod";

export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const validatedData = createPaymentSchema.parse(body);

        const { data: payment, error } = await supabaseAdmin
            .from("payments")
            .insert({
                ...validatedData,
                // Using Postgres specific snake_case column names mapping vs MongoDB camelCase
                transaction_id: validatedData.transactionId,
                user_id: session.user.id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Postgres unique constraint violation
                return NextResponse.json({ error: "Transaction ID already exists" }, { status: 400 });
            }
            throw error;
        }

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

    let query = supabaseAdmin
        .from("payments")
        .select(`* /* , users(name, roomNumber) uncomment to join */`)
        .order("created_at", { ascending: false });

    if (monthFilter) {
        query = query.eq("month", monthFilter);
    }

    const { data: payments, error } = await query;

    if (error) {
        console.error("Payment GET error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(payments, { status: 200 });
}, ["admin"]);
