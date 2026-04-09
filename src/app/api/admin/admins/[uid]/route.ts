import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApiAuth';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { recordRoleAudit } from '@/lib/adminRoleManagement';

type UserRole = 'admin' | 'teacher' | 'student';

function chooseFallbackRole(hasTeacherRecord: boolean, hasStudentRecord: boolean): UserRole {
  if (hasTeacherRecord) return 'teacher';
  if (hasStudentRecord) return 'student';
  return 'student';
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
}

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
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    if (uid === adminCheck.admin.uid) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin access from this session' },
        { status: 400 }
      );
    }

    const adminsSnapshot = await adminDb.ref('admins').get();
    const totalAdmins = adminsSnapshot.exists() ? adminsSnapshot.numChildren() : 0;

    if (totalAdmins <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin account' },
        { status: 400 }
      );
    }

    const userRef = adminDb.ref(`users/${uid}`);
    const adminRef = adminDb.ref(`admins/${uid}`);
    const teacherRef = adminDb.ref(`teachers/${uid}`);
    const studentRef = adminDb.ref(`students/${uid}`);

    const [userSnapshot, adminSnapshot, teacherSnapshot, studentSnapshot, authUser] = await Promise.all([
      userRef.get(),
      adminRef.get(),
      teacherRef.get(),
      studentRef.get(),
      adminAuth.getUser(uid),
    ]);

    if (!adminSnapshot.exists()) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const fallbackRole = chooseFallbackRole(teacherSnapshot.exists(), studentSnapshot.exists());
    const now = new Date().toISOString();
    const existingUser = (userSnapshot.exists() ? userSnapshot.val() : null) as
      | { email?: string; displayName?: string; createdAt?: string }
      | null;

    const resolvedEmail = existingUser?.email || authUser.email || '';
    const resolvedDisplayName =
      existingUser?.displayName ||
      authUser.displayName ||
      resolvedEmail.split('@')[0] ||
      `user-${uid.slice(0, 6)}`;

    await Promise.all([
      userRef.set({
        uid,
        email: resolvedEmail,
        displayName: resolvedDisplayName,
        role: fallbackRole,
        createdAt: existingUser?.createdAt || now,
        lastLoginAt: now,
      }),
      adminRef.remove(),
      adminAuth.setCustomUserClaims(uid, {
        ...(authUser.customClaims || {}),
        role: fallbackRole,
      }),
      recordRoleAudit({
        targetUid: uid,
        targetEmail: resolvedEmail,
        targetDisplayName: resolvedDisplayName,
        fromRole: 'admin',
        toRole: fallbackRole,
        changedByUid: adminCheck.admin.uid,
        changedByEmail: adminCheck.admin.email,
        reason: 'Removed admin access from admin dashboard',
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Admin access removed successfully',
        role: fallbackRole,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error removing admin:', error);

    if (getErrorCode(error) === 'auth/user-not-found') {
      return NextResponse.json({ error: 'User not found in Firebase Auth' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to remove admin access' }, { status: 500 });
  }
}
