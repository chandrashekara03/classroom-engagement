import { NextResponse } from "next/server";
import { withAuth } from "@/lib/requireAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import { createNoticeSchema } from "@/lib/validations/notice.schema";
import { z } from "zod";

// Admin creates notice
export const POST = withAuth(async (req, ctx, session) => {
    try {
        const body = await req.json();
        const validatedData = createNoticeSchema.parse(body);
        const now = new Date().toISOString();
        const noticeRef = adminDb.ref("notices").push();
        const notice = {
            id: noticeRef.key,
            title: validatedData.title,
            content: validatedData.content,
            is_important: validatedData.isImportant || false,
            created_by: session.user.id,
            created_at: now,
            updated_at: now,
        };

        await noticeRef.set(notice);

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
    try {
        const snapshot = await adminDb.ref("notices").get();
        const notices = snapshot.exists() ? Object.values(snapshot.val()) as Record<string, unknown>[] : [];
        notices.sort((a, b) => {
            const importanceSort = Number(Boolean(b.is_important)) - Number(Boolean(a.is_important));
            if (importanceSort !== 0) return importanceSort;
            return String(b.created_at || "").localeCompare(String(a.created_at || ""));
        });
        return NextResponse.json(notices, { status: 200 });
    } catch (error) {
        console.error("Notice GET error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});
