const fs = require('fs');
const XLSX = require('xlsx');
const workbook = XLSX.readFile('C:\\\\Users\\\\abdul kareem\\\\Desktop\\\\حساب المشروب - نسخة3.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return new Date();
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return date_info;
}

const values = data.map(row => {
  const invNum = row['رقم الفاتورة'] || 0;
  const client = String(row['اسم العميل']).replace(/'/g, "''");
  const total = parseFloat(row['اجمالي الفاتورة']) || 0;
  const paid = parseFloat(row['المقبوضات ']) || 0;
  const d = excelDateToJSDate(row['التاريخ ']);
  const dateStr = d.toISOString().split('T')[0];
  return `(${invNum}, '${client}', ${total}, ${paid}, '${dateStr}')`;
});

const sql = `
      await sql\`
        INSERT INTO invoices (invoice_number, client_name, total_amount, paid_amount, invoice_date)
        VALUES 
        ${values.join(',\n        ')}
        ON CONFLICT (invoice_number) DO NOTHING
      \`;
`;
fs.writeFileSync('generated_seed.js', sql);
console.log('Seed size:', sql.length);
