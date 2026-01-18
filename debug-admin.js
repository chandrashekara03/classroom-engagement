const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminSetup() {
  try {
    console.log('Checking admin setup...');

    // Check if admins table exists
    console.log('Checking admins table...');
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*');

    if (adminsError) {
      console.error('Admins table error:', adminsError.message);
      console.log('Admins table does not exist or is not accessible');
      return;
    }

    console.log('Admins in table:', admins);

    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Auth users error:', authError);
      return;
    }

    const adminUser = authUsers.users.find(u => u.email === 'admin@classroom.com');
    console.log('Admin auth user:', adminUser ? { id: adminUser.id, email: adminUser.email } : 'Not found');

    // Check if admin is in admins table
    const adminInTable = admins.find(a => a.email === 'admin@classroom.com');
    console.log('Admin in table:', adminInTable ? 'Yes' : 'No');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminSetup();