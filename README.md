# Vedika Backend

REST API server for the Vedika Customer Management system. Built with Express.js, TypeScript, and MySQL.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 4
- **Language:** TypeScript 5
- **Database:** MySQL 8
- **ORM/Driver:** mysql2 (promise-based)

## Features

- **Authentication** — Login with lockout protection (3 failed attempts = 15 min lock)
- **Customer Search** — Multi-criteria search (by ID, name, mobile, branch, loan, primary/secondary ID)
- **Branch Listing** — Fetch all branches
- **Auto Seeding** — Database and tables are created on startup; seed data (4 branches, 40 customers, 200 loans) is inserted if empty

## Database Schema

```
branch
├── id         BIGINT (PK, auto-increment)
└── name       VARCHAR(255)

customer
├── id             BIGINT (PK, auto-increment)
├── name           VARCHAR(255)
├── primary_id     VARCHAR(50) UNIQUE
├── secondary_id   VARCHAR(50) UNIQUE
├── mobile         VARCHAR(20)
├── organization   VARCHAR(255)
└── branch_id      BIGINT (FK → branch.id)

loan
├── id            BIGINT (PK, auto-increment)
├── loan_type     VARCHAR(100)
├── loan_date     DATE
├── amount        DOUBLE
└── customer_id   BIGINT (FK → customer.id)
```

## API Endpoints

### Auth

| Method | Endpoint          | Body                             | Description            |
|--------|-------------------|----------------------------------|------------------------|
| POST   | `/api/auth/login` | `{ username, password }` (JSON)  | Login with credentials |

Default credentials: `admin` / `admin123`

### Branches

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| GET    | `/api/branches`  | List all branches  |

### Customers

| Method | Endpoint                                     | Description                  |
|--------|----------------------------------------------|------------------------------|
| GET    | `/api/customers/search?searchBy=X&value=Y`   | Search customers with loans  |

**`searchBy` options:**

| Value          | Description                      | Example `value` |
|----------------|----------------------------------|-----------------|
| `CUSTOMER_ID`  | Exact customer ID                | `1`             |
| `BRANCH_ID`    | All customers in a branch        | `2`             |
| `LOAN_ID`      | Customer who owns a specific loan| `5`             |
| `PRIMARY_ID`   | Exact primary ID                 | `PRI001`        |
| `SECONDARY_ID` | Exact secondary ID               | `SEC001`        |
| `MOBILE_NO`    | Exact mobile number              | `9999999991`    |
| `NAME`         | Partial name match (case-insensitive) | `amit`     |

### Response Format (Customer Search)

```json
[
  {
    "customerId": 1,
    "customerName": "Amit Sharma",
    "branchName": "Patna Branch 1",
    "organization": "BSPTCL Patna",
    "primaryId": "PRI001",
    "secondaryId": "SEC001",
    "mobile": "9999999991",
    "loans": [
      {
        "loanType": "Home Loan",
        "loanDate": "2025-01-15",
        "amount": 50000
      }
    ]
  }
]
```

## Prerequisites

- Node.js 18+
- MySQL 8 running on `localhost:3306`

## Setup

```bash
# Install dependencies
npm install

# Start in development mode (auto-creates DB, tables, and seeds data)
npm run dev

# Or build and run production
npm run build
npm start
```

## Environment Variables

| Variable      | Default               | Description       |
|---------------|-----------------------|-------------------|
| `DB_HOST`     | `localhost`           | MySQL host        |
| `DB_PORT`     | `3306`                | MySQL port        |
| `DB_USER`     | `root`                | MySQL user        |
| `DB_PASSWORD` | (empty)               | MySQL password    |
| `DB_NAME`     | `vedika_customer_db`  | Database name     |

The server runs on port **8080**.

## Project Structure

```
backend/
├── config/
│   └── database.ts       # MySQL connection pool
├── routes/
│   ├── auth.ts           # Login with lockout
│   ├── branches.ts       # Branch listing
│   └── customers.ts      # Customer search with loans
├── seed.ts               # DB init + seed data
├── server.ts             # Express app entry point
├── package.json
└── tsconfig.json
```
