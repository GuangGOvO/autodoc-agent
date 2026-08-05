// PostgreSQL 连接池（服务端专用，禁止在客户端组件中导入）
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // 构建/静态生成阶段可能没有环境变量，这里只告警不抛错；
  // 运行期未配置时 pg 会在首次查询时报连接错误
  console.warn('[db] ⚠️ DATABASE_URL 未配置，数据库功能将不可用');
}

// 开发环境热重载时复用连接池，避免连接泄漏
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pool: Pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: connectionString || undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgPool = pool;
}
