const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixDatabase() {
  try {
    console.log('Checking teachers table...');

    // Check if teachers table exists
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*');

    if (teachersError) {
      console.error('Teachers table error:', teachersError);
      return;
    }

    console.log('Teachers in table:', teachers);

    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Auth users error:', authError);
      return;
    }

    console.log('Auth users:', authUsers.users.map(u => ({ id: u.id, email: u.email })));

    // Find auth users that are not in teachers table
    const teacherIds = new Set(teachers.map(t => t.id));
    const missingTeachers = authUsers.users.filter(u => !teacherIds.has(u.id));

    if (missingTeachers.length > 0) {
      console.log('Found missing teachers, adding them...');
      for (const user of missingTeachers) {
        const { error: insertError } = await supabase
          .from('teachers')
          .insert({
            id: user.id,
            email: user.email,
            password_hash: 'managed_by_supabase_auth'
          });

        if (insertError) {
          console.error(`Error adding teacher ${user.email}:`, insertError);
        } else {
          console.log(`Added teacher: ${user.email}`);
        }
      }
    } else {
      console.log('All auth users are already teachers');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndFixDatabase();