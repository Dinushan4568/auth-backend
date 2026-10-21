import { Router } from 'express';
import { register, login, getMe, updateProfile, healthCheck } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/health', healthCheck);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
