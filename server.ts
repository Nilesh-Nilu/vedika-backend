import express from 'express';
import cors from 'cors';
import { initDatabase, seedData } from './seed';
import authRoutes from './routes/auth';
import branchRoutes from './routes/branches';
import customerRoutes from './routes/customers';

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/customers', customerRoutes);

async function start(): Promise<void> {
  await initDatabase();
  await seedData();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
