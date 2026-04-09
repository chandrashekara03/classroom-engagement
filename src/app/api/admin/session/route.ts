import { requireAdmin } from '@/lib/adminApiAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  return NextResponse.json(
    {
      ok: true,
      admin: adminCheck.admin,
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  return NextResponse.json(
    {
      ok: true,
      admin: adminCheck.admin,
    },
    { status: 200 }
  );
}
