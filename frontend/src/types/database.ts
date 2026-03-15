export type InsuranceType = 'motor' | 'homeowners' | 'commercial' | 'body_corporate' | 'liability' | 'claim'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type SessionType = 'general' | 'task' | 'client' | 'policy'
export type MessageRole = 'user' | 'assistant'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface User {
  id: string
  org_id: string
  full_name: string
  initials: string
  email: string | null
  role: string
  created_at: string
}

export interface Client {
  id: string
  org_id: string
  name: string
  type: string
  contact_email: string | null
  contact_phone: string | null
  created_at: string
}

export interface Insurer {
  id: string
  name: string
  short_code: string | null
  created_at: string
}

export interface Policy {
  id: string
  org_id: string
  client_id: string
  insurer_id: string | null
  policy_number: string | null
  insurance_type: InsuranceType
  premium: number | null
  cover_amount: number | null
  excess: number | null
  renewal_date: string | null
  status: string
  created_at: string
}

export interface Task {
  id: string
  org_id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to: string | null
  client_id: string | null
  policy_id: string | null
  tag_type: InsuranceType | null
  tag_label: string | null
  due_date: string | null
  is_ai_active: boolean
  ai_status: string | null
  needs_review: boolean
  review_label: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  org_id: string
  user_id: string
  title: string
  session_type: SessionType
  scope_label: string | null
  client_id: string | null
  task_id: string | null
  policy_id: string | null
  is_internal: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface Claim {
  id: string
  org_id: string
  client_id: string
  policy_id: string | null
  claim_number: string | null
  description: string | null
  amount: number | null
  status: string
  created_at: string
}

// Supabase Database type for client
export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> }
      insurers: { Row: Insurer; Insert: Partial<Insurer>; Update: Partial<Insurer> }
      policies: { Row: Policy; Insert: Partial<Policy>; Update: Partial<Policy> }
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> }
      chat_sessions: { Row: ChatSession; Insert: Partial<ChatSession>; Update: Partial<ChatSession> }
      chat_messages: { Row: ChatMessage; Insert: Partial<ChatMessage>; Update: Partial<ChatMessage> }
      claims: { Row: Claim; Insert: Partial<Claim>; Update: Partial<Claim> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      insurance_type: InsuranceType
      task_status: TaskStatus
      session_type: SessionType
      message_role: MessageRole
    }
  }
}
