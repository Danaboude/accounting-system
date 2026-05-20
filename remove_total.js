const fs = require('fs');
let migrate = fs.readFileSync('api/migrate.ts', 'utf8');
const lines = migrate.split('\n');
const filtered = lines.filter(line => !line.includes('Total') || !line.includes('undefined'));
let result = filtered.join('\n');
// Also we need to fix the trailing comma if the Total line was the last one!
result = result.replace(/,\s*\n\s*ON CONFLICT/, '\n        ON CONFLICT');
fs.writeFileSync('api/migrate.ts', result);
console.log('Filtered Total line, new length:', filtered.length);
