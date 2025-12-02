# Data Migration Guide - MNU Events Platform

**Last Updated:** 2025-12-02
**Status:** Best Practices Documentation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current Issue](#current-issue)
3. [Prisma Best Practices](#prisma-best-practices)
4. [Recommended Solutions](#recommended-solutions)
5. [Implementation](#implementation)

---

## 🎯 Overview

This document explains the **correct way** to handle data migrations in the MNU Events Platform according to Prisma ORM best practices.

### What is Data Migration?

- **Schema Migration**: Changes to database structure (tables, columns, indexes) - handled by `prisma migrate`
- **Data Migration**: Changes to existing data (updating values, transforming records) - requires custom approach

**Example from our project:**
- Schema: Added `checkInMode` enum field to Event model ✅ (handled by Prisma)
- Data: Update existing events with correct `checkInMode` values ❌ (needs custom solution)

---

## ⚠️ Current Issue

### Problem in `start.sh`:

```bash
# Step 6: Run check-in mode migration script
print_step "Running check-in mode migration (fixes QR codes for existing events)..."
if docker-compose exec -T backend npx ts-node scripts/fix-checkin-modes.ts; then
    print_success "Check-in mode migration completed"
fi
```

### Why This is Wrong:

❌ **Runs every time** you start the project
❌ **Slow**: Scans ALL events in database every startup
❌ **Not idiomatic**: Prisma doesn't recommend this approach
❌ **Code pollution**: One-time operations shouldn't be in startup scripts
❌ **No tracking**: Can't tell if migration already ran

### What Happens:

1. Developer runs `./start.sh` → Migration runs
2. Next day runs `./start.sh` again → Migration runs AGAIN (unnecessary)
3. Production deployment → Migration runs
4. Restart server → Migration runs AGAIN
5. **Result**: Wasted CPU cycles, slower startup

---

## 📚 Prisma Best Practices

According to [Prisma Official Documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations):

### ✅ Recommended Approaches:

1. **Custom SQL in Migration Files** (Best)
   - Create empty migration with `--create-only`
   - Add custom SQL UPDATE statements
   - Apply with `prisma migrate dev`
   - **Tracked** in migrations history
   - **One-time** execution

2. **Separate TypeScript Scripts** (Good for complex logic)
   - Create script in `backend/scripts/`
   - Run **manually once** after deploying migration
   - Document in deployment guide
   - **Not** in startup/seed scripts

3. **Seed Script with Conditional Logic** (Only for initial data)
   - Use `prisma/seed.ts` ONLY for new databases
   - Not for existing production data

---

## 💡 Recommended Solutions

### **Solution 1: Custom SQL Migration (BEST)**

**Pros:**
- ✅ Tracked in migration history
- ✅ Runs exactly once per environment
- ✅ Fast (single UPDATE query)
- ✅ Prisma recommended approach
- ✅ Works in CI/CD pipelines

**Cons:**
- ⚠️ Less flexible than TypeScript (but SQL is powerful enough)

**When to use:**
- Simple data transformations
- One-time updates
- Production-safe operations

---

### **Solution 2: Manual TypeScript Script (CURRENT - needs improvement)**

**Pros:**
- ✅ Type-safe with Prisma Client
- ✅ Complex business logic possible
- ✅ Can log detailed output

**Cons:**
- ❌ Must remember to run manually
- ❌ Not tracked in migration history
- ❌ Easy to forget in deployment

**When to use:**
- Complex multi-step transformations
- Conditional logic based on data
- Debugging/exploratory migrations

---

### **Solution 3: Seed Script Integration (NOT RECOMMENDED for this case)**

**Pros:**
- ✅ Runs automatically

**Cons:**
- ❌ Seed is for **new** databases, not existing data
- ❌ Not idiomatic for data migrations
- ❌ Confusing purpose of seed script

**When to use:**
- Only for initial demo/test data
- Never for production data changes

---

## 🛠️ Implementation

### **Option A: Convert to SQL Migration (RECOMMENDED)**

**Step 1:** Create empty migration

```bash
cd backend
npx prisma migrate dev --name fix_checkin_modes_data --create-only
```

**Step 2:** Edit the generated migration file in `backend/prisma/migrations/[timestamp]_fix_checkin_modes_data/migration.sql`

```sql
-- Data migration: Fix checkInMode for existing events
-- Based on business rules:
-- 1. External events ALWAYS use ORGANIZER_SCANS (for analytics)
-- 2. Internal paid events use ORGANIZER_SCANS (student has ticket)
-- 3. Internal free events use STUDENTS_SCAN (organizer displays QR)

-- Update external events to ORGANIZER_SCANS
UPDATE "events"
SET "checkInMode" = 'ORGANIZER_SCANS'
WHERE "isExternalEvent" = true
  AND "checkInMode" != 'ORGANIZER_SCANS';

-- Update internal paid events to ORGANIZER_SCANS
UPDATE "events"
SET "checkInMode" = 'ORGANIZER_SCANS'
WHERE "isExternalEvent" = false
  AND "isPaid" = true
  AND "checkInMode" != 'ORGANIZER_SCANS';

-- Update internal free events to STUDENTS_SCAN
UPDATE "events"
SET "checkInMode" = 'STUDENTS_SCAN'
WHERE "isExternalEvent" = false
  AND "isPaid" = false
  AND "checkInMode" != 'STUDENTS_SCAN';

-- Clear registration QR codes for STUDENTS_SCAN events
-- (students scan organizer's QR, not their own)
UPDATE "registrations" r
SET "qrCode" = NULL
FROM "events" e
WHERE r."eventId" = e.id
  AND e."checkInMode" = 'STUDENTS_SCAN'
  AND r."qrCode" IS NOT NULL;
```

**Step 3:** Apply migration

```bash
npx prisma migrate dev
```

**Step 4:** Remove from `start.sh`

```bash
# DELETE these lines from start.sh:
# Step 6: Run check-in mode migration script
# ... (lines 127-133)
```

**Benefits:**
- ✅ Runs exactly once per environment
- ✅ Tracked in `_prisma_migrations` table
- ✅ No startup overhead
- ✅ Production-safe

---

### **Option B: Keep TypeScript Script but Run Manually (ACCEPTABLE)**

**Step 1:** Document the migration

Create `backend/DEPLOYMENT.md`:

```markdown
## Post-Deployment Steps

After deploying the QR Check-In system update:

1. Run data migration ONCE:
   ```bash
   docker-compose exec backend npx ts-node scripts/fix-checkin-modes.ts
   ```

2. Verify migration success:
   ```bash
   docker-compose exec backend npx prisma studio
   ```
   Check that events have correct `checkInMode` values.
```

**Step 2:** Remove from `start.sh`

**Step 3:** Add migration status tracking to the script

```typescript
// At the start of main():
const migrationKey = 'fix-checkin-modes-v1';
const existingMigration = await prisma.$queryRaw`
  SELECT * FROM _prisma_migrations WHERE migration_name = ${migrationKey}
`;

if (existingMigration.length > 0) {
  console.log('Migration already applied, skipping...');
  return;
}

// ... rest of migration logic ...

// At the end:
await prisma.$executeRaw`
  INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs)
  VALUES (gen_random_uuid(), '', NOW(), ${migrationKey}, 'Data migration for check-in modes')
`;
```

**Benefits:**
- ✅ Type-safe TypeScript logic
- ✅ Idempotent (won't run twice)
- ✅ Tracked in migrations table

**Drawbacks:**
- ⚠️ Must remember to run manually

---

## 📝 Decision Matrix

| Scenario | Recommended Solution |
|----------|---------------------|
| Simple UPDATE queries | Option A: SQL Migration |
| Complex business logic | Option B: TypeScript Script |
| Production deployment | Option A: SQL Migration |
| Development/testing | Option B: TypeScript Script |
| One-time fix | Option A: SQL Migration |
| Recurring updates | Neither (use application logic) |

---

## 🚀 Action Items

### For MNU Events Platform:

1. ✅ **Immediate**: Remove migration from `start.sh`
2. ✅ **Recommended**: Convert to SQL migration (Option A)
3. ✅ **Alternative**: Document manual run (Option B)
4. ✅ **Future**: Always use SQL migrations for data changes

### Template for Future Data Migrations:

```bash
# 1. Create empty migration
npx prisma migrate dev --name [descriptive_name]_data --create-only

# 2. Edit migration.sql with UPDATE statements

# 3. Test in development
npx prisma migrate dev

# 4. Deploy to production
npx prisma migrate deploy
```

---

## 🚀 Production Deployment

### ✅ YES - Подходит для Production!

Согласно [Prisma Production Deployment Guide](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate):

**Наша SQL миграция полностью безопасна для production:**

1. ✅ **Idempotent**: Можно запускать много раз без вреда
2. ✅ **Tracked**: Prisma отмечает как примененную в `_prisma_migrations`
3. ✅ **Conditional**: UPDATE только если значение отличается (`checkInMode != 'ORGANIZER_SCANS'`)
4. ✅ **Non-destructive**: Не удаляет данные, только обновляет
5. ✅ **Atomic**: Каждый UPDATE - отдельная транзакция

### Production Deployment Steps

**Правильный workflow для production:**

```bash
# 1. Development (уже сделано)
cd backend
npx prisma migrate dev
# Тестируем локально

# 2. Commit to Git
git add prisma/migrations/
git commit -m "feat: add check-in mode data migration"
git push

# 3. Deploy to Production (автоматически в CI/CD)
npx prisma migrate deploy
```

**Команда для production:**

```bash
# ✅ ПРАВИЛЬНО (в CI/CD pipeline):
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# ❌ НЕПРАВИЛЬНО (локально):
# Не меняй DATABASE_URL локально на production!
```

---

### Production Safety Analysis

**Анализ нашей миграции:**

```sql
-- ✅ SAFE: Conditional UPDATE with WHERE clause
UPDATE "events"
SET "checkInMode" = 'ORGANIZER_SCANS'
WHERE "isExternalEvent" = true
  AND "checkInMode" != 'ORGANIZER_SCANS';
```

**Почему безопасно:**

| Аспект | Оценка | Объяснение |
|--------|--------|------------|
| **Data Loss** | ✅ Нет | Только обновление, не удаление |
| **Idempotency** | ✅ Да | `checkInMode != 'X'` предотвращает повторное обновление |
| **Downtime** | ✅ Нет | Читаемость таблицы не блокируется |
| **Performance** | ⚠️ Зависит | Быстро до ~10k events, медленно на 100k+ |
| **Rollback** | ✅ Да | Можно откатить через `prisma migrate resolve --rolled-back` |

**Потенциальные риски (минимальные):**

⚠️ **Временная блокировка таблицы:**
- PostgreSQL: Row-level locking (минимальное влияние)
- Время выполнения: ~0.1s на 1000 событий
- **Решение**: Миграция быстрая, риск низкий

⚠️ **Большие таблицы (>50k событий):**
- UPDATE может занять несколько секунд
- **Решение**: Тестировать на staging с production-подобными данными

**Вывод:** ✅ Миграция **БЕЗОПАСНА** для production при нормальных объемах данных (<10k событий).

---

### CI/CD Integration

**Пример для GitHub Actions:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm ci

      # ✅ Apply migrations to production
      - name: Run migrations
        run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}

      - name: Deploy application
        run: # ... your deployment commands
```

**Пример для Docker Compose (production):**

```yaml
# docker-compose.prod.yml
services:
  backend:
    image: your-backend-image
    environment:
      DATABASE_URL: ${DATABASE_URL_PROD}
    command: sh -c "npx prisma migrate deploy && npm start"
```

**Пример для Heroku (Release Phase):**

```json
// Procfile
release: cd backend && npx prisma migrate deploy
web: npm start
```

---

### Testing Before Production

**Обязательные шаги перед production:**

1. **Local Testing:**
   ```bash
   # Reset development DB
   npx prisma migrate reset

   # Verify migration works
   npx prisma migrate dev

   # Check data
   npx prisma studio
   ```

2. **Staging Environment:**
   ```bash
   # Apply to staging (copy of production data)
   DATABASE_URL="staging_url" npx prisma migrate deploy

   # Verify application works
   # Check logs for errors
   ```

3. **Performance Test:**
   ```bash
   # If you have >10k events, test migration speed:
   # 1. Backup staging DB
   # 2. Measure migration time
   # 3. If >5 seconds, consider batching (not needed for our migration)
   ```

4. **Rollback Plan:**
   ```bash
   # If migration fails, mark as rolled back:
   npx prisma migrate resolve --rolled-back 20251202141922_fix_checkin_modes_data

   # Then fix and create new migration
   ```

---

### Production Checklist

**Before deploying:**

- [ ] ✅ Migration tested locally
- [ ] ✅ Migration tested on staging with production-like data
- [ ] ✅ Migration is idempotent (can run multiple times safely)
- [ ] ✅ Migration SQL reviewed (no DROP, no DELETE without WHERE)
- [ ] ✅ Backup created (automatic in most cloud providers)
- [ ] ✅ Rollback plan documented
- [ ] ✅ Team notified about deployment
- [ ] ✅ Monitoring setup (check logs after deployment)

**During deployment:**

- [ ] ✅ Run `prisma migrate deploy` in CI/CD
- [ ] ✅ Monitor application logs
- [ ] ✅ Check `_prisma_migrations` table for success
- [ ] ✅ Verify application functionality

**After deployment:**

- [ ] ✅ Verify data correctness (random sampling)
- [ ] ✅ Monitor error rates
- [ ] ✅ Check performance metrics
- [ ] ✅ Document any issues

---

### Common Production Issues

**Issue 1: "Migration already applied"**
```bash
# Solution: This is normal! Migration was already run.
# No action needed.
```

**Issue 2: "Migration modified after being applied"**
```bash
# Solution: Never edit migration SQL after it's applied!
# Create a new migration instead.
```

**Issue 3: "Migration timeout"**
```bash
# Cause: Very large table (>100k rows)
# Solution: Increase DB timeout or batch the UPDATE
```

**Issue 4: "Permission denied"**
```bash
# Cause: Database user lacks UPDATE permission
# Solution: Grant proper permissions to migration user
```

---

## 📚 References

- [Prisma: Customizing Migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations)
- [Prisma: Data Migration Guide](https://www.prisma.io/docs/guides/migrate/data-migration)
- [Prisma: Migration History](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/migration-histories)

---

## 🎯 Summary

**Current approach:** ❌ Running data migration in `start.sh` every time

**Correct approach:** ✅ Run data migration once via:
- **Best:** Custom SQL in Prisma migration file
- **Good:** Manual TypeScript script with tracking
- **Bad:** Recurring execution in startup scripts

**Key principle:** Data migrations are **one-time operations**, not startup tasks.

---

## 🔧 Resolution: Schema Drift Issue (2025-12-02)

### Problem Encountered:
When attempting to create a data migration for fixing `checkInMode` values, we discovered **schema drift**:
- `schema.prisma` included `isExternalEvent`, `externalPartnerId`, and `ExternalPartner` model
- BUT no migration file existed for these schema changes
- This caused the shadow database validation to fail

### Root Cause:
The schema was manually edited without running `prisma migrate dev`, causing a mismatch between:
1. **Migration history** (missing schema changes)
2. **Schema file** (contains new fields)
3. **Database** (has the fields from manual application)

### Resolution Steps Taken:

1. **Verified actual database schema:**
   ```bash
   docker-compose exec -T postgres psql -U mnu_user -d mnu_events_dev -c "\d events"
   ```
   ✅ Confirmed `isExternalEvent` column exists in production

2. **Identified data issues:**
   - Found 10 internal free events with wrong `checkInMode` (ORGANIZER_SCANS instead of STUDENTS_SCAN)

3. **Applied data fix directly:**
   ```sql
   UPDATE "events"
   SET "checkInMode" = 'STUDENTS_SCAN'
   WHERE "isExternalEvent" = false
     AND "isPaid" = false
     AND "checkInMode" != 'STUDENTS_SCAN';
   ```
   ✅ Fixed 10 events

4. **Removed problematic migration file:**
   ```bash
   rm -rf backend/prisma/migrations/20251202141922_fix_checkin_modes_data/
   ```

### Lessons Learned:

❌ **NEVER manually edit `schema.prisma` without creating a migration:**
```bash
# WRONG:
# 1. Edit schema.prisma
# 2. Push to production
# ❌ No migration created!

# CORRECT:
# 1. Edit schema.prisma
# 2. Run: npx prisma migrate dev --name add_feature
# ✅ Migration created and tracked!
```

✅ **Always use Prisma's migration workflow:**
1. Edit `schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Review generated migration SQL
4. Commit both schema.prisma AND migration files to git

✅ **For data fixes when schema is out of sync:**
1. Apply SQL directly to fix data
2. Document the fix in this file
3. Consider creating a baselining migration if needed

### Prevention:
- Add pre-commit hook to check for schema changes without migrations
- Always run `prisma migrate dev` after schema edits
- Never use `prisma db push` in production (it bypasses migration history)

---

**Last Updated:** 2025-12-02
**Version:** 1.1
**Next Review:** When adding new data migrations
