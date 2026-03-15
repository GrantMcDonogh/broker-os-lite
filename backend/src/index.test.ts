import { describe, it, before } from 'node:test';
import assert from 'node:assert';

const API_URL = process.env.API_URL || 'https://inspiring-empathy-production.up.railway.app';
const ORG_ID = 'a0000000-0000-0000-0000-000000000001';

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  return { status: res.status, data: await res.json() };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

describe('Tasks API', () => {
  let createdTaskId: string;

  it('GET /api/tasks — returns array with correct statuses and required fields', async () => {
    const { status, data } = await api(`/api/tasks?org_id=${ORG_ID}`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');
    assert.ok(data.length > 0, 'should have at least one task');

    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    const foundStatuses = new Set(data.map((t: any) => t.status));
    for (const s of foundStatuses) {
      assert.ok(validStatuses.includes(s), `unexpected status: ${s}`);
    }

    for (const task of data) {
      assert.ok(task.id, 'task should have id');
      assert.ok(task.title, 'task should have title');
      assert.ok(task.status, 'task should have status');
      assert.ok(task.org_id, 'task should have org_id');
    }
  });

  it('POST /api/tasks — creates a new task', async () => {
    const { status, data } = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        org_id: ORG_ID,
        title: 'Integration test task',
        description: 'Created by automated test',
        status: 'todo',
        sort_order: 999,
      }),
    });
    assert.strictEqual(status, 200, `POST failed: ${JSON.stringify(data)}`);
    assert.ok(data.id, 'created task should have an id');
    assert.strictEqual(data.title, 'Integration test task');
    assert.strictEqual(data.status, 'todo');
    createdTaskId = data.id;
  });

  it('PATCH /api/tasks/:id — updates the task title', async () => {
    assert.ok(createdTaskId, 'depends on POST creating a task');
    const { status, data } = await api(`/api/tasks/${createdTaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated integration test task' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.title, 'Updated integration test task');
    assert.strictEqual(data.id, createdTaskId);
  });

  it('DELETE /api/tasks/:id — deletes the created task', async () => {
    assert.ok(createdTaskId, 'depends on POST creating a task');
    const { status, data } = await api(`/api/tasks/${createdTaskId}`, {
      method: 'DELETE',
    });
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, { success: true });
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

describe('Users API', () => {
  it('GET /api/users — returns Grant McDonogh and Sarah Peters with initials', async () => {
    const { status, data } = await api(`/api/users?org_id=${ORG_ID}`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');

    const names = data.map((u: any) => u.full_name);
    assert.ok(names.includes('Grant McDonogh'), 'should include Grant McDonogh');
    assert.ok(names.includes('Sarah Peters'), 'should include Sarah Peters');

    for (const user of data) {
      assert.ok(user.initials, `user ${user.full_name} should have initials`);
    }
  });
});

// ─── Clients ──────────────────────────────────────────────────────────────────

describe('Clients API', () => {
  it('GET /api/clients — returns array with enriched fields', async () => {
    const { status, data } = await api(`/api/clients?org_id=${ORG_ID}`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');
    assert.ok(data.length > 0, 'should have at least one client');

    for (const client of data) {
      assert.ok('policy_count' in client, 'client should have policy_count');
      assert.ok('total_premium' in client, 'client should have total_premium');
    }

    const vdm = data.find((c: any) => c.name.includes('Van der Merwe'));
    assert.ok(vdm, 'should include Van der Merwe Family Trust');
    assert.strictEqual(vdm.policy_count, 3, 'Van der Merwe should have 3 policies');
  });
});

// ─── Policies ─────────────────────────────────────────────────────────────────

describe('Policies API', () => {
  it('GET /api/policies?org_id — returns policies with insurer_name', async () => {
    const { status, data } = await api(`/api/policies?org_id=${ORG_ID}`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');
    assert.ok(data.length > 0, 'should have at least one policy');

    for (const policy of data) {
      assert.ok('insurer_name' in policy, 'policy should have insurer_name');
    }
  });

  it('GET /api/policies?client_id — returns 3 policies for Van der Merwe Trust', async () => {
    const clientId = 'd0000000-0000-0000-0000-000000000001';
    const { status, data } = await api(`/api/policies?client_id=${clientId}`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');
    assert.strictEqual(data.length, 3, 'Van der Merwe Trust should have 3 policies');
  });
});

// ─── Insurers ─────────────────────────────────────────────────────────────────

describe('Insurers API', () => {
  it('GET /api/insurers — returns array including known insurers', async () => {
    const { status, data } = await api('/api/insurers');
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');

    const names = data.map((i: any) => i.name);
    for (const expected of ['Santam', 'Hollard', 'Bryte', 'Old Mutual Insure']) {
      assert.ok(names.includes(expected), `should include ${expected}`);
    }
  });
});

// ─── Claims ───────────────────────────────────────────────────────────────────

describe('Claims API', () => {
  it('GET /api/claims?status=open — returns open claims', async () => {
    const { status, data } = await api(`/api/claims?org_id=${ORG_ID}&status=open`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');

    for (const claim of data) {
      assert.strictEqual(claim.status, 'open', 'all claims should be open');
    }
  });

  it('GET /api/claims — returns all claims (more than just open)', async () => {
    const { status: s1, data: openClaims } = await api(`/api/claims?org_id=${ORG_ID}&status=open`);
    const { status: s2, data: allClaims } = await api(`/api/claims?org_id=${ORG_ID}`);
    assert.strictEqual(s1, 200);
    assert.strictEqual(s2, 200);
    assert.ok(allClaims.length >= openClaims.length, 'all claims should be >= open claims');
  });
});

// ─── Chat Sessions & Messages ─────────────────────────────────────────────────

describe('Chat Sessions API', () => {
  let testSessionId: string;

  it('GET /api/chat-sessions — returns array of sessions', async () => {
    const { status, data } = await api(`/api/chat-sessions?org_id=${ORG_ID}`);
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(data), 'response should be an array');
  });

  it('POST /api/chat-sessions — creates a new session', async () => {
    const { status, data } = await api('/api/chat-sessions', {
      method: 'POST',
      body: JSON.stringify({
        org_id: ORG_ID,
        title: 'Test chat session',
        user_id: 'b0000000-0000-0000-0000-000000000001',
      }),
    });
    assert.strictEqual(status, 200);
    assert.ok(data.id, 'session should have an id');
    assert.strictEqual(data.title, 'Test chat session');
    testSessionId = data.id;
  });

  it('PATCH /api/chat-sessions/:id — updates the session title', async () => {
    assert.ok(testSessionId, 'depends on POST creating a session');
    const { status, data } = await api(`/api/chat-sessions/${testSessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated test chat session' }),
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.title, 'Updated test chat session');
  });

  describe('Chat Messages API', () => {
    let testMessageId: string;

    it('POST /api/chat-messages — creates a message in the test session', async () => {
      assert.ok(testSessionId, 'depends on chat session being created');
      const { status, data } = await api('/api/chat-messages', {
        method: 'POST',
        body: JSON.stringify({
          session_id: testSessionId,
          role: 'user',
          content: 'Hello from integration test',
        }),
      });
      assert.strictEqual(status, 200);
      assert.ok(data.id, 'message should have an id');
      assert.strictEqual(data.role, 'user');
      assert.strictEqual(data.content, 'Hello from integration test');
      testMessageId = data.id;
    });

    it('GET /api/chat-messages?session_id — returns the created message', async () => {
      assert.ok(testSessionId, 'depends on chat session being created');
      const { status, data } = await api(`/api/chat-messages?session_id=${testSessionId}`);
      assert.strictEqual(status, 200);
      assert.ok(Array.isArray(data), 'response should be an array');
      assert.ok(data.length > 0, 'should have at least one message');

      const msg = data.find((m: any) => m.id === testMessageId);
      assert.ok(msg, 'should find the created message');
      assert.strictEqual(msg.content, 'Hello from integration test');
    });
  });

  // Cleanup: we don't have a DELETE endpoint for chat sessions/messages,
  // so we leave the test data. It uses unique titles and won't interfere.
});
