import mysql, { type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import pool from './config/database';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'vedika_customer_db';

export async function initDatabase(): Promise<void> {
  const conn = await mysql.createConnection(DB_CONFIG);

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.query(`USE \`${DB_NAME}\``);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS branch (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS customer (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      primary_id VARCHAR(50) NOT NULL UNIQUE,
      secondary_id VARCHAR(50) NOT NULL UNIQUE,
      mobile VARCHAR(20) NOT NULL,
      organization VARCHAR(255) NOT NULL,
      branch_id BIGINT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branch(id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS loan (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      loan_type VARCHAR(100) NOT NULL,
      loan_date DATE NOT NULL,
      amount DOUBLE NOT NULL,
      customer_id BIGINT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customer(id)
    )
  `);

  await conn.end();
}

export async function seedData(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM branch');
  if ((rows[0] as { cnt: number }).cnt > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  const branches = ['Patna Branch 1', 'Patna Branch 2', 'Patna Branch 3', 'Patna Branch 4'];
  const branchIds: number[] = [];
  for (const name of branches) {
    const [result] = await pool.query<ResultSetHeader>('INSERT INTO branch (name) VALUES (?)', [name]);
    branchIds.push(result.insertId);
  }

  const customerNames = [
    ['Amit Sharma', 'Sanjay Verma', 'Priya Singh', 'Neha Gupta', 'Ram Kumar',
     'Sunita Devi', 'Rajesh Kumar', 'Anita Kumari', 'Vijay Yadav', 'Meena Kumari'],
    ['Rakesh Singh', 'Pooja Sharma', 'Manoj Tiwari', 'Kavita Devi', 'Suresh Prasad',
     'Renu Singh', 'Deepak Verma', 'Sarita Kumari', 'Arun Yadav', 'Geeta Devi'],
    ['Ramesh Gupta', 'Suman Kumari', 'Ashok Singh', 'Rekha Devi', 'Mohan Kumar',
     'Nirmala Singh', 'Sunil Prasad', 'Asha Kumari', 'Dinesh Yadav', 'Pushpa Devi'],
    ['Prakash Verma', 'Lata Sharma', 'Ganesh Singh', 'Rita Kumari', 'Mahesh Prasad',
     'Kamla Devi', 'Santosh Kumar', 'Usha Singh', 'Ravi Yadav', 'Kiran Devi'],
  ];

  const loanTypes = ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Gold Loan'];
  let custNum = 0;

  for (let b = 0; b < 4; b++) {
    for (let i = 0; i < 10; i++) {
      custNum++;
      const pid = `PRI${String(custNum).padStart(3, '0')}`;
      const sid = `SEC${String(custNum).padStart(3, '0')}`;
      const mobile = custNum <= 9
        ? `999999999${custNum}`
        : `9999900${String(custNum).padStart(3, '0')}`;

      const [custResult] = await pool.query<ResultSetHeader>(
        'INSERT INTO customer (name, primary_id, secondary_id, mobile, organization, branch_id) VALUES (?, ?, ?, ?, ?, ?)',
        [customerNames[b][i], pid, sid, mobile, 'BSPTCL Patna', branchIds[b]]
      );
      const customerId = custResult.insertId;

      if (custNum === 5) {
        const ram_loans: Array<[string, string, number]> = [
          ['Home Loan', '2025-01-15', 50000],
          ['Car Loan', '2025-03-10', 25000],
          ['Personal Loan', '2025-05-20', 30000],
          ['Education Loan', '2025-07-01', 40000],
          ['Gold Loan', '2025-09-15', 20000],
        ];
        for (const [type, date, amount] of ram_loans) {
          await pool.query(
            'INSERT INTO loan (loan_type, loan_date, amount, customer_id) VALUES (?, ?, ?, ?)',
            [type, date, amount, customerId]
          );
        }
      } else {
        const baseAmounts = [50000, 25000, 30000, 40000, 20000];
        for (let j = 0; j < 5; j++) {
          const offset = (custNum * 7) % 5;
          let amount = baseAmounts[(j + offset) % 5] + ((custNum * 1000) % 50001);
          amount = Math.max(10000, Math.min(100000, amount));

          const yearChoice = (custNum + j) % 2 === 0 ? 2024 : 2025;
          const month = ((custNum + j) % 12) + 1;
          const day = Math.min(((custNum + j * 3) % 28) + 1, 28);
          const dateStr = `${yearChoice}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          await pool.query(
            'INSERT INTO loan (loan_type, loan_date, amount, customer_id) VALUES (?, ?, ?, ?)',
            [loanTypes[j], dateStr, amount, customerId]
          );
        }
      }
    }
  }

  console.log('Seeded: 4 branches, 40 customers, 200 loans.');
}
