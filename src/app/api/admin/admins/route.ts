import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminApiAuth';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { recordRoleAudit, resolveCurrentRole } from '@/lib/adminRoleManagement';

type AdminRecord = {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
};

type UserRecord = {
  uid: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
};

function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeDisplayName(displayName: string, fallbackEmail: string): string {
  const cleaned = String(displayName || '').trim();
  return cleaned || fallbackEmail.split('@')[0] || 'admin-user';
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const snapshot = await adminDb.ref('admins').get();
    if (!snapshot.exists()) {
      return NextResponse.json({ admins: [] }, { status: 200 });
    }

    const admins: AdminRecord[] = [];
    snapshot.forEach((child) => {
      const value = child.val() as Partial<AdminRecord>;
      if (
        value &&
        typeof value.uid === 'string' &&
        typeof value.email === 'string' &&
        typeof value.displayName === 'string'
      ) {
        admins.push({
          uid: value.uid,
          email: value.email,
          displayName: value.displayName,
          createdAt: value.createdAt || new Date().toISOString(),
          lastLoginAt: value.lastLoginAt || value.createdAt || new Date().toISOString(),
        });
      }
    });

    admins.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
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
    const requestedEmail = normalizeEmail(body?.email);
    const password = String(body?.password || '');
    const requestedDisplayName = String(body?.displayName || '');

    if (!normalizedUid && !requestedEmail) {
      return NextResponse.json({ error: 'Either uid or email is required' }, { status: 400 });
    }

    let authUser;

    if (normalizedUid) {
      authUser = await adminAuth.getUser(normalizedUid);
    } else {
      try {
        authUser = await adminAuth.getUserByEmail(requestedEmail);
      } catch (error: unknown) {
        if (getErrorCode(error) !== 'auth/user-not-found') {
          throw error;
        }

        if (!password || password.length < 6) {
          return NextResponse.json(
            { error: 'Password with at least 6 characters is required for new users' },
            { status: 400 }
          );
        }

        const displayNameForCreate = normalizeDisplayName(requestedDisplayName, requestedEmail);
        authUser = await adminAuth.createUser({
          email: requestedEmail,
          password,
          displayName: displayNameForCreate,
        });
        createdUid = authUser.uid;
      }
    }

    const uid = authUser.uid;
    const email = normalizeEmail(authUser.email || requestedEmail);

    if (!email) {
      return NextResponse.json(
        { error: 'Target account must have a valid email address' },
        { status: 400 }
      );
    }

    const displayName = normalizeDisplayName(
      requestedDisplayName || authUser.displayName || '',
      email
    );
    const now = new Date().toISOString();

    const userRef = adminDb.ref(`users/${uid}`);
    const adminRef = adminDb.ref(`admins/${uid}`);
    const teacherRef = adminDb.ref(`teachers/${uid}`);
    const studentRef = adminDb.ref(`students/${uid}`);

    const [existingUserSnapshot, existingAdminSnapshot, existingTeacherSnapshot, existingStudentSnapshot, authFresh] = await Promise.all([
      userRef.get(),
      adminRef.get(),
      teacherRef.get(),
      studentRef.get(),
      adminAuth.getUser(uid),
    ]);

    const existingUser = (existingUserSnapshot.exists() ? existingUserSnapshot.val() : null) as
      | Partial<UserRecord>
      | null;
    const existingAdmin = (existingAdminSnapshot.exists() ? existingAdminSnapshot.val() : null) as
      | Partial<AdminRecord>
      | null;

    const previousRole = resolveCurrentRole(existingUser?.role, {
      hasAdmin: existingAdminSnapshot.exists(),
      hasTeacher: existingTeacherSnapshot.exists(),
      hasStudent: existingStudentSnapshot.exists(),
    });

    const userPayload: UserRecord = {
      uid,
      email,
      role: 'admin',
      displayName,
      createdAt: existingUser?.createdAt || existingAdmin?.createdAt || now,
      lastLoginAt: now,
    };

    const adminPayload: AdminRecord = {
      uid,
      email,
      displayName,
      createdAt: existingAdmin?.createdAt || existingUser?.createdAt || now,
      lastLoginAt: now,
    };

    await Promise.all([
      userRef.set(userPayload),
      adminRef.set(adminPayload),
      adminAuth.setCustomUserClaims(uid, {
        ...(authFresh.customClaims || {}),
        role: 'admin',
      }),
      recordRoleAudit({
        targetUid: uid,
        targetEmail: email,
        targetDisplayName: displayName,
        fromRole: previousRole,
        toRole: 'admin',
        changedByUid: adminCheck.admin.uid,
        changedByEmail: adminCheck.admin.email,
        reason: 'Assigned admin role from admin dashboard',
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: existingAdminSnapshot.exists()
          ? 'Admin profile refreshed successfully'
          : 'Admin created successfully',
        admin: adminPayload,
      },
      { status: existingAdminSnapshot.exists() ? 200 : 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating admin:', error);

    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error('Admin rollback failed:', rollbackError);
      }
    }

    if (getErrorCode(error) === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
    }

    if (getErrorCode(error) === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (getErrorCode(error) === 'auth/user-not-found') {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 });
  }
}
