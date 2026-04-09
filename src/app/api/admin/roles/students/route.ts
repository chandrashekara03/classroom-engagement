import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApiAuth';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { recordRoleAudit, resolveCurrentRole } from '@/lib/adminRoleManagement';

type UserRoleRecord = {
  uid: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
};

type StudentRecord = {
  uid: string;
  email: string;
  displayName: string;
  studentId: string;
  department: string;
  createdAt: string;
  lastLoginAt: string;
};

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeDisplayName(displayName: string, email: string): string {
  const cleaned = String(displayName || '').trim();
  return cleaned || email.split('@')[0] || 'student-user';
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  let createdUid: string | null = null;

  try {
    const body = await req.json();
    const normalizedUid = String(body?.uid || '').trim();
    const normalizedEmail = normalizeEmail(body?.email);
    const normalizedDisplayNameInput = String(body?.displayName || '').trim();
    const normalizedStudentIdInput = String(body?.studentId || '').trim();
    const normalizedDepartment = String(body?.department || '').trim() || 'Computer Science';
    const password = String(body?.password || '');

    if (!normalizedUid && !normalizedEmail) {
      return NextResponse.json(
        { error: 'Either uid or email is required to assign student role' },
        { status: 400 }
      );
    }

    let authUser;

    if (normalizedUid) {
      authUser = await adminAuth.getUser(normalizedUid);
    } else {
      try {
        authUser = await adminAuth.getUserByEmail(normalizedEmail);
      } catch (error: unknown) {
        if (getErrorCode(error) !== 'auth/user-not-found') {
          throw error;
        }

        if (!normalizedEmail || !normalizedDisplayNameInput) {
          return NextResponse.json(
            { error: 'displayName and email are required when creating a new student account' },
            { status: 400 }
          );
        }

        if (!password || password.length < 6) {
          return NextResponse.json(
            { error: 'Password with at least 6 characters is required for new student accounts' },
            { status: 400 }
          );
        }

        authUser = await adminAuth.createUser({
          email: normalizedEmail,
          password,
          displayName: normalizedDisplayNameInput,
        });
        createdUid = authUser.uid;
      }
    }

    const uid = authUser.uid;
    const email = normalizeEmail(authUser.email || normalizedEmail);

    if (!email) {
      return NextResponse.json(
        { error: 'Target account must have a valid email address' },
        { status: 400 }
      );
    }

    const displayName = normalizeDisplayName(
      normalizedDisplayNameInput || authUser.displayName || '',
      email
    );

    const [userSnapshot, studentSnapshot, teacherSnapshot, adminSnapshot, authFresh] = await Promise.all([
      adminDb.ref(`users/${uid}`).get(),
      adminDb.ref(`students/${uid}`).get(),
      adminDb.ref(`teachers/${uid}`).get(),
      adminDb.ref(`admins/${uid}`).get(),
      adminAuth.getUser(uid),
    ]);

    if (adminSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Cannot change an admin account to student role from this endpoint' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const existingUser = (userSnapshot.exists() ? userSnapshot.val() : null) as
      | Partial<UserRoleRecord>
      | null;
    const existingStudent = (studentSnapshot.exists() ? studentSnapshot.val() : null) as
      | Partial<StudentRecord>
      | null;

    const previousRole = resolveCurrentRole(existingUser?.role, {
      hasAdmin: adminSnapshot.exists(),
      hasTeacher: teacherSnapshot.exists(),
      hasStudent: studentSnapshot.exists(),
    });

    const userPayload: UserRoleRecord = {
      uid,
      email,
      role: 'student',
      displayName,
      createdAt: existingUser?.createdAt || existingStudent?.createdAt || now,
      lastLoginAt: now,
    };

    const studentPayload: StudentRecord = {
      uid,
      email,
      displayName,
      studentId: normalizedStudentIdInput || existingStudent?.studentId || email.split('@')[0],
      department: normalizedDepartment,
      createdAt: existingStudent?.createdAt || existingUser?.createdAt || now,
      lastLoginAt: now,
    };

    await Promise.all([
      adminDb.ref(`users/${uid}`).set(userPayload),
      adminDb.ref(`students/${uid}`).set(studentPayload),
      adminDb.ref(`teachers/${uid}`).remove(),
      adminAuth.setCustomUserClaims(uid, {
        ...(authFresh.customClaims || {}),
        role: 'student',
      }),
      recordRoleAudit({
        targetUid: uid,
        targetEmail: email,
        targetDisplayName: displayName,
        fromRole: previousRole,
        toRole: 'student',
        changedByUid: adminCheck.admin.uid,
        changedByEmail: adminCheck.admin.email,
        reason: 'Assigned student role from admin dashboard',
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Student role assigned successfully',
        student: studentPayload,
      },
      { status: studentSnapshot.exists() ? 200 : 201 }
    );
  } catch (error: unknown) {
    console.error('Error assigning student role:', error);

    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error('Student-role rollback failed:', rollbackError);
      }
    }

    if (getErrorCode(error) === 'auth/user-not-found') {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (getErrorCode(error) === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (getErrorCode(error) === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to assign student role' }, { status: 500 });
  }
}
