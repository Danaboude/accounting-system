const fs = require('fs');
const seedSql = fs.readFileSync('generated_seed.js', 'utf8');
let migrate = fs.readFileSync('api/migrate.ts', 'utf8');

const regex = /if \(count === 0\) \{[\s\S]*?message = 'Migration completed successfully and sample data was inserted.';\s*\}/;

migrate = migrate.replace(regex, `if (count === 0) {\n${seedSql}\n      message = 'Migration completed successfully and sample data was inserted.';\n    }`);

fs.writeFileSync('api/migrate.ts', migrate);
console.log('migrate.ts updated');
