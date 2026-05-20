import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbUrl = process.env['DATABASE_URL'] || process.env['POSTGRES_URL'];
    if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not configured' });
    const sql = neon(dbUrl);

    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number INTEGER UNIQUE NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    return res.status(200).json({ message: 'Migration completed successfully' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
