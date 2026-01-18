import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const all = searchParams.get("all") === "true";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get session type
  const { data: session } = await supabase
    .from("sessions")
    .select("templates(type)")
    .eq("id", sessionId)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const type = (session.templates as any)?.type;

  if (all) {
    // Export all as ZIP
    const zip = new JSZip();

    if (type === "quiz") {
      const leaderboard = await getQuizLeaderboard(supabase, sessionId);
      zip.file("leaderboard." + format, generateFile(leaderboard, format));
    }

    if (type === "poll") {
      const pollResults = await getPollResults(supabase, sessionId);
      zip.file("poll_results." + format, generateFile(pollResults, format));
    }

    if (type === "feedback") {
      const feedback = await getFeedbackResponses(supabase, sessionId);
      zip.file("feedback." + format, generateFile(feedback, format));
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="session_${sessionId}_exports.zip"`,
      },
    });
  } else {
    // Single export
    let data: any[] = [];
    let filename = "";

    if (type === "quiz") {
      data = await getQuizLeaderboard(supabase, sessionId);
      filename = "leaderboard";
    } else if (type === "poll") {
      data = await getPollResults(supabase, sessionId);
      filename = "poll_results";
    } else if (type === "feedback") {
      data = await getFeedbackResponses(supabase, sessionId);
      filename = "feedback";
    }

    const fileContent = generateFile(data, format);
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.${format}"`,
      },
    });
  }
}

async function getQuizLeaderboard(supabase: any, sessionId: string) {
  const { data: answers } = await supabase
    .from("quiz_answers")
    .select("student_id, answer, is_correct")
    .eq("session_id", sessionId);

  const scores: { [key: string]: { correct: number; total: number } } = {};
  answers?.forEach((a: any) => {
    if (!scores[a.student_id]) scores[a.student_id] = { correct: 0, total: 0 };
    scores[a.student_id].total++;
    if (a.is_correct) scores[a.student_id].correct++;
  });

  return Object.entries(scores).map(([studentId, score]) => ({
    student_id: studentId,
    score: Math.round((score.correct / score.total) * 100),
    correct: score.correct,
    total: score.total,
  })).sort((a, b) => b.score - a.score);
}

async function getPollResults(supabase: any, sessionId: string) {
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("option_id, poll_options(option_text)")
    .eq("session_id", sessionId);

  const counts: { [key: string]: number } = {};
  votes?.forEach((v: any) => {
    const text = v.poll_options?.option_text || "Unknown";
    counts[text] = (counts[text] || 0) + 1;
  });

  return Object.entries(counts).map(([option, count]) => ({ option, count }));
}

async function getFeedbackResponses(supabase: any, sessionId: string) {
  const { data } = await supabase
    .from("feedback_responses")
    .select("*")
    .eq("session_id", sessionId);
  return data || [];
}

function generateFile(data: any[], format: string) {
  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  } else {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
    return csv;
  }
}