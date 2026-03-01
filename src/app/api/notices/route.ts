import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { createNoticeSchema } from "@/lib/validations/notice.schema";
import { z } from "zod";

// Admin creates notice
export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const validatedData = createNoticeSchema.parse(body);

        const { data: notice, error } = await supabaseAdmin
            .from("notices")
            .insert({
                title: validatedData.title,
                content: validatedData.content,
                // Transforming JS camelCase to Postgres snake_case convention
                is_important: validatedData.isImportant || false,
                created_by: session.user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(notice, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Notice POST error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}, ["admin"]);

// Residents and Admins can view notices
export const GET = withAuth(async (req, ctx, session) => {
    const { data: notices, error } = await supabaseAdmin
        .from("notices")
        // .select(`*, created_by(name)`)  
        .select("*")
        .order("is_important", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Notice GET error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    return NextResponse.json(notices, { status: 200 });
});
