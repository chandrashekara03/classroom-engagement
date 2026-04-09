import { requireAdmin } from '@/lib/adminApiAuth';
import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// DELETE teacher by uid
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    try {
      await adminAuth.deleteUser(uid);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    await Promise.all([
      dbService.deleteTeacher(uid),
      dbService.deleteUser(uid),
    ]);

    return NextResponse.json(
      { success: true, message: 'Teacher deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    let errorMessage = 'Failed to delete teacher';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Teacher not found';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
