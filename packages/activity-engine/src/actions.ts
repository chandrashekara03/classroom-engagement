'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Creates an authenticated Supabase Server Client.
 */
async function getSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Context is not available (e.g. from middleware)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
             // Context is not available
          }
        },
      },
    }
  );
}

/**
 * Generates a random 6-character alphanumeric uppercase join code
 */
function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Interfaces for responses
 */
export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Launches a new session from a provided activity template.
 * @param templateId UUID of the activity template
 * @param classId Optional UUID of a specific class
 * @returns ActionResponse containing the new session data
 */
export async function launchSession(templateId: string, classId?: string): Promise<ActionResponse> {
  try {
    const supabase = await getSupabaseClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required to launch a session.' };
    }

    let retries = 3;
    let session = null;
    let lastError: any = null;

    // Retry loop to handle rare unique constraint collisions on join_code
    while (retries > 0) {
      const joinCode = generateJoinCode();
      
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert({
          activity_template_id: templateId,
          class_id: classId,
          join_code: joinCode,
          status: 'live',
          started_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (!insertError) {
        session = data;
        break; // Successfully inserted
      }
      
      lastError = insertError;
      
      // PostgreSQL unique violation code is '23505'
      if (insertError.code !== '23505') {
        break; // Break on any other error
      }
      
      retries--;
    }

    if (!session) {
      return { 
        success: false, 
        error: lastError?.message || 'Failed to generate a unique join code. Please try again.' 
      };
    }

    return { success: true, data: session };
  } catch (error: any) {
    console.error('SERVER ACTION ERROR: launchSession -', error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}

/**
 * Allows a student to join a live session via its join code.
 * @param joinCode 6-character alphanumeric string 
 * @returns ActionResponse containing the joined sessionId
 */
export async function joinSessionWithCode(joinCode: string): Promise<ActionResponse<{ sessionId: string }>> {
  try {
    const supabase = await getSupabaseClient();
    const upperCode = joinCode.toUpperCase().trim();
    
    // Validate the input code format
    if (!/^[A-Z0-9]{6}$/.test(upperCode)) {
      return { success: false, error: 'Invalid join code format. Must be 6 alphanumeric characters.' };
    }

    // 1. Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required to join a session.' };
    }

    // 2. Query for the living session matching the join code
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('join_code', upperCode)
      .eq('status', 'live')
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Session not found or is no longer live.' };
    }

    // 3. Insert into session_participants
    const { error: joinError } = await supabase
      .from('session_participants')
      .insert({
         session_id: session.id,
         student_id: user.id
      });
      
    if (joinError) {
      // 23505 is PostgreSQL unique constraint violation error code
      // If the student is already in the session, we fail gracefully and return success so the client can route them
      if (joinError.code === '23505') {
        return { 
            success: true, 
            data: { sessionId: session.id }, 
            message: 'You have already joined this session.' 
        };
      }
      return { success: false, error: joinError.message };
    }

    return { success: true, data: { sessionId: session.id } };
  } catch (error: any) {
    console.error('SERVER ACTION ERROR: joinSessionWithCode -', error);
    return { success: false, error: error.message || 'An unexpected server error occurred.' };
  }
}
