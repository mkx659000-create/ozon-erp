FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx nest build

FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm rebuild bcrypt

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
CMD ["sh", "start.sh"]
