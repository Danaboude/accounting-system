import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// We use a simple multipart parser since we don't want heavy dependencies in serverless
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(body: Buffer, boundary: string): Buffer | null {
  const boundaryBuffer = Buffer.from('--' + boundary);
  const parts = [];
  let start = 0;

  while (start < body.length) {
    const boundaryIdx = body.indexOf(boundaryBuffer, start);
    if (boundaryIdx === -1) break;
    start = boundaryIdx + boundaryBuffer.length;

    // Skip \r\n after boundary
    if (body[start] === 13 && body[start + 1] === 10) {
      start += 2;
    } else if (body[start] === 45 && body[start + 1] === 45) {
      break; // End boundary
    }

    // Find end of headers
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), start);
    if (headerEnd === -1) break;

    const headers = body.slice(start, headerEnd).toString();
    start = headerEnd + 4;

    // Find next boundary
    const nextBoundary = body.indexOf(boundaryBuffer, start);
    const partEnd = nextBoundary !== -1 ? nextBoundary - 2 : body.length;

    if (headers.includes('filename=') || headers.includes('application/')) {
      parts.push(body.slice(start, partEnd));
    }

    start = nextBoundary !== -1 ? nextBoundary : body.length;
  }

  return parts.length > 0 ? parts[0] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);

    let xlsxBuffer: Buffer | null = null;

    if (boundaryMatch) {
      const rawBody = await getRawBody(req);
      xlsxBuffer = parseMultipart(rawBody, boundaryMatch[1]);
    } else {
      // If sent as raw buffer
      xlsxBuffer = await getRawBody(req);
    }

    if (!xlsxBuffer || xlsxBuffer.length === 0) {
      return res.status(400).json({ error: 'No file received' });
    }

    // Dynamically import xlsx
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(xlsxBuffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No rows found in the file' });
    }

    const sql = neon(process.env['DATABASE_URL']!);

    // Get current max invoice number
    const maxResult = await sql`SELECT COALESCE(MAX(invoice_number), 0) as max_num FROM invoices`;
    let nextNum = (maxResult[0].max_num as number) + 1;

    const inserted: any[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const invoiceNum = row['رقم الفاتورة'] ? parseInt(row['رقم الفاتورة'], 10) : nextNum;
        const clientName = row['اسم العميل'] || '';
        const totalAmount = parseFloat(row['اجمالي الفاتورة']) || 0;
        const paidAmount = parseFloat(row['المقبوضات']) || 0;

        let invoiceDate: string;
        const rawDate = row['التاريخ'];
        if (rawDate instanceof Date) {
          invoiceDate = rawDate.toISOString().split('T')[0];
        } else if (typeof rawDate === 'string' && rawDate.trim()) {
          invoiceDate = rawDate.trim();
        } else {
          invoiceDate = new Date().toISOString().split('T')[0];
        }

        if (!clientName) {
          errors.push(`Row skipped: missing client name`);
          continue;
        }

        const result = await sql`
          INSERT INTO invoices (invoice_number, client_name, total_amount, paid_amount, invoice_date)
          VALUES (${invoiceNum}, ${clientName}, ${totalAmount}, ${paidAmount}, ${invoiceDate})
          ON CONFLICT (invoice_number) DO UPDATE SET
            client_name = EXCLUDED.client_name,
            total_amount = EXCLUDED.total_amount,
            paid_amount = EXCLUDED.paid_amount,
            invoice_date = EXCLUDED.invoice_date,
            updated_at = NOW()
          RETURNING id, invoice_number
        `;
        inserted.push(result[0]);
        nextNum = Math.max(nextNum, invoiceNum + 1);
      } catch (rowError: any) {
        errors.push(`Row error: ${rowError.message}`);
      }
    }

    return res.status(200).json({
      inserted: inserted.length,
      errors,
      message: `Successfully imported ${inserted.length} invoices`,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: error.message });
  }
}
