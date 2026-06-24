import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/VeriFi AI' });

async function migrate() {
  await client.connect();
  const schema = readFileSync(join(__dirname, '..', 'data', 'schema.sql'), 'utf-8');
  await client.query(schema);
  console.log('Migration complete.');
  await client.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
