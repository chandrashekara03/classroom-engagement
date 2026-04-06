import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { createComplaintSchema } from "@/lib/validations/complaint.schema";
import { z } from "zod";

// POST: Create a new complaint (Accessible by Residents & Admins)
export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const validatedData = createComplaintSchema.parse(body);
        const now = new Date().toISOString();
        const complaintRef = adminDb.ref("complaints").push();

        const complaint = {
            id: complaintRef.key,
            ...validatedData,
            user_id: session.user.id,
            status: "pending",
            created_at: now,
            updated_at: now,
        };

        await complaintRef.set(complaint);
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

    try {
        const snapshot = await adminDb.ref("complaints").get();
        let complaints = snapshot.exists() ? Object.values(snapshot.val()) as Record<string, unknown>[] : [];

        if (session.user.role !== "admin") {
            complaints = complaints.filter((c) => c.user_id === session.user.id);
        }
        if (statusFilter) {
            complaints = complaints.filter((c) => c.status === statusFilter);
        }

        complaints.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
        return NextResponse.json(complaints, { status: 200 });
    } catch (error) {
        console.error("Complaints GET error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
