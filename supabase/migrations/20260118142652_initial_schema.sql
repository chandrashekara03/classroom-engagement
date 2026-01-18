-- Classroom Engagement Platform SQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teachers table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table (quiz, poll, feedback)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'poll', 'feedback')),
  title TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Quiz questions
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- array of options
  correct_answer TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll options
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'active', 'ended')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students (anonymous or named)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session participants
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Quiz answers
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll votes
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id, option_id)
);

-- Feedback responses
CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_teacher_id ON templates(teacher_id);
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_students_session_id ON students(session_id);
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX idx_poll_votes_session_id ON poll_votes(session_id);
CREATE INDEX idx_feedback_responses_session_id ON feedback_responses(session_id);

-- RLS Policies

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Teachers can access their own data
CREATE POLICY "Teachers can view own data" ON teachers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Teachers can update own data" ON teachers
  FOR UPDATE USING (auth.uid() = id);

-- Templates: teachers can CRUD their own
CREATE POLICY "Teachers can view own templates" ON templates
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert own templates" ON templates
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own templates" ON templates
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own templates" ON templates
  FOR DELETE USING (teacher_id = auth.uid());

-- Quiz questions: teachers can access via templates
CREATE POLICY "Teachers can view quiz questions" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = quiz_questions.template_id
      AND templates.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = quiz_questions.template_id
      AND templates.teacher_id = auth.uid()
    )
  );

-- Poll options: similar to quiz questions
CREATE POLICY "Teachers can view poll options" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = poll_options.template_id
      AND templates.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage poll options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM templates
      WHERE templates.id = poll_options.template_id
      AND templates.teacher_id = auth.uid()
    )
  );

-- Sessions: teachers can access their own
CREATE POLICY "Teachers can view own sessions" ON sessions
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can manage own sessions" ON sessions
  FOR ALL USING (teacher_id = auth.uid());

-- Students: can view/update their own data, teachers can view via sessions
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (auth.uid() IS NULL OR id = auth.uid());

CREATE POLICY "Students can update own data" ON students
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Teachers can view students in their sessions" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = students.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

-- Session participants: similar access
CREATE POLICY "Teachers can view participants" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_participants.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own participation" ON session_participants
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can join sessions" ON session_participants
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Quiz answers: teachers via sessions, students own
CREATE POLICY "Teachers can view quiz answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = quiz_answers.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can submit answers" ON quiz_answers
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own answers" ON quiz_answers
  FOR SELECT USING (student_id = auth.uid());

-- Poll votes: similar
CREATE POLICY "Teachers can view poll votes" ON poll_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = poll_votes.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can vote" ON poll_votes
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own votes" ON poll_votes
  FOR SELECT USING (student_id = auth.uid());

-- Feedback responses: similar
CREATE POLICY "Teachers can view feedback" ON feedback_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = feedback_responses.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can submit feedback" ON feedback_responses
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own feedback" ON feedback_responses
  FOR SELECT USING (student_id = auth.uid());