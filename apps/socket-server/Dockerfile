# apps/socket-server/Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/socket-server/package.json ./apps/socket-server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate --schema=apps/web/prisma/schema.prisma
RUN npm run build --workspace=apps/socket-server

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketuser

COPY --from=builder --chown=socketuser:nodejs /app/apps/socket-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER socketuser

EXPOSE 3001

CMD ["node", "dist/index.js"]
