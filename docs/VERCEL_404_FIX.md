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

## Статус

⏳ Ожидание автодеплоя Vercel (GitHub integration может задерживаться)

## Альтернатива (если routes не работает)

Создать файл `frontend/public/_redirects`:
```
/*  /index.html  200
```

Или использовать `public/_redirects` для Vite + Vercel.
