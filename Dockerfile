# ==========================================
# Stage 1: Build the Application
# ==========================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install system dependencies needed by Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000

# Copy package manifests and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma engine & client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

EXPOSE 5000

# Push schema to database on startup and launch Express server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
