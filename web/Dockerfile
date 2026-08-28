# syntax=docker/dockerfile:1
#
# Multi-stage build with two usable targets:
#   dev    - hot-reloading dev server (docker-compose.yml's `app-dev` service)
#   runner - small production image (docker-compose.yml's `app` service)
# Build/run through docker-compose.yml rather than this file directly — see
# README.md for the exact commands and required env vars.

FROM node:22-alpine AS base
WORKDIR /app

# ---- deps: install once, reused by both the dev and prod paths ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- dev: source is bind-mounted over /app at runtime for hot reload ----
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- builder: production build ----
FROM deps AS builder
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle by `next build`, so
# they must be supplied as build args (see docker-compose.yml's build.args),
# not just at `docker run`. Server-only secrets do NOT go here — they're
# read at container runtime by the server started in the runner stage below.
ARG NEXT_PUBLIC_SANITY_PROJECT_ID
ARG NEXT_PUBLIC_SANITY_DATASET
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL
ENV NEXT_PUBLIC_SANITY_PROJECT_ID=$NEXT_PUBLIC_SANITY_PROJECT_ID \
    NEXT_PUBLIC_SANITY_DATASET=$NEXT_PUBLIC_SANITY_DATASET \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_PUBLIC_UMAMI_SCRIPT_URL=$NEXT_PUBLIC_UMAMI_SCRIPT_URL

RUN npm run build

# ---- runner: only the traced standalone output, no node_modules/source ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
