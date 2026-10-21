import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_auth_system_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
      return;
    }

    req.user = decoded as { id: number; email: string; role?: string };
    next();
  });
}
