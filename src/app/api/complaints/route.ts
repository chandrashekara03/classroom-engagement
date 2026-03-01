import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { createComplaintSchema } from "@/lib/validations/complaint.schema";
import { z } from "zod";

// POST: Create a new complaint (Accessible by Residents & Admins)
export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const validatedData = createComplaintSchema.parse(body);

        const { data: complaint, error } = await supabaseAdmin
            .from("complaints")
            .insert({
                ...validatedData,
                user_id: session.user.id,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(complaint, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Complaint POST error", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
});

// GET: Fetch complaints
// If Admin -> Returns all complaints
// If Resident -> Returns only their own complaints
export const GET = withAuth(async (req, ctx, session) => {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Adjust "users" relationship if you have a different table name for auth/users
    let query = supabaseAdmin
        .from("complaints")
        .select(`* /* , users(name, email, roomNumber) uncomment to join */`)
        .order("created_at", { ascending: false });

    if (session.user.role !== "admin") {
        query = query.eq("user_id", session.user.id);
    }
    if (statusFilter) {
        query = query.eq("status", statusFilter);
    }

    const { data: complaints, error } = await query;

    if (error) {
        console.error("Complaints GET error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(complaints, { status: 200 });
});
