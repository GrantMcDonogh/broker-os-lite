const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Tasks
  getTasks: (orgId: string) => request<any[]>(`/api/tasks?org_id=${orgId}`),
  createTask: (task: any) => request<any>('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id: string, data: any) => request<any>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (orgId: string) => request<any[]>(`/api/users?org_id=${orgId}`),

  // Chat Sessions
  getChatSessions: (orgId: string) => request<any[]>(`/api/chat-sessions?org_id=${orgId}`),
  createChatSession: (session: any) => request<any>('/api/chat-sessions', { method: 'POST', body: JSON.stringify(session) }),
  updateChatSession: (id: string, data: any) => request<any>(`/api/chat-sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Chat Messages
  getChatMessages: (sessionId: string) => request<any[]>(`/api/chat-messages?session_id=${sessionId}`),
  createChatMessage: (msg: any) => request<any>('/api/chat-messages', { method: 'POST', body: JSON.stringify(msg) }),

  // Claims
  getClaims: (orgId: string, status?: string) => request<any[]>(`/api/claims?org_id=${orgId}${status ? `&status=${status}` : ''}`),

  // Clients
  getClients: (orgId: string) => request<any[]>(`/api/clients?org_id=${orgId}`),

  // Policies
  getPolicies: (orgId: string) => request<any[]>(`/api/policies?org_id=${orgId}`),
  getPoliciesByClient: (clientId: string) => request<any[]>(`/api/policies?client_id=${clientId}`),

  // Insurers
  getInsurers: () => request<any[]>('/api/insurers'),
};
