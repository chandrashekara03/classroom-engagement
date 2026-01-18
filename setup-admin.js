const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminSystem() {
  try {
    console.log('Setting up admin system...');

    // Create admins table
    console.log('Creating admins table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.error('Error creating admins table:', createTableError);
      // Try direct SQL execution
      const { error: directError } = await supabase.from('admins').select('*').limit(1);
      if (directError && directError.code === '42P01') {
        console.log('Admins table does not exist, creating via Supabase SQL editor...');
        console.log('Please run this SQL in your Supabase SQL editor:');
        console.log(`
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
        `);
      }
    }

    // Create admin user in auth
    const adminEmail = 'admin@classroom.com';
    const adminPassword = 'Admin123!@#';

    console.log('Creating admin user in auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('Admin user already exists in auth');
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingAdmin = existingUsers.users.find(u => u.email === adminEmail);
        if (existingAdmin) {
          authData = { user: existingAdmin };
        }
      } else {
        console.error('Error creating admin auth user:', authError);
        return;
      }
    }

    if (authData?.user) {
      console.log('Admin auth user created/verified:', authData.user.id);

      // Add to admins table
      const { error: insertError } = await supabase
        .from('admins')
        .upsert({
          id: authData.user.id,
          email: adminEmail,
          password_hash: 'managed_by_supabase_auth'
        });

      if (insertError) {
        console.error('Error adding admin to table:', insertError);
      } else {
        console.log('Admin added to admins table');
      }
    }

    // Update templates table to allow admin_id
    console.log('Updating templates table...');
    const { error: alterTemplatesError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE templates ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
        ALTER TABLE templates ADD CONSTRAINT check_creator CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL);
      `
    });

    if (alterTemplatesError) {
      console.log('Please run this SQL in your Supabase SQL editor:');
      console.log(`
ALTER TABLE templates ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE templates ADD CONSTRAINT check_creator CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL);
      `);
    }

    // Update sessions table to allow admin_id
    console.log('Updating sessions table...');
    const { error: alterSessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE sessions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
        ALTER TABLE sessions ADD CONSTRAINT check_session_creator CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL);
      `
    });

    if (alterSessionsError) {
      console.log('Please run this SQL in your Supabase SQL editor:');
      console.log(`
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT check_session_creator CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL);
      `);
    }

    console.log('\n=== ADMIN SETUP COMPLETE ===');
    console.log('Admin Login Credentials:');
    console.log('Email: admin@classroom.com');
    console.log('Password: Admin123!@#');
    console.log('\nAdmin can access: /admin/* routes');
    console.log('Teachers can access: /teacher/* routes');

  } catch (error) {
    console.error('Error:', error);
  }
}

setupAdminSystem();