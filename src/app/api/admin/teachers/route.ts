import { requireAdmin } from '@/lib/adminApiAuth';
import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET all teachers
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const teachers = await dbService.getAllTeachers();
    return NextResponse.json({ teachers }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// POST create teacher
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  let createdUid: string | null = null;

  try {
    const { email, password, displayName, department } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedDisplayName = String(displayName || '').trim();
    const teacherDepartment = String(department || '').trim() || 'Computer Science';

    if (!normalizedEmail || !password || !normalizedDisplayName) {
      return NextResponse.json(
        { error: 'Email, password, and displayName are required' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!normalizedEmail.endsWith('@christuniversity.in')) {
      return NextResponse.json(
        { error: 'Email must be a christuniversity.in account' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedDisplayName,
    });
    createdUid = userRecord.uid;

    await Promise.all([
      dbService.createTeacher({
        uid: userRecord.uid,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        department: teacherDepartment,
      }),
      dbService.createUser({
        uid: userRecord.uid,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        role: 'teacher',
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Teacher created successfully',
        uid: userRecord.uid,
        email: userRecord.email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating teacher:', error);

    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error('Teacher rollback failed:', rollbackError);
      }
    }

    let errorMessage = 'Failed to create teacher';

    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak (minimum 6 characters)';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
