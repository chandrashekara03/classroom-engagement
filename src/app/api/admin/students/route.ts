import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET all students
export async function GET() {
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
  try {
    const { email, password, displayName, studentId, department } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and displayName are required' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Create student record in database
    await dbService.createStudent({
      uid: userRecord.uid,
      email,
      displayName,
      studentId: studentId || email.split('@')[0],
      department: department || 'Computer Science',
    });

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
