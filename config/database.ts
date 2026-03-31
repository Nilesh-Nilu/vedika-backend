import mysql from 'mysql2/promise';

const MYSQL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

const pool = MYSQL_URL
  ? mysql.createPool({ uri: MYSQL_URL, waitForConnections: true, connectionLimit: 10, queueLimit: 0 })
  : mysql.createPool({
      host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
      user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'vedika_customer_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

console.log(`DB connecting via: ${MYSQL_URL ? 'MYSQL_URL' : `${process.env.MYSQLHOST || process.env.DB_HOST || 'localhost'}:${process.env.MYSQLPORT || process.env.DB_PORT || '3306'}`}`);

export default pool;
