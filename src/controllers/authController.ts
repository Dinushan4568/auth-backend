import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_auth_system_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function getDefaultAvatar(name: string): string {
  const encodedName = encodeURIComponent(name.trim());
  return `https://ui-avatars.com/api/?name=${encodedName}&background=4f46e5&color=fff&size=128&bold=true`;
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Name must be at least 2 characters long.' });
      return;
    }

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Valid email is required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    // Check if user exists using Prisma
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = getDefaultAvatar(name);

    // Create user using Prisma Client
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        avatarUrl,
        role: 'user',
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully with Prisma ORM!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar_url: newUser.avatarUrl,
        role: newUser.role,
        created_at: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('[Prisma AuthController.register] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while creating account.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Query user using Prisma
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatarUrl || getDefaultAvatar(user.name),
        role: user.role,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Prisma AuthController.login] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User account not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatarUrl || getDefaultAvatar(user.name),
        role: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Prisma AuthController.getMe] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, avatar_url } = req.body;
    if (!name || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
        ...(avatar_url ? { avatarUrl: avatar_url } : {}),
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar_url: updated.avatarUrl,
        role: updated.role,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Prisma AuthController.updateProfile] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const dbRes = await prisma.$queryRaw<Array<{ current_time: Date; db: string }>>`SELECT NOW() as current_time, current_database() as db;`;
    res.json({
      status: 'healthy',
      serverTime: new Date().toISOString(),
      database: {
        connected: true,
        orm: 'Prisma 6.4.1',
        databaseName: dbRes[0]?.db || 'auth_db',
        postgresTime: dbRes[0]?.current_time,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: {
        connected: false,
        orm: 'Prisma 6.4.1',
        error: error.message,
      },
    });
  }
}
