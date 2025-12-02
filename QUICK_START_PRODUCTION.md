# Quick Start - Production Setup

**Date:** 2025-12-02
**Time to complete:** 10 minutes

---

## 📍 Ваше текущее положение

```
/home/loadcosmos/mnu_events/  ← ВЫ ЗДЕСЬ (Qoder IDE открыт)
```

**После запуска скрипта:**

```
/home/loadcosmos/
│
├── mnu_events/                    ← ВЫ ОСТАЕТЕСЬ ЗДЕСЬ
│   │                              ← Qoder IDE не закроется
│   ├── .git/                      ← Dev Git (не изменится)
│   ├── .github/                   ← Синхронизация с GitHub работает
│   ├── backend/
│   ├── frontend/
│   ├── .claude/                   ← Остается (для разработки)
│   ├── .qoder/                    ← Остается (ваш IDE конфиг)
│   ├── .env                       ← Ваш dev .env (не изменится)
│   └── prepare-production.sh      ← Скрипт для запуска
│
└── mnu_events_production/         ← НОВАЯ ПАПКА (создастся)
    ├── .git/                      ← Новый чистый Git
    ├── backend/                   ← Копия (без AI конфигов)
    ├── frontend/                  ← Копия
    ├── .env.example               ← Только пример
    └── (БЕЗ .claude, .qoder, .env)
```

---

## 🚀 Как запустить (3 команды)

### Шаг 1: Запустить скрипт

```bash
# В текущей папке mnu_events/
chmod +x prepare-production.sh
./prepare-production.sh
```

**Что произойдет:**
- ✅ Вы останетесь в `mnu_events/`
- ✅ Qoder IDE продолжит работать
- ✅ Создастся папка `../mnu_events_production/`
- ✅ Скопируются файлы (без AI конфигов)
- ⏱️ Займет: ~2 минуты

### Шаг 2: Проверить результат

```bash
# Посмотреть что создалось
ls -la ../mnu_events_production/

# Проверить что вы еще в dev папке
pwd
# Должно быть: /home/loadcosmos/mnu_events

# Проверить что Qoder работает
git remote -v
# Должно быть: origin https://github.com/loadcosmos/mnu_events.git
```

### Шаг 3: Создать GitHub репо

```bash
# Перейти в новую папку
cd ../mnu_events_production/

# Создать GitHub репо (нужен gh CLI)
gh repo create loadcosmos/mnu_events_production --public --source=. --remote=origin

# Или вручную:
# 1. Открыть: https://github.com/new
# 2. Имя: mnu_events_production
# 3. Public
# 4. Не добавлять README, .gitignore, license

# Залить на GitHub
git push -u origin main
git push origin staging
```

**Готово!** ✅

---

## 🔄 Как вернуться в dev папку

**В любой момент:**

```bash
# Если вы в production папке
cd ../mnu_events

# Теперь вы снова в dev окружении
# Qoder IDE автоматически подхватит изменения
```

---

## 📁 Как открыть production папку в Qoder

### Вариант 1: В новом окне

```bash
# Из терминала
code ../mnu_events_production

# или через Qoder
# File → New Window → Open Folder → /home/loadcosmos/mnu_events_production/
```

### Вариант 2: В том же окне

```bash
# В Qoder IDE
File → Open Folder → /home/loadcosmos/mnu_events_production/

# Чтобы вернуться к dev:
File → Open Recent → mnu_events
```

---

## 🔒 Безопасность .env (ВАЖНО!)

### ✅ Хорошие новости:

**Проверил ваш репозиторий:**
- ✅ `.env` никогда не был в Git
- ✅ `.env.example` безопасен (только localhost)
- ✅ Ваш текущий `.env` безопасен (только dev значения)

**Вывод:** Никаких секретов не утекло! 🎉

### ⚠️ ПЕРЕД production деплоем:

**Прочитайте:** `SECURITY_CHECKLIST.md` (я только что создал)

**Главное:**
1. Генерируйте **НОВЫЕ секреты** для production (не используйте dev!)
2. Никогда не коммитьте `.env` в Git
3. Используйте environment variables платформы (Railway, Vercel)

**Пример генерации секретов:**
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CSRF Secret
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Сохраните эти секреты в:**
- Railway → Environment Variables
- Vercel → Environment Variables
- **НЕ** в Git!

---

## 📊 Что будет в двух репозиториях

### Dev репо (`mnu_events`):

```
GitHub: github.com/loadcosmos/mnu_events
Использование: Разработка, эксперименты, AI

Содержит:
✅ Все ветки (включая claude/*)
✅ .claude/, .qoder/, .kilocode/
✅ .env (ваш локальный dev)
✅ Вся история разработки
```

### Production репо (`mnu_events_production`):

```
GitHub: github.com/loadcosmos/mnu_events_production
Использование: Production deployment

Содержит:
✅ Только main и staging ветки
❌ Без AI конфигов
❌ Без .env (используются platform env vars)
✅ Чистая история (без экспериментов)
```

---

## 🎯 Типичный рабочий процесс

### Разработка:

```bash
# Работаете в mnu_events/ (dev)
cd /home/loadcosmos/mnu_events

# Делаете фичу
git checkout -b feature/new-feature
# ... пишете код ...
git commit -m "feat: add new feature"

# Тестируете локально
npm run dev
```

### Деплой в production:

```bash
# 1. Мержите фичу в main (dev репо)
git checkout main
git merge feature/new-feature

# 2. Копируете изменения в production репо
cd ../mnu_events_production
rsync -av --exclude=.git --exclude=.claude --exclude=.qoder --exclude=.kilocode --exclude=node_modules --exclude=dist --exclude=.env ../mnu_events/ ./

# 3. Коммитите и пушите
git add .
git commit -m "feat: add new feature"
git push origin main

# 4. Production платформа автоматически деплоит (Vercel, Railway)
```

**Или проще:** Настройте CI/CD (GitHub Actions) для автоматической синхронизации.

---

## 🔗 GitHub синхронизация

### Текущая ситуация (dev репо):

```
Qoder IDE ← синхронизирован → GitHub (mnu_events)
```

**После создания production репо:**

```
Dev репо:
Qoder IDE ← синхронизирован → GitHub (mnu_events)

Production репо:
(новая папка) ← не синхронизирован → GitHub (mnu_events_production)
                                     ↑
                                  Нужно запушить
```

**Как синхронизировать production:**

```bash
cd ../mnu_events_production
git push -u origin main
git push origin staging

# Теперь синхронизировано!
```

---

## ❓ FAQ

### Q: Что если я случайно удалю dev репо?

**A:** Production репо - это копия, вы ничего не потеряете. Но лучше сделать backup:

```bash
# Создать архив dev репо
cd /home/loadcosmos
tar -czf mnu_events_backup_$(date +%Y%m%d).tar.gz mnu_events/

# Сохранить на внешний диск или cloud
```

### Q: Могу ли я работать в обоих репо одновременно?

**A:** Да! Открывайте в разных окнах Qoder:

```bash
# Окно 1: Dev
Qoder → Open Folder → /home/loadcosmos/mnu_events

# Окно 2: Production
Qoder → New Window → Open Folder → /home/loadcosmos/mnu_events_production
```

### Q: Как удалить production репо если что-то пошло не так?

**A:** Просто удалите папку:

```bash
cd /home/loadcosmos
rm -rf mnu_events_production/

# Dev репо не тронут!
# Можете запустить скрипт снова
```

### Q: Нужно ли изменять .env в dev репо?

**A:** НЕТ! Оставьте как есть:

```
Dev репо (.env):
VITE_BACKEND_URL=http://192.168.1.67:3001  ← OK для разработки

Production (platform env vars):
VITE_API_URL=https://api.mnu-events.com/api  ← Настроите при деплое
```

---

## 🎯 Готовы начать?

**Скопируйте и вставьте в терминал:**

```bash
# Убедитесь что вы в правильной папке
cd /home/loadcosmos/mnu_events

# Запустите скрипт
chmod +x prepare-production.sh
./prepare-production.sh

# Проверьте результат
ls -la ../mnu_events_production/

# Перейдите в production папку
cd ../mnu_events_production/

# Создайте GitHub репо и залейте
gh repo create loadcosmos/mnu_events_production --public --source=. --remote=origin
git push -u origin main staging

echo "✅ Production репозиторий создан!"
```

**Время выполнения:** 3-5 минут

---

## 📞 Нужна помощь?

**Если что-то пошло не так:**
1. Проверьте, что вы в правильной папке: `pwd`
2. Проверьте права на файлы: `ls -la prepare-production.sh`
3. Прочитайте вывод скрипта (там будут подсказки)
4. Спросите меня!

**Следующие шаги после создания:**
1. Прочитайте `SECURITY_CHECKLIST.md` (важно!)
2. Прочитайте `docs/DEPLOYMENT_GUIDE.md` (деплой)
3. Деплойте! 🚀

---

**Last Updated:** 2025-12-02
**Status:** Ready to run
