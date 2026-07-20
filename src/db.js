import sql from 'mssql';

const config = {
  user: process.env.AZURE_SQL_USER || 'siteadmin',
  password: process.env.AZURE_SQL_PASSWORD || 'P@ssw0rd1234',
  server: process.env.AZURE_SQL_SERVER || 'ftseoul.database.windows.net',
  database: process.env.AZURE_SQL_DATABASE || 'free-sql-db-bizenglish',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Next.js 개발 모드에서 HMR(Hot Module Reload) 시 커넥션 풀 중복 생성 방지
// globalThis에 캐싱하여 모듈 리로드 시에도 기존 풀 재사용
const globalForDb = globalThis;

export async function connectToDatabase() {
  if (!globalForDb.__sqlPool) {
    globalForDb.__sqlPool = new sql.ConnectionPool(config)
      .connect()
      .then(pool => {
        console.log('Azure SQL Database pool connected.');
        return pool;
      })
      .catch(err => {
        console.error('Database Connection Failed: ', err);
        globalForDb.__sqlPool = null;
        throw err;
      });
  }
  return globalForDb.__sqlPool;
}
