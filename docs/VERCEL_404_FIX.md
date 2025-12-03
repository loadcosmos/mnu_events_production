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

## Текущий Статус (2025-12-03 00:45 UTC)

### ❌ Проблема #1: Build Error - prop-types не найден

**Ошибка:**
```
[vite]: Rollup failed to resolve import "prop-types" from
"/vercel/path0/frontend/js/components/Gamification/GamificationBadge.jsx"
```

**Попытки решения:**
1. ✅ Добавлен `prop-types` в `frontend/package.json` (коммит f95e1de)
2. ❌ Vercel все равно не видит пакет при билде
3. ❌ Деплойменты dpl_GaS1UHxPdVJ2ySjJ2EXaSVJNAQWV и dpl_5Z4JYDndxKDBkpBSyi1oEZNYJM9Q - статус ERROR

**Возможные причины:**
- Vercel Root Directory настроен неправильно (должен быть `frontend/`)
- Vercel Framework Preset не определен как Vite
- Build Command использует не тот package.json

**Проверено:**
```bash
git show HEAD:frontend/package.json | grep prop-types
# Output: "prop-types": "^15.8.1" ✅ (пакет есть в коммите)
```

**Следующий шаг:** Проверить настройки проекта в Vercel Dashboard:
- Project Settings → Build & Development Settings
- Root Directory: должен быть `frontend`
- Framework Preset: должен быть `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

### ⏸️ Проблема #2: SPA 404 (отложена до решения билда)

Последний успешный деплоймент (dpl_mMDawTfpXvW1RXKwvwAsvEzhxLKS):
- ✅ Build: SUCCESS
- ❌ Routing: 404 на всех маршрутах кроме `/`

## История всех попыток

### Билд проблемы:
1. ❌ dpl_GaS1UHxPdVJ2ySjJ2EXaSVJNAQWV - prop-types не найден (без пакета)
2. ❌ dpl_5Z4JYDndxKDBkpBSyi1oEZNYJM9Q - prop-types не найден (после добавления)

### SPA routing попытки:
1. ❌ `rewrites` с паттерном `/(.*)`
2. ❌ `rewrites` с regex `/((?!assets/.*)(?!.*\\.)*)`
3. ❌ `routes` + `headers` (конфликт)
4. ❌ `_redirects` файл
5. ❌ Удаление `vercel.json` полностью

## Альтернатива (если routes не работает)

Создать файл `frontend/public/_redirects`:
```
/*  /index.html  200
```

Или использовать `public/_redirects` для Vite + Vercel.
