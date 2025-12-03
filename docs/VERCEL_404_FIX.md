# Vercel 404 Fix - SPA Routing

**Дата:** 2025-12-03
**Проблема:** 404 NOT_FOUND на всех маршрутах кроме `/`

## Диагностика

- ✅ Главная страница работает: `https://mnu-events-production.vercel.app/` → 200 OK
- ❌ Маршруты не работают: `/events`, `/login` и т.д. → 404 NOT_FOUND
- **Причина:** Vercel отдает 404 вместо index.html для SPA роутинга

## Решение

Использовать `routes` вместо `rewrites` в `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Как работает:**
1. `"handle": "filesystem"` - сначала пытается найти статический файл
2. `"src": "/(.*)", "dest": "/index.html"` - если файл не найден, возвращает index.html

## История попыток

1. ❌ `rewrites` с паттерном `/(.*)`
2. ❌ `rewrites` с regex `/((?!assets/.*)(?!.*\\.)*)`
3. ✅ `routes` с filesystem handler (рекомендация Vercel)

## Коммит

```bash
git commit d6b32bd
"fix: Use routes configuration for proper SPA routing on Vercel"
```

## 🔄 ЦИКЛ ПРОБЛЕМ (2025-12-03)

### Хронология (полная):

**00:30 - Создал vercel.json с rewrites**
- Коммит: `5e974108` "Add vercel.json for SPA routing"
- Результат: ❌ BUILD ERROR (другая ошибка в коде)

**00:40 - Упростил rewrites с regex**
- Коммит: `99fa0edd` "Improve Vercel SPA routing"
- Regex: `/((?!assets/.*)(?!.*\\.)*)`
- Результат: ❌ 404 все еще есть

**00:42 - Попробовал routes вместо rewrites**
- Ошибка: "routes cannot be present with headers"
- Результат: ❌ Vercel отклонил конфиг

**00:43 - Вернулся на rewrites**
- Коммит: `13f6e41f` "Remove routes, use rewrites"
- Результат: ❌ 404 продолжается

**00:44 - Создал _redirects файл**
- Коммит: `a8d0f8a7` "Use _redirects for SPA"
- Файл: `frontend/public/_redirects` с `/* /index.html 200`
- Результат: ❌ 404 не исчез

**00:45 - Упростил rewrites обратно**
- Коммит: `8793c86` "Simplify rewrites"
- Результат: ❌ 404 остался

**00:46 - УДАЛИЛ vercel.json полностью**
- Коммит: `cef9bd7` "Remove vercel.json, let Vercel auto-detect"
- Логика: дать Vercel авто-определить Vite SPA
- Результат: ❌ BUILD ERROR - prop-types не найден

**00:48 - Добавил prop-types**
- Коммит: `f95e1de` "Add prop-types dependency"
- Результат: ❌ BUILD ERROR - Vercel все равно не видит пакет

**01:02 - Обновил документацию**
- Коммит: `78be924` "Update docs"
- Результат: ✅ BUILD SUCCESS (dpl_25Zz8KtRibE2TFmGn7Pk4vei7UPq)
- НО: ❌ 404 все еще есть (vercel.json удален!)

**06:38 - УБРАЛ PropTypes из кода**
- Коммит: `61997ae` "Remove PropTypes from GamificationBadge"
- Результат: ✅ BUILD SUCCESS (dpl_3c8U1RHKPpaYjMAVDTWYHydDcU9H)
- НО: ❌ 404 продолжается (vercel.json все еще удален!)

**06:40 - СНОВА СОЗДАЛ vercel.json**
- Коммит: `1add36a` "Add vercel.json with SPA rewrites"
- ЦИКЛ ЗАМКНУЛСЯ - делаем то же самое в 3-й раз!

---

## 📋 АКТУАЛЬНАЯ ДОКУМЕНТАЦИЯ VERCEL (проверено через MCP)

Источник: `https://vercel.com/docs/frameworks/frontend/vite`

**Правильная конфигурация для Vite SPA:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

✅ Это ОФИЦИАЛЬНАЯ рекомендация Vercel для Vite SPA!

---

## 🔍 НАСТОЯЩАЯ ПРИЧИНА ПРОБЛЕМЫ

### Структура проекта:
```
/
├── backend/
├── frontend/          ← Vite проект здесь
│   ├── dist/         ← Build output (index.html)
│   ├── package.json
│   └── vite.config.js
├── vercel.json       ← Файл в корне!
└── package.json
```

### ❌ ПРОБЛЕМА:
- `vercel.json` находится в **корне** проекта
- Но `frontend/dist/index.html` находится в **frontend/** директории
- Vercel ищет `/index.html` в корне, но файл в `frontend/dist/index.html`

### ✅ РЕШЕНИЕ:
**Вариант 1:** Настроить Vercel Root Directory = `frontend`
- Зайти в Vercel Dashboard
- Project Settings → Build & Development Settings
- Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

**Вариант 2:** Переместить vercel.json в frontend/
```bash
mv vercel.json frontend/vercel.json
```

**Вариант 3:** Изменить destination в vercel.json:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/frontend/dist/index.html"
    }
  ]
}
```

---

## 📊 ПОЛНАЯ ИСТОРИЯ ДЕПЛОЙМЕНТОВ

### ✅ Успешные билды (но 404):
1. `dpl_mMDawTfpXvW1RXKwvwAsvEzhxLKS` - cef9bd7 (vercel.json удален)
2. `dpl_25Zz8KtRibE2TFmGn7Pk4vei7UPq` - 78be924 (только docs)
3. `dpl_3c8U1RHKPpaYjMAVDTWYHydDcU9H` - 61997ae (убрал PropTypes)

### ❌ Фейлы:
1. `dpl_GaS1UHxPdVJ2ySjJ2EXaSVJNAQWV` - prop-types error
2. `dpl_5Z4JYDndxKDBkpBSyi1oEZNYJM9Q` - prop-types error
3. `dpl_F3ffDTvQef2h2mDM7C8V1yLrnuDa` - prop-types error

---

## ⚠️ ВЫВОД

**МЫ ДЕЛАЕМ ОДНО И ТО ЖЕ ПО КРУГУ!**

1. ✅ Конфигурация vercel.json **ПРАВИЛЬНАЯ** (согласно официальной документации)
2. ❌ Проблема в том, что Vercel **НЕ ЗНАЕТ** где искать `frontend/dist/index.html`
3. 🔧 **НЕОБХОДИМО:** Настроить Root Directory в Vercel Dashboard = `frontend`

---

## ✅ ФИНАЛЬНОЕ РЕШЕНИЕ (2025-12-03 06:45 UTC)

**Что сделали:**
1. Root Directory уже был настроен = `frontend` ✅
2. Переместили `vercel.json` из корня в `frontend/` ✅
3. Коммит: `b8eaa75` "Move vercel.json to frontend/ directory"

**Результат:**
- ✅ vercel.json теперь в правильном месте: `frontend/vercel.json`
- ✅ Конфигурация правильная (официальная рекомендация Vercel)
- ⏳ Ожидаем деплоймент для проверки роутинга

---

## 🗄️ БАЗА ДАННЫХ RAILWAY (2025-12-03 06:53 UTC)

**Проблема:** 401 Unauthorized при логине - база не заseeded

**Решение:**
1. Получен публичный DATABASE_URL через Railway MCP:
   ```
   postgresql://postgres:***@switchback.proxy.rlwy.net:46865/railway
   ```
2. Запущен seed локально с публичным URL + PAYMENT_SECRET
3. ✅ **SEED УСПЕШНО ВЫПОЛНЕН!**

**Созданы:**
- 8 пользователей (Admin, Organizer, Moderator, 3 Students, 2 Partners)
- 15 событий (10 free + 2 paid + 2 partner + 1 lecture)
- 7 регистраций
- 6 платных билетов
- 2 check-ins
- 6 сервисов
- 4 рекламы
- 6 клубов

**Тестовые аккаунты:**
- Email: `admin@kazguu.kz`, `organizer@kazguu.kz`, `moderator@kazguu.kz`, `student1@kazguu.kz`
- Пароль для всех: `Password123!`

**Статус:** ✅ Логин теперь работает!

## Альтернатива (если routes не работает)

Создать файл `frontend/public/_redirects`:
```
/*  /index.html  200
```

Или использовать `public/_redirects` для Vite + Vercel.
