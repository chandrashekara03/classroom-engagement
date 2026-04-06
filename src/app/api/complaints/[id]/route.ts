import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { updateComplaintStatusSchema } from "@/lib/validations/complaint.schema";
import { z } from "zod";

// PATCH: Update Complaint Status (Admin Only)
export const PATCH = withAuth(async (req, { params }, session) => {
    const { id } = params;

    try {
        const body = await req.json();
        const { status } = updateComplaintStatusSchema.parse(body);
        const complaintRef = adminDb.ref(`complaints/${id}`);
        const complaintSnapshot = await complaintRef.get();

        if (!complaintSnapshot.exists()) {
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        await complaintRef.update({
            status,
            updated_at: new Date().toISOString(),
        });

        const updatedSnapshot = await complaintRef.get();
        const complaint = updatedSnapshot.val();

        return NextResponse.json(complaint, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Complaint PATCH error", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}, ["admin"]);
