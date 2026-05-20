import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = process.env['DATABASE_URL'] || process.env['POSTGRES_URL'];
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL not configured' });
  const sql = neon(dbUrl);
  const { id } = req.query;
  const invoiceId = parseInt(id as string, 10);

  if (isNaN(invoiceId)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'PUT') {
    try {
      const { client_name, total_amount, paid_amount, invoice_date } = req.body;

      const result = await sql`
        UPDATE invoices
        SET
          client_name = COALESCE(${client_name}, client_name),
          total_amount = COALESCE(${parseFloat(total_amount) || null}, total_amount),
          paid_amount = COALESCE(${parseFloat(paid_amount) || null}, paid_amount),
          invoice_date = COALESCE(${invoice_date || null}, invoice_date),
          updated_at = NOW()
        WHERE id = ${invoiceId}
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

      if (result.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      return res.status(200).json(result[0]);
    } catch (error: any) {
      console.error('PUT error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`
        DELETE FROM invoices WHERE id = ${invoiceId} RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      return res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error: any) {
      console.error('DELETE error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
