import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApiAuth';
import { listRoleAudits } from '@/lib/adminRoleManagement';

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const limitParam = req.nextUrl.searchParams.get('limit');
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 30;
    const audits = await listRoleAudits(parsedLimit);

    return NextResponse.json({ audits }, { status: 200 });
  } catch (error) {
    console.error('Error fetching role audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch role audit logs' }, { status: 500 });
  }
}
