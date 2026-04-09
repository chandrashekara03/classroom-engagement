import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApiAuth';
import { ensureRoleOptions, saveRoleOptions } from '@/lib/adminRoleManagement';

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const options = await ensureRoleOptions();
    return NextResponse.json({ options }, { status: 200 });
  } catch (error) {
    console.error('Error fetching role options:', error);
    return NextResponse.json({ error: 'Failed to fetch role options' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = await req.json();
    const options = await saveRoleOptions(body, {
      uid: adminCheck.admin.uid,
      email: adminCheck.admin.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Role options updated successfully',
        options,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating role options:', error);
    return NextResponse.json({ error: 'Failed to update role options' }, { status: 500 });
  }
}
