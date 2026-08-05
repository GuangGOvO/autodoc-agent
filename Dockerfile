########################
# Stage 1: 依赖安装
########################
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

########################
# Stage 2: 构建（next build → standalone）
########################
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 确保 public/ 目录存在（Git 不跟踪空目录，CI 检出后可能缺失）
RUN mkdir -p /app/public

RUN npm run build

########################
# Stage 3: 运行（最小镜像，非 root）
########################
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# 非 root 用户（与 Next.js 官方镜像一致）
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 数据库迁移脚本（docker compose exec app node scripts/migrate.mjs）
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/db ./db

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
