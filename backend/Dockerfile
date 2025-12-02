# ===========================================
# MNU Events Backend - Production Dockerfile
# ===========================================

# Base stage - установка зависимостей для сборки
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

# Build stage - сборка приложения
FROM base AS build

# Копируем файлы для npm install
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем ВСЕ зависимости (включая devDependencies для сборки)
RUN npm ci

# Генерируем Prisma Client (используем установленную версию, не npx!)
RUN ./node_modules/.bin/prisma generate

# Копируем исходный код
COPY . .

# Собираем NestJS приложение
RUN npm run build

# ===========================================
# Production stage - минимальный образ
# ===========================================
FROM node:20-alpine AS production
WORKDIR /app

# Устанавливаем только необходимые системные пакеты
RUN apk add --no-cache openssl libc6-compat

# Копируем package.json для production dependencies
COPY package*.json ./

# Устанавливаем ТОЛЬКО production зависимости
RUN npm ci --only=production --ignore-scripts

# Копируем Prisma schema и сгенерированный client из build stage
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Копируем собранное приложение
COPY --from=build /app/dist ./dist

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Railway автоматически использует PORT из переменных окружения
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/api/health || exit 1

# Запуск: db push для Railway (минует проблемные data migrations) + сервер
CMD ["sh", "-c", "npx prisma@5.7.1 db push --accept-data-loss --skip-generate && node dist/main"]

