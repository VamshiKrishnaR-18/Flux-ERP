FROM node:18-alpine AS builder

WORKDIR /app

# Enable Corepack for Turbo
RUN corepack enable

# Copy root files
COPY package.json package-lock.json turbo.json ./

# Copy packages and app
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN npm install

# Build the API
RUN npx turbo run build --filter=api...

# Production Stage
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
