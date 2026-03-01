import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { updateComplaintStatusSchema } from "@/lib/validations/complaint.schema";
import { z } from "zod";

// PATCH: Update Complaint Status (Admin Only)
export const PATCH = withAuth(async (req, { params }, session) => {
    const { id } = params;

    try {
        const body = await req.json();
        const { status } = updateComplaintStatusSchema.parse(body);

        const { data: complaint, error } = await supabaseAdmin
            .from("complaints")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Supabase error: The result contains 0 rows
                return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(complaint, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Complaint PATCH error", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}, ["admin"]);
