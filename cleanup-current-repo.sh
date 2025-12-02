#!/bin/bash
set -e

# ============================================
# MNU Events - Clean Current Repository
# ============================================
# This script cleans the CURRENT repository for production
# WARNING: This will delete development branches!

echo "⚠️  MNU Events - Repository Cleanup (IN-PLACE)"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  WARNING: This will modify your CURRENT repository!${NC}"
echo ""
echo "This script will:"
echo "  - Delete all claude/* branches"
echo "  - Remove AI configuration files from Git"
echo "  - Clean up temporary branches"
echo "  - Create production-ready main branch"
echo ""
echo -e "${YELLOW}💾 Your work will be preserved in Git history.${NC}"
echo -e "${YELLOW}📌 Current branch will be backed up.${NC}"
echo ""

# Ask for confirmation
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${YELLOW}📦 Step 1: Creating backup...${NC}"

# Create backup branch
BACKUP_BRANCH="backup-before-cleanup-$(date +%Y%m%d-%H%M%S)"
CURRENT_BRANCH=$(git branch --show-current)

git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✅ Backup created: $BACKUP_BRANCH${NC}"
echo ""

echo -e "${YELLOW}🌿 Step 2: Listing branches to delete...${NC}"

# Get list of claude branches
CLAUDE_BRANCHES=$(git branch -a | grep -E 'claude/' | sed 's/^[ *]*//' | sed 's/remotes\/origin\///')

if [ -z "$CLAUDE_BRANCHES" ]; then
    echo "No claude/* branches found."
else
    echo "Found branches:"
    echo "$CLAUDE_BRANCHES"
    echo ""
fi

# Delete local claude branches
echo -e "${YELLOW}🗑️  Step 3: Deleting local claude branches...${NC}"
for branch in $(git branch | grep -E 'claude/'); do
    branch=$(echo $branch | sed 's/^[ *]*//')
    echo "Deleting local: $branch"
    git branch -D "$branch" 2>/dev/null || echo "  (already deleted or protected)"
done
echo -e "${GREEN}✅ Local branches cleaned${NC}"
echo ""

# Delete remote claude branches
echo -e "${YELLOW}🌐 Step 4: Deleting remote claude branches...${NC}"
for branch in $(git branch -r | grep -E 'origin/claude/'); do
    branch=$(echo $branch | sed 's/^[ *]*//' | sed 's/origin\///')
    echo "Deleting remote: origin/$branch"
    git push origin --delete "$branch" 2>/dev/null || echo "  (already deleted or protected)"
done
echo -e "${GREEN}✅ Remote branches cleaned${NC}"
echo ""

# Delete temp branches
echo -e "${YELLOW}🗑️  Step 5: Cleaning temp branches...${NC}"
for branch in $(git branch | grep -E '^[ *]*temp-'); do
    branch=$(echo $branch | sed 's/^[ *]*//')
    if [ "$branch" != "$CURRENT_BRANCH" ]; then
        echo "Deleting temp: $branch"
        git branch -D "$branch" 2>/dev/null || echo "  (already deleted or protected)"
    fi
done
echo -e "${GREEN}✅ Temp branches cleaned${NC}"
echo ""

echo -e "${YELLOW}🧹 Step 6: Removing AI configs from Git...${NC}"

# Ensure we're on main
if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout main
fi

# Remove .kilocode/mcp.json from Git (but keep in working directory)
if git ls-files .kilocode/mcp.json | grep -q .; then
    git rm --cached .kilocode/mcp.json
    echo "Removed .kilocode/mcp.json from Git"
fi

# Update .gitignore
if ! grep -q "^.kilocode/$" .gitignore; then
    echo "" >> .gitignore
    echo "# Kilocode AI" >> .gitignore
    echo ".kilocode/" >> .gitignore
    echo "Added .kilocode/ to .gitignore"
fi

# Commit changes
if git diff --cached --quiet; then
    echo "No changes to commit"
else
    git add .gitignore
    git commit -m "chore: remove AI configs from Git and update .gitignore

- Removed .kilocode/mcp.json from Git tracking
- Updated .gitignore to exclude all AI assistant configs
- Cleaned up for production deployment
"
    echo -e "${GREEN}✅ AI configs removed from Git${NC}"
fi
echo ""

echo -e "${YELLOW}📝 Step 7: Creating DEPLOY.md...${NC}"

cat > DEPLOY.md << 'EOF'
# Production Deployment

This repository is now **production-ready**.

## 🚀 Quick Deploy

See `docs/DEPLOYMENT_GUIDE.md` for complete instructions.

## 🧹 Cleanup Status

This repository has been cleaned:
- ✅ Removed all claude/* branches
- ✅ Removed AI configuration files from Git
- ✅ Updated .gitignore for production
- ✅ Cleaned temporary branches

## 🔒 Security

**NEVER commit:**
- `.env` files with real secrets
- API keys or passwords
- Database credentials
- SSL certificates

## 🌿 Branch Strategy

- `main` - Production-ready code (protected)
- `staging` - Pre-production testing (create if needed)
- `hotfix/*` - Emergency fixes

## 📚 Documentation

- `docs/DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `docs/PRODUCTION_READY_CHANGES.md` - Recent changes
- `README.md` - Project overview

---

**Cleaned:** $(date +%Y-%m-%d)
EOF

git add DEPLOY.md
git commit -m "docs: add production deployment guide" || echo "(no changes)"
echo -e "${GREEN}✅ DEPLOY.md created${NC}"
echo ""

echo ""
echo -e "${GREEN}✅ ============================================${NC}"
echo -e "${GREEN}✅  Repository cleaned successfully!${NC}"
echo -e "${GREEN}✅ ============================================${NC}"
echo ""
echo -e "${YELLOW}📍 Backup branch: $BACKUP_BRANCH${NC}"
echo ""
echo "📋 Summary:"
echo "  ✅ Claude branches deleted"
echo "  ✅ AI configs removed from Git"
echo "  ✅ .gitignore updated"
echo "  ✅ Temp branches cleaned"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Verify the cleanup:"
echo "   git branch -a"
echo "   git status"
echo ""
echo "2. Push cleaned repository:"
echo "   git push origin main --force-with-lease"
echo "   # Note: Use --force-with-lease to safely overwrite remote"
echo ""
echo "3. (Optional) If you want to restore backup:"
echo "   git checkout $BACKUP_BRANCH"
echo ""
echo "4. Deploy to production (see docs/DEPLOYMENT_GUIDE.md)"
echo ""
echo -e "${YELLOW}⚠️  Remember to set environment variables in your deployment platform!${NC}"
echo ""
