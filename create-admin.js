const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    const adminEmail = 'admin@classroom.com';
    const adminPassword = 'Admin123!@#';

    // Create admin user in auth
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
          console.log('Admin user ID:', existingAdmin.id);
        }
      } else {
        console.error('Error creating admin auth user:', authError);
        return;
      }
    } else {
      console.log('Admin auth user created:', authData.user.id);
    }

    console.log('\n=== MANUAL STEPS REQUIRED ===');
    console.log('1. Go to your Supabase SQL Editor');
    console.log('2. Run this SQL to create the admins table:');
    console.log(`
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
    `);

    console.log('3. Run this SQL to add the admin user to the table:');
    if (authData?.user) {
      console.log(`
INSERT INTO admins (id, email, password_hash)
VALUES ('${authData.user.id}', '${adminEmail}', 'managed_by_supabase_auth')
ON CONFLICT (id) DO NOTHING;
      `);
    } else {
      console.log(`
-- Replace USER_ID_HERE with the admin user ID from above
INSERT INTO admins (id, email, password_hash)
VALUES ('USER_ID_HERE', '${adminEmail}', 'managed_by_supabase_auth')
ON CONFLICT (id) DO NOTHING;
      `);
    }

    console.log('4. Run this SQL to update templates table:');
    console.log(`
ALTER TABLE templates ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE templates ADD CONSTRAINT check_creator CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL);
    `);

    console.log('5. Run this SQL to update sessions table:');
    console.log(`
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT check_session_creator CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL);
    `);

    console.log('\n=== ADMIN LOGIN CREDENTIALS ===');
    console.log('Email: admin@classroom.com');
    console.log('Password: Admin123!@#');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();