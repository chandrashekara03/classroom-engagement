"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

export async function createTemplate(data: any) {
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

  const { data: template, error } = await supabase
    .from("templates")
    .insert({
      teacher_id: user.id,
      title: data.name,
      type: data.type,
      data: data.type === "feedback" ? { instructions: data.instructions } : data,
    })
    .select()
    .single();

  if (error) throw error;

  if (data.type === "quiz") {
    for (const q of data.questions) {
      await supabase.from("quiz_questions").insert({
        template_id: template.id,
        question: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        "order": q.order_index,
      });
    }
  } else if (data.type === "poll") {
    for (const opt of data.options) {
      await supabase.from("poll_options").insert({
        template_id: template.id,
        option_text: opt.option_text,
        "order": opt.order_index,
      });
    }
  } else if (data.type === "feedback") {
    // Feedback fields stored in template data
  }

  revalidatePath("/teacher/templates");
}