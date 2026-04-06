import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

type ActivityTemplatePayload = {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  config?: Record<string, unknown>;
  questions?: unknown[];
  options?: unknown[];
  prompt?: string;
  groupSize?: number;
};

function sanitize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const body = (await req.json()) as Partial<ActivityTemplatePayload>;

    if (!body.id || !body.teacherId || !body.type || !body.title) {
      return NextResponse.json({ error: 'Missing required template fields' }, { status: 400 });
    }

    if (decoded.uid !== body.teacherId) {
      return NextResponse.json({ error: 'Forbidden: teacher mismatch' }, { status: 403 });
    }

    const templateData = sanitize({
      id: body.id,
      teacherId: body.teacherId,
      type: body.type,
      title: body.title,
      config: body.config,
      questions: body.questions,
      options: body.options,
      prompt: body.prompt,
      groupSize: body.groupSize,
      createdAt: new Date().toISOString(),
    });

    await adminDb.ref(`activityTemplates/${body.id}`).set(templateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || 'Failed to create activity template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
