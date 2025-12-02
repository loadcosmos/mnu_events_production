# ✅ Чек-лист быстрого деплоя

**Время:** ~30 минут

---

## 🔐 Секреты (уже сгенерированы)

```
JWT_SECRET=88187cb4dbed06827f35e9cf3a56e22cdd18899efc831f131f9f45d0bbab16b6
JWT_REFRESH_SECRET=67088a7cb2f16b81f652fe9e190163471be4d743657f925e4fbd1c2faaaad0da
CSRF_SECRET=5b0a6a610ac6605992c9ab4379f5324f
PAYMENT_SECRET=1a17c6d2b17c5ca6cfe51430d0fe07de8f9000b9b7c954ea8dbb257f9e75909a
```

---

## 📋 Backend (Railway) - 15 минут

### 1. Создать проект
- [ ] https://railway.app/ → Sign up with GitHub
- [ ] New Project → Deploy from GitHub repo
- [ ] Выбрать `mnu_events_production`
- [ ] Root Directory: `backend`
- [ ] Deploy

### 2. Добавить PostgreSQL
- [ ] + New → Database → PostgreSQL
- [ ] Дождаться создания (1-2 минуты)
- [ ] Проверить `DATABASE_URL` в Variables

### 3. Environment Variables
- [ ] Backend service → Variables → Add:

```
NODE_ENV=production
HOST=0.0.0.0
JWT_SECRET=88187cb4dbed06827f35e9cf3a56e22cdd18899efc831f131f9f45d0bbab16b6
JWT_REFRESH_SECRET=67088a7cb2f16b81f652fe9e190163471be4d743657f925e4fbd1c2faaaad0da
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d
CSRF_SECRET=5b0a6a610ac6605992c9ab4379f5324f
PAYMENT_SECRET=1a17c6d2b17c5ca6cfe51430d0fe07de8f9000b9b7c954ea8dbb257f9e75909a
CORS_ORIGIN=*
```

### 4. Generate Domain
- [ ] Settings → Domains → Generate Domain
- [ ] **ЗАПИСАТЬ URL:** `___________________.up.railway.app`

### 5. Запустить migrations
- [ ] Shell (⋮ menu) → Run:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 6. Проверить
- [ ] Открыть: `https://your-url.up.railway.app/api/health`
- [ ] Должно быть: `{"status":"ok","database":"connected"}`

---

## 📋 Frontend (Vercel) - 15 минут

### 1. Создать проект
- [ ] https://vercel.com/ → Sign up with GitHub
- [ ] Add New → Project
- [ ] Import `mnu_events_production`

### 2. Configure Project
- [ ] Framework: Vite (auto-detect)
- [ ] Root Directory: `.` (корень)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### 3. Environment Variables
- [ ] Add: `VITE_API_URL` = `https://your-railway-url.up.railway.app/api`
- [ ] (вставить ваш Railway URL!)

### 4. Deploy
- [ ] Deploy → Дождаться (~3-5 минут)
- [ ] **ЗАПИСАТЬ URL:** `___________________.vercel.app`

### 5. Обновить CORS в Railway
- [ ] Railway → backend → Variables
- [ ] `CORS_ORIGIN` = `https://your-vercel-url.vercel.app`
- [ ] (БЕЗ trailing slash!)

### 6. Проверить
- [ ] Открыть Vercel URL
- [ ] F12 → Console (не должно быть ошибок)
- [ ] Попробовать регистрацию

---

## 🧪 Тестовые аккаунты (ВСЕ 5 РОЛЕЙ)

```
Admin: admin@kazguu.kz / Password123!
Moderator: moderator@kazguu.kz / Password123!
Organizer: organizer@kazguu.kz / Password123!
Partner: partner1@itacademy.kz / Password123!
Student: student1@kazguu.kz / Password123!
```

---

## ⚠️ Если не работает:

### CORS Error:
```
Railway → backend → Variables → CORS_ORIGIN
Должно быть: https://your-vercel-url.vercel.app
```

### Backend не отвечает:
```
Railway → backend → Logs (проверить ошибки)
```

### Миграции не применились:
```
Railway → backend → Shell:
npx prisma migrate deploy
```

---

## 📝 После деплоя:

- [ ] Поделиться URL со студентами
- [ ] Собрать feedback
- [ ] Исправить баги
- [ ] Настроить email (опционально)

---

**Полная инструкция:** `DEPLOY_INSTRUCTIONS.md`
