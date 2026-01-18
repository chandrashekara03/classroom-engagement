const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseState() {
  try {
    console.log('Checking current database state...\n');

    const tables = [
      'teachers',
      'admins',
      'templates',
      'quiz_questions',
      'poll_options',
      'sessions',
      'students',
      'session_participants',
      'quiz_answers',
      'poll_votes',
      'feedback_responses'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === '42P01') {
          missingTables.push(table);
        } else {
          existingTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }

    console.log('✅ Existing tables:', existingTables);
    console.log('❌ Missing tables:', missingTables);

    if (missingTables.length > 0) {
      console.log('\n🔧 SQL commands to create missing tables:\n');

      if (missingTables.includes('admins')) {
        console.log('-- Create admins table');
        console.log(`CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        console.log('');
      }

      if (missingTables.includes('templates')) {
        console.log('-- Create templates table');
        console.log(`CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'poll', 'feedback')),
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL)
);`);
        console.log('');
      }

      if (missingTables.includes('quiz_questions')) {
        console.log('-- Create quiz_questions table');
        console.log(`CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        console.log('');
      }

      if (missingTables.includes('poll_options')) {
        console.log('-- Create poll_options table');
        console.log(`CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        console.log('');
      }

      if (missingTables.includes('sessions')) {
        console.log('-- Create sessions table');
        console.log(`CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'active', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (teacher_id IS NOT NULL OR admin_id IS NOT NULL)
);`);
        console.log('');
      }

      if (missingTables.includes('students')) {
        console.log('-- Create students table');
        console.log(`CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        console.log('');
      }

      if (missingTables.includes('session_participants')) {
        console.log('-- Create session_participants table');
        console.log(`CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);`);
        console.log('');
      }

      if (missingTables.includes('quiz_answers')) {
        console.log('-- Create quiz_answers table');
        console.log(`CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        console.log('');
      }

      if (missingTables.includes('poll_votes')) {
        console.log('-- Create poll_votes table');
        console.log(`CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id, option_id)
);`);
        console.log('');
      }

      if (missingTables.includes('feedback_responses')) {
        console.log('-- Create feedback_responses table');
        console.log(`CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  response_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        console.log('');
      }
    }

    // Check if admin user exists
    console.log('\n👤 Checking admin user...');
    const { data: admins, error: adminError } = await supabase.from('admins').select('*');
    if (adminError) {
      console.log('❌ Admins table does not exist');
    } else {
      const adminUser = admins.find(a => a.email === 'admin@classroom.com');
      if (adminUser) {
        console.log('✅ Admin user exists:', adminUser.email);
      } else {
        console.log('❌ Admin user not found in admins table');
        console.log('\n🔧 Add admin user:');
        console.log(`INSERT INTO admins (id, email, password_hash)
VALUES ('a494337e-ad1a-4f64-a782-89ccd5270c50', 'admin@classroom.com', 'managed_by_supabase_auth')
ON CONFLICT (id) DO NOTHING;`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabaseState();