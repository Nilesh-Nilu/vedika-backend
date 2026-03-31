import { Router, type Request, type Response } from 'express';

const router = Router();

const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 15 * 60 * 1000;

const failedAttempts = new Map<string, number>();
const lockoutTimestamps = new Map<string, number>();

function isLockedOut(username: string): boolean {
  const lockTime = lockoutTimestamps.get(username);
  if (!lockTime) return false;
  if (Date.now() - lockTime > LOCKOUT_MS) {
    lockoutTimestamps.delete(username);
    failedAttempts.delete(username);
    return false;
  }
  return true;
}

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };

  if (isLockedOut(username)) {
    const remainingMs = lockoutTimestamps.get(username)! + LOCKOUT_MS - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return res.json({
      success: false,
      message: `Account is locked. Try again in ${remainingMin} minutes.`,
    });
  }

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    failedAttempts.delete(username);
    lockoutTimestamps.delete(username);
    return res.json({ success: true, message: 'Login successful' });
  }

  const attempts = (failedAttempts.get(username) || 0) + 1;
  failedAttempts.set(username, attempts);

  if (attempts >= MAX_ATTEMPTS) {
    lockoutTimestamps.set(username, Date.now());
    return res.json({
      success: false,
      message: `Account is locked due to ${MAX_ATTEMPTS} failed attempts. Try again in 15 minutes.`,
    });
  }

  const remaining = MAX_ATTEMPTS - attempts;
  res.json({
    success: false,
    message: `Invalid credentials. ${remaining} attempt(s) remaining.`,
  });
});

export default router;
