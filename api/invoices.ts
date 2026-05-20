import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env['DATABASE_URL']!);

  if (req.method === 'GET') {
    try {
      const { client, month, week } = req.query as Record<string, string>;

      let conditions: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      if (client) {
        conditions.push(`client_name ILIKE $${paramIndex}`);
        params.push(`%${client}%`);
        paramIndex++;
      }

      if (month) {
        conditions.push(`TO_CHAR(invoice_date, 'YYYY-MM') = $${paramIndex}`);
        params.push(month);
        paramIndex++;
      }

      if (week && month) {
        const weekNum = parseInt(week, 10);
        const startDay = (weekNum - 1) * 7 + 1;
        const endDay = weekNum * 7;
        conditions.push(`EXTRACT(DAY FROM invoice_date) >= $${paramIndex}`);
        params.push(startDay);
        paramIndex++;
        conditions.push(`EXTRACT(DAY FROM invoice_date) <= $${paramIndex}`);
        params.push(endDay);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          id,
          invoice_number,
          client_name,
          CAST(total_amount AS FLOAT) as total_amount,
          CAST(paid_amount AS FLOAT) as paid_amount,
          CAST(total_amount - paid_amount AS FLOAT) as debt,
          invoice_date,
          created_at,
          updated_at
        FROM invoices
        ${whereClause}
        ORDER BY invoice_number DESC
      `;

      const rows = await sql.query(query, params);

      // Stats
      const statsQuery = `
        SELECT
          COUNT(*) as total_count,
          COALESCE(SUM(CAST(total_amount AS FLOAT)), 0) as total_amount,
          COALESCE(SUM(CAST(paid_amount AS FLOAT)), 0) as total_paid,
          COALESCE(SUM(CAST(total_amount - paid_amount AS FLOAT)), 0) as total_debt
        FROM invoices
        ${whereClause}
      `;

      const statsRows = await sql.query(statsQuery, params);
      const stats = statsRows.rows[0];

      return res.status(200).json({
        invoices: rows.rows,
        stats: {
          totalCount: parseInt(stats.total_count, 10),
          totalAmount: parseFloat(stats.total_amount),
          totalPaid: parseFloat(stats.total_paid),
          totalDebt: parseFloat(stats.total_debt),
        },
      });
    } catch (error: any) {
      console.error('GET error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { client_name, total_amount, paid_amount, invoice_date } = req.body;

      if (!client_name) {
        return res.status(400).json({ error: 'client_name is required' });
      }

      // Auto-generate invoice number
      const maxResult = await sql`SELECT COALESCE(MAX(invoice_number), 0) as max_num FROM invoices`;
      const nextNumber = (maxResult[0].max_num as number) + 1;

      const date = invoice_date || new Date().toISOString().split('T')[0];

      const result = await sql`
        INSERT INTO invoices (invoice_number, client_name, total_amount, paid_amount, invoice_date)
        VALUES (
          ${nextNumber},
          ${client_name},
          ${parseFloat(total_amount) || 0},
          ${parseFloat(paid_amount) || 0},
          ${date}
        )
        RETURNING
          id,
          invoice_number,
          client_name,
          CAST(total_amount AS FLOAT) as total_amount,
          CAST(paid_amount AS FLOAT) as paid_amount,
          CAST(total_amount - paid_amount AS FLOAT) as debt,
          invoice_date,
          created_at,
          updated_at
      `;

      return res.status(201).json(result[0]);
    } catch (error: any) {
      console.error('POST error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
