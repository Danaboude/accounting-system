import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env['DATABASE_URL']!);

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { client, month, week } = req.query as Record<string, string>;

      const conditions: string[] = [];
      const params: any[] = [];
      let p = 1;

      if (client?.trim()) {
        conditions.push(`client_name ILIKE $${p++}`);
        params.push(`%${client.trim()}%`);
      }
      if (month) {
        conditions.push(`TO_CHAR(invoice_date, 'YYYY-MM') = $${p++}`);
        params.push(month);
      }
      if (week && month) {
        const w = parseInt(week, 10);
        conditions.push(`EXTRACT(DAY FROM invoice_date) >= $${p++}`);
        params.push((w - 1) * 7 + 1);
        conditions.push(`EXTRACT(DAY FROM invoice_date) <= $${p++}`);
        params.push(w * 7);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // neon() used as a function (not template literal) for dynamic queries
      const invoices = await sql(
        `SELECT
           id, invoice_number, client_name,
           CAST(total_amount  AS FLOAT) AS total_amount,
           CAST(paid_amount   AS FLOAT) AS paid_amount,
           CAST(total_amount - paid_amount AS FLOAT) AS debt,
           invoice_date::text, created_at, updated_at
         FROM invoices ${where}
         ORDER BY invoice_date DESC, invoice_number DESC`,
        params
      );

      const statsArr = await sql(
        `SELECT
           COUNT(*)                                          AS total_count,
           COALESCE(SUM(CAST(total_amount AS FLOAT)), 0)    AS total_amount,
           COALESCE(SUM(CAST(paid_amount  AS FLOAT)), 0)    AS total_paid,
           COALESCE(SUM(CAST(total_amount - paid_amount AS FLOAT)), 0) AS total_debt
         FROM invoices ${where}`,
        params
      );

      const s = statsArr[0] as any;
      return res.status(200).json({
        invoices,
        stats: {
          totalCount:  Number(s.total_count),
          totalAmount: Number(s.total_amount),
          totalPaid:   Number(s.total_paid),
          totalDebt:   Number(s.total_debt),
        },
      });
    } catch (err: any) {
      console.error('GET /api/invoices error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { client_name, total_amount, paid_amount, invoice_date } = req.body;
      if (!client_name) return res.status(400).json({ error: 'client_name is required' });

      const maxRow = await sql`SELECT COALESCE(MAX(invoice_number), 0) AS m FROM invoices`;
      const nextNum = Number((maxRow[0] as any).m) + 1;
      const date    = invoice_date || new Date().toISOString().split('T')[0];

      const result = await sql`
        INSERT INTO invoices (invoice_number, client_name, total_amount, paid_amount, invoice_date)
        VALUES (
          ${nextNum}, ${client_name},
          ${Number(total_amount) || 0},
          ${Number(paid_amount)  || 0},
          ${date}
        )
        RETURNING
          id, invoice_number, client_name,
          CAST(total_amount AS FLOAT) AS total_amount,
          CAST(paid_amount  AS FLOAT) AS paid_amount,
          CAST(total_amount - paid_amount AS FLOAT) AS debt,
          invoice_date::text, created_at, updated_at
      `;
      return res.status(201).json(result[0]);
    } catch (err: any) {
      console.error('POST /api/invoices error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
