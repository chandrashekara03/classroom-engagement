import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTeacherUser(email, password, name) {
  try {
    // Create user in Supabase Auth with proper settings
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'teacher'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authData.user?.id);

    // Insert into teachers table
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        id: authData.user?.id,
        email,
        password_hash: 'managed_by_supabase_auth', // Since we're using Supabase Auth
      })
      .select();

    if (teacherError) {
      console.error('Error creating teacher record:', teacherError);
      return;
    }

    console.log('Teacher user created successfully:', teacherData);
    console.log('Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Usage: node create-teacher.js teacher@example.com password123
const [, , email, password] = process.argv;
if (!email || !password) {
  console.log('Usage: node create-teacher.js <email> <password>');
  process.exit(1);
}

createTeacherUser(email, password);