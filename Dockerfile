# syntax=docker/dockerfile:1

# ---- 1. Dependencies -------------------------------------------------------
FROM node:26-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@12.3.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- 2. Build ---------------------------------------------------------------
FROM node:26-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@12.3.4
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- 3. Runtime ---------------------------------------------------------------
# Small final image: only the standalone server output is shipped,
# without build tools, dev dependencies or source code.
FROM node:26-alpine AS runner
LABEL org.opencontainers.image.title="CareOps" \
      org.opencontainers.image.description="CareOps dashboard for medical equipment deployments (Next.js)"
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user inside the container
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthy once the server answers on the dashboard page (busybox wget ships with alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
