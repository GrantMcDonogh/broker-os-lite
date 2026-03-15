-- BrokerOS Lite - Initial Schema

-- Insurance types enum
CREATE TYPE insurance_type AS ENUM ('motor', 'homeowners', 'commercial', 'body_corporate', 'liability', 'claim');

-- Task status enum
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');

-- Chat session type enum
CREATE TYPE session_type AS ENUM ('general', 'task', 'client', 'policy');

-- Chat message role enum
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (no auth, just profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'Broker',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'individual', -- individual, trust, corporate, body_corporate
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insurers
CREATE TABLE insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  insurer_id UUID REFERENCES insurers(id) ON DELETE SET NULL,
  policy_number TEXT,
  insurance_type insurance_type NOT NULL,
  premium NUMERIC(12,2),
  cover_amount NUMERIC(14,2),
  excess NUMERIC(10,2),
  renewal_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks (Kanban board)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  tag_type insurance_type,
  tag_label TEXT,
  due_date DATE,
  is_ai_active BOOLEAN DEFAULT false,
  ai_status TEXT,
  needs_review BOOLEAN DEFAULT false,
  review_label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  session_type session_type DEFAULT 'general',
  scope_label TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  is_internal BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  claim_number TEXT,
  description TEXT,
  amount NUMERIC(12,2),
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_org_status ON tasks(org_id, status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_policies_client ON policies(client_id);
CREATE INDEX idx_policies_renewal ON policies(renewal_date);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_claims_org ON claims(org_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Disable RLS for now (no auth)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Allow anon access to all tables (no auth for now)
CREATE POLICY "Allow all access" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON insurers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON claims FOR ALL USING (true) WITH CHECK (true);
