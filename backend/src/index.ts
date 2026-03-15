import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Tasks ───────────────────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try {
    const { org_id } = req.query;
    const result = await pool.query(
      `SELECT t.*, u.initials AS assigned_user_initials, u.full_name AS assigned_user_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.org_id = $1
       ORDER BY t.sort_order`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { org_id, title, description, status, assigned_to, due_date, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (org_id, title, description, status, assigned_to, due_date, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [org_id, title, description, status, assigned_to, due_date, sort_order]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    const sets = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key]);
    const result = await pool.query(
      `UPDATE tasks SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  try {
    const { org_id } = req.query;
    const result = await pool.query(
      'SELECT * FROM users WHERE org_id = $1',
      [org_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Chat Sessions ──────────────────────────────────────────────────────────

app.get('/api/chat-sessions', async (req, res) => {
  try {
    const { org_id } = req.query;
    const result = await pool.query(
      'SELECT * FROM chat_sessions WHERE org_id = $1 ORDER BY updated_at DESC',
      [org_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat-sessions', async (req, res) => {
  try {
    const { org_id, title, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO chat_sessions (org_id, title, user_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [org_id, title, user_id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/chat-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    const sets = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key]);
    const result = await pool.query(
      `UPDATE chat_sessions SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Chat Messages ──────────────────────────────────────────────────────────

app.get('/api/chat-messages', async (req, res) => {
  try {
    const { session_id } = req.query;
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
      [session_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat-messages', async (req, res) => {
  try {
    const { session_id, role, content } = req.body;
    const result = await pool.query(
      `INSERT INTO chat_messages (session_id, role, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session_id, role, content]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Claims ─────────────────────────────────────────────────────────────────

app.get('/api/claims', async (req, res) => {
  try {
    const { org_id, status } = req.query;
    let query = `SELECT cl.*, c.name AS client_name, p.policy_number
       FROM claims cl
       LEFT JOIN clients c ON cl.client_id = c.id
       LEFT JOIN policies p ON cl.policy_id = p.id
       WHERE cl.org_id = $1`;
    const params: any[] = [org_id];
    if (status) {
      query += ' AND cl.status = $2';
      params.push(status);
    }
    query += ' ORDER BY cl.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/claims/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    const sets = keys.map((key, i) => `${key} = $${i + 2}`);
    const values = keys.map((key) => fields[key]);
    const result = await pool.query(
      `UPDATE claims SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Clients ────────────────────────────────────────────────────────────────

app.get('/api/clients', async (req, res) => {
  try {
    const { org_id } = req.query;
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(p.policy_count, 0)::int AS policy_count,
        COALESCE(p.total_premium, 0)::numeric AS total_premium
       FROM clients c
       LEFT JOIN (
         SELECT client_id, COUNT(*)::int AS policy_count, SUM(premium) AS total_premium
         FROM policies
         WHERE status = 'active'
         GROUP BY client_id
       ) p ON c.id = p.client_id
       WHERE c.org_id = $1
       ORDER BY p.total_premium DESC NULLS LAST, c.name`,
      [org_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Policies ───────────────────────────────────────────────────────────────

app.get('/api/policies', async (req, res) => {
  try {
    const { org_id, client_id } = req.query;
    const baseSelect = `SELECT p.*, i.name AS insurer_name, i.short_code AS insurer_code, c.name AS client_name
       FROM policies p
       LEFT JOIN insurers i ON p.insurer_id = i.id
       LEFT JOIN clients c ON p.client_id = c.id`;
    if (client_id) {
      const result = await pool.query(
        `${baseSelect} WHERE p.client_id = $1 ORDER BY p.renewal_date`,
        [client_id]
      );
      res.json(result.rows);
    } else {
      const result = await pool.query(
        `${baseSelect} WHERE p.org_id = $1 ORDER BY p.renewal_date`,
        [org_id]
      );
      res.json(result.rows);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Insurers ──────────────────────────────────────────────────────────────

app.get('/api/insurers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM insurers ORDER BY name');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
