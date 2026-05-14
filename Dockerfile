# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY apps/web/package.json ./
RUN npm install

COPY apps/web/ .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/server/package.json ./
RUN npm install

COPY apps/server/ .

RUN npx prisma generate --schema src/prisma/schema.prisma
RUN npx nest build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

COPY apps/server/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY apps/server/src/prisma ./src/prisma

# Copy frontend build output to public/
COPY --from=frontend-builder /app/dist ./public

COPY apps/server/start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "start.sh"]
