FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS builder

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm run prisma:generate

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# One-off image that applies Prisma migrations (keeps the prisma CLI, which the
# runner image prunes). Used by scripts/deploy-on-server.sh:
#   docker build --target migrator -t dr-saleh-backend-migrator .
#   docker run --rm --network host --env-file .env dr-saleh-backend-migrator
FROM dependencies AS migrator

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
# generated client for `npx prisma db seed`
RUN npm run prisma:generate

CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# psql/pg_restore for the optional demo seed in scripts/start.sh
RUN apk add --no-cache postgresql-client

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./
COPY demo ./demo
COPY scripts/start.sh ./scripts/start.sh

EXPOSE 3000

CMD ["sh", "scripts/start.sh"]
