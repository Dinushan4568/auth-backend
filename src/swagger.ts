import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Auth API Documentation',
    version: '1.0.0',
    description: 'REST API documentation for Next.js & PostgreSQL 18 Auth system with Prisma ORM.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          avatar_url: { type: 'string', example: 'https://ui-avatars.com/api/?name=John+Doe' },
          role: { type: 'string', example: 'user' },
          created_at: { type: 'string', format: 'date-time', example: '2026-10-21T13:27:46.130Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-10-21T13:27:46.130Z' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          password: { type: 'string', minLength: 6, example: 'Password123!' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      ProfileUpdateInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Johnathan Doe' },
          avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Logged in successfully!' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid email or password.' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          serverTime: { type: 'string', format: 'date-time' },
          database: {
            type: 'object',
            properties: {
              connected: { type: 'boolean', example: true },
              orm: { type: 'string', example: 'Prisma 6.4.1' },
              databaseName: { type: 'string', example: 'auth_db' },
              postgresTime: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Creates a new user record in PostgreSQL via Prisma and returns a signed JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: {
            description: 'Validation error (invalid input)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in to an existing account',
        description: 'Verifies user email & password against PostgreSQL and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Logged in successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Returns the authenticated user details from PostgreSQL based on the Bearer token.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized - invalid or missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/profile': {
      put: {
        tags: ['Authentication'],
        summary: 'Update user profile',
        description: 'Updates the user name or avatar URL in PostgreSQL.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProfileUpdateInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/health': {
      get: {
        tags: ['System'],
        summary: 'Server & PostgreSQL Health Check',
        description: 'Checks connectivity to PostgreSQL 18 and Prisma ORM status.',
        responses: {
          200: {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Auth API Documentation - PostgreSQL 18 & Prisma',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    })
  );

  console.log('[Swagger] Interactive API docs available at http://localhost:5000/api-docs');
}
