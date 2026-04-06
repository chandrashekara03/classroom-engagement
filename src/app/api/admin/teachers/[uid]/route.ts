import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// DELETE teacher by uid
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete from database
    await dbService.deleteTeacher(uid);

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
