import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

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

    let isRole = false;

    if (role === 'admin') {
      const { data } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .single();
      isRole = !!data;
    } else if (role === 'teacher') {
      const { data } = await supabase
        .from('teachers')
        .select('id')
        .eq('id', userId)
        .single();
      isRole = !!data;
    }

    return NextResponse.json({ isRole });
  } catch (error) {
    console.error('Error checking role:', error);
    return NextResponse.json({ isRole: false }, { status: 500 });
  }
}