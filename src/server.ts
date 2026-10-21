import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { initDb } from './db';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

// Setup Swagger UI Documentation
setupSwagger(app);

// Convenient alias /docs -> /api-docs
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// Routes
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'PostgreSQL Auth API Server is running with Prisma ORM',
    documentation: `http://localhost:${PORT}/api-docs`,
    endpoints: {
      swagger: `GET http://localhost:${PORT}/api-docs`,
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me (Bearer token required)',
      profile: 'PUT /api/auth/profile (Bearer token required)',
      health: 'GET /api/auth/health',
    },
  });
});

// Start server after DB initialization
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Auth Backend Server running on http://localhost:${PORT}`);
      console.log(`📖 Swagger UI available at http://localhost:${PORT}/api-docs`);
      console.log(`🔌 PostgreSQL connected on port 5432`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
