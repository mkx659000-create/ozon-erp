FROM node:20-alpine AS builder
WORKDIR /app

# Copy server package.json and install deps
COPY apps/server/package.json ./
RUN npm install

# Copy server source
COPY apps/server/ .

# Generate Prisma client and build
RUN npx prisma generate --schema src/prisma/schema.prisma
RUN npx nest build

FROM node:20-alpine AS runner
WORKDIR /app

# Install production deps and rebuild native modules
COPY apps/server/package.json ./
RUN npm install --omit=dev && \
    npm install bcrypt && \
    npm rebuild bcrypt --build-from-source

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY apps/server/src/prisma ./src/prisma
COPY apps/server/public ./public
COPY apps/server/start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "start.sh"]
