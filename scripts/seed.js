import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/VeriFi AI' });

async function seed() {
  await client.connect();
  const hash = await bcrypt.hash('Admin123!', 10);
  await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('admin@VeriFi AI.com', $1, 'Admin', 'User', 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('demo@VeriFi AI.com', $1, 'Demo', 'User', 'user')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  console.log('Seed complete. Demo users: admin@VeriFi AI.com, demo@VeriFi AI.com (password: Admin123!)');
  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
