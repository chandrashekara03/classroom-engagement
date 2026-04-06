import { adminAuth } from '@/lib/firebaseAdmin';
import { dbService } from '@/lib/database';
import { NextRequest, NextResponse } from 'next/server';

// GET all teachers
export async function GET() {
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
  try {
    const { email, password, displayName, department } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and displayName are required' },
        { status: 400 }
      );
    }

    // Validate email domain
    if (!email.endsWith('christuniversity.in')) {
      return NextResponse.json(
        { error: 'Email must be a christuniversity.in account' },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Create teacher record in database
    await dbService.createTeacher({
      uid: userRecord.uid,
      email,
      displayName,
      department: department || 'Computer Science',
    });

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
