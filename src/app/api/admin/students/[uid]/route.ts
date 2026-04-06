import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// DELETE student by uid
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
    await dbService.deleteStudent(uid);

    return NextResponse.json(
      { success: true, message: 'Student deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting student:', error);
    let errorMessage = 'Failed to delete student';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Student not found';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
