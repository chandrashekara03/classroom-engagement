import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

type Role = 'admin' | 'teacher' | 'student';

type UserRecord = {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string;
};

export type AdminSession = {
  uid: string;
  email: string;
  displayName: string;
};

export type RequireAdminResult =
  | { ok: true; admin: AdminSession }
  | { ok: false; response: NextResponse };

const FALLBACK_ADMIN_EMAIL = 'suryachalam18@gmail.com';

function unauthorized(message = 'Unauthorized'): RequireAdminResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 401 }),
  };
}

function forbidden(message = 'Admin access required'): RequireAdminResult {
  return {
    ok: false,
    response: NextResponse.json({ error: message }, { status: 403 }),
  };
}

function getBootstrapAdminEmail(): string {
  const fromEnv = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return fromEnv || FALLBACK_ADMIN_EMAIL;
}

function buildDisplayName(email: string, decodedName?: string): string {
  if (decodedName && decodedName.trim().length > 0) {
    return decodedName.trim();
  }
  return email.split('@')[0];
}

async function ensureAdminRole(uid: string, email: string, displayName: string): Promise<boolean> {
  const userRef = adminDb.ref(`users/${uid}`);
  const adminsRef = adminDb.ref(`admins/${uid}`);
  const userSnapshot = await userRef.get();

  const now = new Date().toISOString();
  const allowedBootstrapEmail = getBootstrapAdminEmail();
  const canBootstrap = email === allowedBootstrapEmail;

  if (!userSnapshot.exists()) {
    if (!canBootstrap) return false;

    const user: UserRecord = {
      uid,
      email,
      displayName,
      role: 'admin',
      createdAt: now,
      lastLoginAt: now,
    };

    await Promise.all([
      userRef.set(user),
      adminsRef.set({ uid, email, displayName, createdAt: now, lastLoginAt: now }),
    ]);

    return true;
  }

  const existing = userSnapshot.val() as Partial<UserRecord>;
  const existingRole = existing.role;

  if (existingRole === 'admin') {
    await Promise.all([
      userRef.update({
        displayName: existing.displayName || displayName,
        lastLoginAt: now,
      }),
      adminsRef.update({ uid, email, displayName, lastLoginAt: now }),
    ]);
    return true;
  }

  if (!canBootstrap) {
    return false;
  }

  await Promise.all([
    userRef.update({ role: 'admin', lastLoginAt: now, displayName }),
    adminsRef.set({
      uid,
      email,
      displayName,
      createdAt: existing.createdAt || now,
      lastLoginAt: now,
    }),
  ]);

  return true;
}

export async function requireAdmin(req: NextRequest): Promise<RequireAdminResult> {
  const header = req.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized('Missing or invalid Authorization header');
  }

  const idToken = header.slice('Bearer '.length).trim();
  if (!idToken) {
    return unauthorized('Missing Firebase ID token');
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.trim().toLowerCase();

    if (!email) {
      return forbidden('Admin email is required');
    }

    const displayName = buildDisplayName(email, decoded.name);
    const isAdmin = await ensureAdminRole(decoded.uid, email, displayName);

    if (!isAdmin) {
      return forbidden('Account is not authorized as admin');
    }

    return {
      ok: true,
      admin: {
        uid: decoded.uid,
        email,
        displayName,
      },
    };
  } catch (error) {
    console.error('Admin auth verification failed:', error);
    return unauthorized('Invalid or expired Firebase ID token');
  }
}
