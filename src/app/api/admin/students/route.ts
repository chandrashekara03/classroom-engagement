import { requireAdmin } from '@/lib/adminApiAuth';
import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET all students
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const students = await dbService.getAllStudents();
    return NextResponse.json({ students }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST create student
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  let createdUid: string | null = null;

  try {
    const { email, password, displayName, studentId, department } = await req.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedDisplayName = String(displayName || '').trim();
    const normalizedStudentId = String(studentId || '').trim();
    const normalizedDepartment = String(department || '').trim() || 'Computer Science';

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

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedDisplayName,
    });
    createdUid = userRecord.uid;

    await Promise.all([
      dbService.createStudent({
        uid: userRecord.uid,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        studentId: normalizedStudentId || normalizedEmail.split('@')[0],
        department: normalizedDepartment,
      }),
      dbService.createUser({
        uid: userRecord.uid,
        email: normalizedEmail,
        displayName: normalizedDisplayName,
        role: 'student',
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'Student created successfully',
        uid: userRecord.uid,
        email: userRecord.email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating student:', error);

    if (createdUid) {
      try {
        await adminAuth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error('Student rollback failed:', rollbackError);
      }
    }

    let errorMessage = 'Failed to create student';

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
