# Production Preparation Guide

**Date:** 2025-12-02
**Purpose:** Подготовка репозитория к production deployment

---

## 🎯 Ваша ситуация

**Текущее состояние:**
- ✅ Код готов к production (см. `docs/PRODUCTION_READY_CHANGES.md`)
- 🌿 15+ веток `claude/*` (экспериментальные фичи)
- 📁 AI конфигурации: `.claude/`, `.qoder/`, `.kilocode/`
- 👤 Авторы коммитов: `loadcosmos`, `Claude`

**Задача:**
Подготовить чистый production-ready репозиторий без AI конфигов и dev веток.

---

## 📊 Два варианта решения

| Критерий | Вариант 1: Новый Production Repo | Вариант 2: Очистить Текущий |
|----------|----------------------------------|------------------------------|
| **Безопасность** | ✅ Dev окружение не тронуто | ⚠️ Изменяет текущий репо (но с backup) |
| **Откат** | ✅ Легко вернуться к dev | ⚠️ Через backup branch |
| **Чистота истории** | ✅ Полностью чистая | ⚠️ История сохраняется |
| **Управление** | ⚠️ Два репозитория | ✅ Один репозиторий |
| **CI/CD** | ✅ Разные pipelines для dev/prod | ⚠️ Общий pipeline |
| **Время** | 5 минут | 3 минуты |
| **Риск** | 🟢 Минимальный | 🟡 Низкий (с backup) |

---

## ✅ Вариант 1: Создать отдельный Production репозиторий (РЕКОМЕНДУЮ)

### Почему это лучше:

1. **Безопасность**: Dev окружение остается нетронутым
2. **Разделение окружений**: Dev и Prod - отдельные репо
3. **Чистая история**: Без экспериментальных коммитов
4. **CI/CD**: Разные pipelines для dev и prod
5. **Секреты**: Разные secrets в GitHub Actions

### Как сделать:

```bash
# 1. Запустить скрипт
chmod +x prepare-production.sh
./prepare-production.sh

# 2. Проверить результат
cd ../mnu_events_production
ls -la
git log --oneline

# 3. Создать GitHub репозиторий
gh repo create loadcosmos/mnu_events_production --public --source=. --remote=origin
# или вручную: https://github.com/new

# 4. Залить на GitHub
git remote add origin https://github.com/loadcosmos/mnu_events_production.git
git push -u origin main
git push origin staging

# 5. Деплоить (см. docs/DEPLOYMENT_GUIDE.md)
```

### Что делает скрипт:

1. ✅ Создает новую директорию `../mnu_events_production/`
2. ✅ Копирует только production файлы (без AI configs)
3. ✅ Обновляет `.gitignore` для production
4. ✅ Создает `DEPLOY.md` с инструкциями
5. ✅ Делает initial commit
6. ✅ Создает ветки `main` и `staging`

### Что НЕ копируется:

- ❌ `.claude/`, `.qoder/`, `.kilocode/` - AI конфиги
- ❌ `.vscode/` - Editor конфиги
- ❌ `node_modules/` - Зависимости
- ❌ `dist/` - Build artifacts
- ❌ `.env` - Локальные переменные окружения
- ❌ `*.log` - Логи

---

## 🔄 Вариант 2: Очистить текущий репозиторий

### Когда использовать:

- Хотите один репозиторий для всего
- Не планируете возвращаться к dev веткам
- Dev окружение больше не нужен

### Как сделать:

```bash
# 1. Запустить скрипт
chmod +x cleanup-current-repo.sh
./cleanup-current-repo.sh
# Скрипт попросит подтверждение: введите "yes"

# 2. Проверить результат
git branch -a
git status

# 3. Залить изменения на GitHub
git push origin main --force-with-lease

# 4. (Опционально) Удалить все remote claude ветки
# Уже сделано скриптом

# 5. Деплоить (см. docs/DEPLOYMENT_GUIDE.md)
```

### Что делает скрипт:

1. ✅ Создает backup branch (на всякий случай)
2. ✅ Удаляет все `claude/*` ветки (local + remote)
3. ✅ Удаляет temp ветки (`temp-*`)
4. ✅ Удаляет `.kilocode/mcp.json` из Git
5. ✅ Обновляет `.gitignore`
6. ✅ Создает `DEPLOY.md`

### Если что-то пошло не так:

```bash
# Вернуться к backup
git checkout backup-before-cleanup-YYYYMMDD-HHMMSS

# Восстановить main
git branch -D main
git checkout -b main
```

---

## 🚀 Моя рекомендация

### Выбирайте **Вариант 1** если:

- ✅ Хотите сохранить dev окружение
- ✅ Планируете продолжать разработку
- ✅ Нужны разные CI/CD для dev/prod
- ✅ Хотите максимальную безопасность

### Выбирайте **Вариант 2** если:

- ✅ Хотите один репозиторий
- ✅ Dev ветки больше не нужны
- ✅ Готовы работать с backup'ами

---

## 📋 Что будет удалено (оба варианта)

### AI Configuration Files:
```
.claude/           # Claude Code конфигурация
.qoder/            # Qoder конфигурация
.kilocode/         # Kilocode конфигурация
.kilocode/mcp.json # MCP конфигурация (в Git)
```

### Development Branches:
```
claude/complete-phases-5-8-*
claude/fix-email-verification-*
claude/fix-events-clubs-layout-*
claude/fix-header-button-alignment-*
claude/fix-header-overlap-hero-*
claude/fix-hero-nav-buttons-*
claude/fix-phase-3-visibility-*
claude/fix-remaining-todos-*
claude/implement-dark-theme-*
claude/mnu-events-core-*
claude/mobile-header-opacity-*
claude/phase-4-unified-design-*
claude/refactor-transparent-components-*
claude/review-csi-implementation-*
claude/wsl-windows-comparison-*
temp-fix-hero-buttons
temp-wsl-comparison
```

**Итого:** 15 веток будут удалены

---

## 🔒 Что НЕ будет удалено

### Production Files (останутся):
```
✅ backend/          # Backend код
✅ frontend/         # Frontend код
✅ docs/             # Документация
✅ README.md         # Основной README
✅ CLAUDE.md         # Инструкции для AI (можно удалить вручную если не нужен)
✅ PROJECT_STATUS.md # Статус проекта
✅ .env.example      # Пример env файла
✅ package.json      # Dependencies
✅ docker-compose.yml # Docker конфигурация
```

### Git History:
- ✅ Все коммиты сохраняются
- ✅ История разработки доступна
- ✅ Можно откатиться к любому коммиту

---

## ⚠️ Важные замечания

### После очистки репозитория:

1. **Обновите .env для production:**
   ```bash
   cp .env.example .env.production
   # Заполните production значения
   ```

2. **Удалите ненужные AI инструкции (опционально):**
   ```bash
   # Если не планируете использовать AI в production
   git rm CLAUDE.md
   git commit -m "docs: remove AI instructions"
   ```

3. **Проверьте .gitignore:**
   ```bash
   cat .gitignore | grep -E "^\.(claude|qoder|kilocode)"
   # Должно быть:
   # .claude
   # .qoder/
   # .kilocode/
   ```

4. **Настройте GitHub repository settings:**
   - Protect `main` branch
   - Require pull request reviews
   - Enable status checks
   - Add production secrets

---

## 🎯 Быстрый старт

### Если хотите отдельный production репо (рекомендую):

```bash
chmod +x prepare-production.sh
./prepare-production.sh
cd ../mnu_events_production
gh repo create loadcosmos/mnu_events_production --public --source=. --remote=origin
git push -u origin main staging
```

### Если хотите очистить текущий репо:

```bash
chmod +x cleanup-current-repo.sh
./cleanup-current-repo.sh
# Введите "yes" для подтверждения
git push origin main --force-with-lease
```

---

## 📞 Следующие шаги после очистки

1. **Deployment:**
   - См. `docs/DEPLOYMENT_GUIDE.md`
   - Выберите платформы (Vercel + Railway рекомендую)

2. **Environment Variables:**
   - Backend: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, etc.
   - Frontend: `VITE_API_URL`

3. **CI/CD (опционально):**
   - GitHub Actions для auto-deploy
   - Vercel/Netlify auto-deploy из main branch

4. **Monitoring:**
   - Sentry для error tracking
   - LogRocket для session replay

---

## 🐛 Troubleshooting

### "Permission denied" при запуске скрипта:
```bash
chmod +x prepare-production.sh
# или
bash prepare-production.sh
```

### "Branch already exists":
```bash
# Удалите старую ветку
git branch -D backup-before-cleanup-*
```

### "Remote branch not found":
```bash
# Нормально, если ветка уже удалена
# Скрипт продолжит работу
```

---

## 📝 Summary

**Рекомендация:** Используйте **Вариант 1** (отдельный production репо)

**Причины:**
1. Безопасно - dev окружение не тронут
2. Чисто - без истории экспериментов
3. Профессионально - разделение dev/prod
4. Гибко - разные CI/CD pipelines

**Время выполнения:** 5 минут

**Готово к деплою:** После запуска скрипта

---

**Last Updated:** 2025-12-02
**Status:** Ready to execute
