// 幂等数据库迁移脚本：按序应用 db/migrations/*.sql 中未执行的迁移
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL 未配置');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const migrationsDir = join(process.cwd(), 'db', 'migrations');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);

    const { rows } = await client.query('select name from schema_migrations');
    const applied = new Set(rows.map(r => r.name));
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[skip] ${file}`);
        continue;
      }
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`[apply] ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (name) values ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    console.log('✅ 数据库迁移完成');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ 数据库迁移失败:', err.message);
  process.exit(1);
});
