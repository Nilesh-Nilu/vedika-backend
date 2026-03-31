import { Router, type Request, type Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import pool from '../config/database';

interface CustomerRow extends RowDataPacket {
  customerId: number;
  customerName: string;
  branchName: string;
  organization: string;
  primaryId: string;
  secondaryId: string;
  mobile: string;
}

interface LoanRow extends RowDataPacket {
  customer_id: number;
  loanType: string;
  loanDate: string;
  amount: number;
}

interface Loan {
  loanType: string;
  loanDate: string;
  amount: number;
}

interface CustomerWithLoans {
  customerId: number;
  customerName: string;
  branchName: string;
  organization: string;
  primaryId: string;
  secondaryId: string;
  mobile: string;
  loans: Loan[];
}

const router = Router();

async function getCustomersWithLoans(whereClause: string, params: unknown[]): Promise<CustomerWithLoans[]> {
  const [customers] = await pool.query<CustomerRow[]>(
    `SELECT c.id AS customerId, c.name AS customerName, b.name AS branchName,
            c.organization, c.primary_id AS primaryId, c.secondary_id AS secondaryId, c.mobile
     FROM customer c
     JOIN branch b ON c.branch_id = b.id
     ${whereClause}
     ORDER BY c.id`,
    params
  );

  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.customerId);
  const [loans] = await pool.query<LoanRow[]>(
    `SELECT customer_id, loan_type AS loanType, DATE_FORMAT(loan_date, '%Y-%m-%d') AS loanDate, amount
     FROM loan WHERE customer_id IN (?)
     ORDER BY id`,
    [customerIds]
  );

  const loanMap: Record<number, Loan[]> = {};
  for (const loan of loans) {
    if (!loanMap[loan.customer_id]) loanMap[loan.customer_id] = [];
    loanMap[loan.customer_id].push({
      loanType: loan.loanType,
      loanDate: loan.loanDate,
      amount: loan.amount,
    });
  }

  return customers.map((c) => ({
    customerId: c.customerId,
    customerName: c.customerName,
    branchName: c.branchName,
    organization: c.organization,
    primaryId: c.primaryId,
    secondaryId: c.secondaryId,
    mobile: c.mobile,
    loans: loanMap[c.customerId] || [],
  }));
}

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { searchBy, value } = req.query as { searchBy?: string; value?: string };

    if (!searchBy || !value) {
      return res.status(400).json({ error: 'searchBy and value are required' });
    }

    let result: CustomerWithLoans[];

    switch (searchBy) {
      case 'CUSTOMER_ID':
        result = await getCustomersWithLoans('WHERE c.id = ?', [parseInt(value)]);
        break;
      case 'BRANCH_ID':
        result = await getCustomersWithLoans('WHERE c.branch_id = ?', [parseInt(value)]);
        break;
      case 'LOAN_ID':
        result = await getCustomersWithLoans(
          'WHERE c.id = (SELECT customer_id FROM loan WHERE id = ? LIMIT 1)',
          [parseInt(value)]
        );
        break;
      case 'PRIMARY_ID':
        result = await getCustomersWithLoans('WHERE c.primary_id = ?', [value]);
        break;
      case 'SECONDARY_ID':
        result = await getCustomersWithLoans('WHERE c.secondary_id = ?', [value]);
        break;
      case 'MOBILE_NO':
        result = await getCustomersWithLoans('WHERE c.mobile = ?', [value]);
        break;
      case 'NAME':
        result = await getCustomersWithLoans('WHERE LOWER(c.name) LIKE ?', [`%${value.toLowerCase()}%`]);
        break;
      default:
        return res.status(400).json({ error: 'Invalid searchBy value' });
    }

    res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
