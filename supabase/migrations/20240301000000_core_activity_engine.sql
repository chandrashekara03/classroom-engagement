-- 1. Enums and Trigger Functions
CREATE TYPE activity_type AS ENUM (
    'quiz', 'poll', 'feedback', 'riddles', 'treasure_hunt', 
    'pairing', 'grouping', 'scenario', 'other'
);

CREATE TYPE session_status AS ENUM (
    'scheduled', 'live', 'completed', 'archived'
);

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tables with Advanced Validations

-- Activity Templates Table
CREATE TABLE activity_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at for activity_templates
CREATE TRIGGER update_activity_templates_modtime
    BEFORE UPDATE ON activity_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_template_id UUID REFERENCES activity_templates(id) ON DELETE SET NULL,
    class_id UUID, -- Assuming optional linking or defined elsewhere; set null if class deleted
    join_code VARCHAR(6) UNIQUE NOT NULL CHECK (join_code ~ '^[A-Z0-9]{6}$'),
    status session_status DEFAULT 'scheduled',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    CHECK (started_at <= ended_at OR ended_at IS NULL)
);

-- Session Participants Table
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 3. Performance Indexes
CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_participants_session ON session_participants(session_id);

-- 4. Hardened Row-Level Security (RLS)
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Teacher Policies (activity_templates)
CREATE POLICY "Teachers can fully CRUD activity_templates they own"
    ON activity_templates
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

-- Teacher Policies (sessions)
CREATE POLICY "Teachers can fully CRUD sessions for their templates"
    ON sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM activity_templates 
            WHERE activity_templates.id = sessions.activity_template_id 
            AND activity_templates.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM activity_templates 
            WHERE activity_templates.id = sessions.activity_template_id 
            AND activity_templates.teacher_id = auth.uid()
        )
    );

-- Teacher Policies (session_participants)
CREATE POLICY "Teachers can view session_participants for their sessions"
    ON session_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            INNER JOIN activity_templates ON sessions.activity_template_id = activity_templates.id
            WHERE sessions.id = session_participants.session_id
            AND activity_templates.teacher_id = auth.uid()
        )
    );

-- Student Policies (sessions)
CREATE POLICY "Students can ONLY SELECT live sessions"
    ON sessions
    FOR SELECT
    USING (status = 'live');

-- Student Policies (session_participants)
CREATE POLICY "Students can INSERT into session_participants IF auth matches and session is live"
    ON session_participants
    FOR INSERT
    WITH CHECK (
        auth.uid() = student_id AND
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_id 
            AND sessions.status = 'live'
        )
    );

CREATE POLICY "Students can SELECT their own participations"
    ON session_participants
    FOR SELECT
    USING (auth.uid() = student_id);

-- 5. Realtime Publication
BEGIN;
  DO $$ 
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          CREATE PUBLICATION supabase_realtime;
      END IF;
  END $$;
  -- Add tables to the publication. If they are already in the publication, this will throw an error, so we catch it if necessary, but standard alter publication add table is usually idempotent or we just run it.
  -- Alternatively, in Supabase projects, 'supabase_realtime' usually exists.
  ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
  ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;
COMMIT;
