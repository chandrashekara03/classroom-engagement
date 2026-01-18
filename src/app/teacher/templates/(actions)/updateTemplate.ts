"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

export async function updateTemplate(id: string, data: any) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("templates")
    .update({
      title: data.name,
      data: data.type === "feedback" ? { instructions: data.instructions, fields: data.fields } : data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("teacher_id", user.id);

  if (error) throw error;

  if (data.type === "quiz") {
    // Delete existing questions
    await supabase.from("quiz_questions").delete().eq("template_id", id);
    // Insert new ones
    for (const q of data.questions) {
      await supabase.from("quiz_questions").insert({
        template_id: id,
        question: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        "order": q.order_index,
      });
    }
  } else if (data.type === "poll") {
    await supabase.from("poll_options").delete().eq("template_id", id);
    for (const opt of data.options) {
      await supabase.from("poll_options").insert({
        template_id: id,
        option_text: opt.option_text,
        "order": opt.order_index,
      });
    }
  } else if (data.type === "feedback") {
    // Fields stored in data
  }

  revalidatePath("/teacher/templates");
}