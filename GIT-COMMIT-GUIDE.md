# Git Commit Guide - What to Commit & What to Ignore

## ✅ Files to COMMIT (Safe to push)

### Application Code
- ✅ All `.js` files (source code)
- ✅ All `.jsx` files (React components)
- ✅ `package.json` files (dependencies list)
- ✅ `Dockerfile` files (Docker configurations)
- ✅ `docker-compose.yml` (Docker setup)

### Configuration Templates
- ✅ `.env.example` files (example environment variables)
- ✅ `config.example.js` (example configs)
- ✅ `.dockerignore` files

### Infrastructure
- ✅ All `k8s/*.yaml` files (Kubernetes manifests)
- ✅ `bitbucket-pipelines.yml` (CI/CD config)
- ✅ `nginx.conf` (web server config)

### Documentation
- ✅ All `*.md` files (documentation)
- ✅ `README.md`
- ✅ All guide files

### Scripts
- ✅ All `.sh` files (shell scripts)
- ✅ Database migration files

### Frontend Assets
- ✅ `public/` folder contents
- ✅ `src/` folder (all source code)
- ✅ CSS files
- ✅ Image files (icons, logos)

---

## ❌ Files to NEVER COMMIT (Dangerous!)

### Secrets & Credentials
- ❌ `.env` files (contain passwords, API keys)
- ❌ `*.pem` files (SSH keys)
- ❌ `*.key` files (private keys)
- ❌ `kubeconfig` files (Kubernetes access)
- ❌ Any file with passwords or tokens

### Dependencies
- ❌ `node_modules/` folders (huge, reinstallable)
- ❌ `package-lock.json` (can cause conflicts)
- ❌ `yarn.lock`

### Build Artifacts
- ❌ `build/` folders (generated files)
- ❌ `dist/` folders (compiled output)
- ❌ `*.log` files (logs)

### IDE/Editor Files
- ❌ `.vscode/` settings
- ❌ `.idea/` (JetBrains IDEs)
- ❌ `*.swp` (Vim)

### System Files
- ❌ `.DS_Store` (macOS)
- ❌ `Thumbs.db` (Windows)

---

## 🔍 Check Before Committing

### Quick Check Command:
```bash
# See what will be committed
git status

# See actual changes
git diff

# Check for sensitive data
git diff | grep -i "password\|secret\|token\|key"
```

### Review These Patterns:
```bash
# Check for accidentally added .env files
git status | grep "\.env$"

# Check for accidentally added node_modules
git status | grep "node_modules"

# Check for large files
find . -type f -size +10M -not -path "*/node_modules/*"
```

---

## 🛡️ Current .gitignore Coverage

Your `.gitignore` file currently ignores:

### Dependencies & Build
```
node_modules/
*.log
dist/
build/
coverage/
```

### Environment & Secrets
```
.env
.env.*
*.pem
*.key
kubeconfig
**/secrets/
```

### IDE & System
```
.vscode/
.idea/
.DS_Store
Thumbs.db
```

### Database
```
*.sqlite
*.db
*.sql
```

---

## 🚨 If You Accidentally Committed Secrets

### If NOT pushed yet:
```bash
# Remove from staging
git reset HEAD .env

# Or remove from last commit
git reset --soft HEAD~1
git restore --staged .env
git commit -m "Your message"
```

### If already PUSHED:
```bash
# 1. Remove from repository history (DANGER!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/.env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (rewrites history)
git push origin --force --all

# 3. Rotate ALL secrets in that file immediately!
# Change all passwords, API keys, tokens, etc.
```

### Better approach: Use BFG Repo-Cleaner
```bash
# Install BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Remove sensitive file from history
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## 📝 Best Practices

### 1. Use .env.example
Create template files without sensitive data:

**.env.example:**
```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password-here
DB_NAME=userdb

# JWT Configuration
JWT_SECRET=your-secret-key-here

# API Keys
STRIPE_API_KEY=your-stripe-key-here
```

**Never commit `.env`, only `.env.example`!**

### 2. Check Before Every Commit
```bash
# Always review what you're committing
git status
git diff

# Stage files carefully
git add specific-file.js
# NOT: git add .  (too risky)
```

### 3. Use Pre-commit Hooks
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Check for sensitive files
if git diff --cached --name-only | grep -q "\.env$"; then
    echo "Error: Attempting to commit .env file!"
    exit 1
fi

# Check for secrets in code
if git diff --cached | grep -iE "password|secret|token|api_key" | grep -v "\.example"; then
    echo "Warning: Possible secrets detected!"
    echo "Review your changes carefully."
fi
```

### 4. Use .gitattributes for Binary Files
Create `.gitattributes`:
```
# Images
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary

# Archives
*.zip binary
*.tar.gz binary
```

---

## 🔒 Secrets Management Alternatives

### For Development:
- ✅ Use `.env.example` as template
- ✅ Each developer creates their own `.env` locally
- ✅ Never commit `.env` to git

### For Production:
- ✅ Use Kubernetes Secrets
- ✅ Use environment variables in CI/CD
- ✅ Use secret management tools:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault

### For CI/CD:
- ✅ Bitbucket Repository Variables (marked as secured)
- ✅ GitHub Secrets
- ✅ GitLab CI/CD Variables

---

## 📊 File Size Limits

### GitHub/Bitbucket Recommendations:
- **Per file:** < 50 MB
- **Repository:** < 1 GB
- **Warning at:** 100 MB per file

### Large Files to Avoid:
- ❌ Database dumps
- ❌ Video files
- ❌ Large datasets
- ❌ Compiled binaries

**Use Git LFS for large files if needed:**
```bash
git lfs install
git lfs track "*.mp4"
git lfs track "*.zip"
```

---

## ✅ Pre-Commit Checklist

Before every `git commit`:

- [ ] Reviewed `git status` output
- [ ] Checked `git diff` for sensitive data
- [ ] No `.env` files in staging
- [ ] No `node_modules/` folders
- [ ] No large binary files (unless tracked with LFS)
- [ ] No credentials in code
- [ ] Commit message is descriptive
- [ ] Code is tested and working

---

## 🎯 Safe Commit Workflow

```bash
# 1. Check current status
git status

# 2. Review changes
git diff

# 3. Stage specific files (not all)
git add src/components/NewFeature.js
git add package.json

# 4. Check what will be committed
git status

# 5. Commit with descriptive message
git commit -m "feat: Add new feature for user authentication"

# 6. Push to remote
git push origin main
```

---

## 🚀 First Commit Checklist

Before your first push to Bitbucket:

- [ ] `.gitignore` is configured
- [ ] All `.env` files are ignored
- [ ] No `node_modules/` folders committed
- [ ] `.env.example` files created
- [ ] Documentation is up to date
- [ ] Sensitive data removed from code
- [ ] Scripts are executable (`chmod +x`)
- [ ] README.md is informative

---

## 📚 Quick Reference

### See what's ignored:
```bash
git status --ignored
```

### Test if file will be ignored:
```bash
git check-ignore -v .env
# Output: .gitignore:5:.env    .env
```

### Remove already committed file:
```bash
git rm --cached .env
git commit -m "Remove .env from repository"
```

### Show all tracked files:
```bash
git ls-files
```

### Find large files in repository:
```bash
git rev-list --objects --all |
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' |
  awk '/^blob/ {print substr($0,6)}' |
  sort --numeric-sort --key=2 |
  tail -20
```

---

## 🎓 Learn More

- [Git Documentation](https://git-scm.com/doc)
- [GitHub .gitignore Templates](https://github.com/github/gitignore)
- [Removing Sensitive Data from Git](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## ✅ Your Project Status

**Currently Ignored (Safe ✅):**
- All `.env` files
- `node_modules/` folders
- Log files
- Build artifacts
- IDE settings

**Currently Tracked (Ready to Commit ✅):**
- All source code (`.js`, `.jsx` files)
- Configuration templates (`.env.example`)
- Docker files
- Kubernetes manifests
- Documentation
- CI/CD configuration

**You're ready to commit safely!** 🎉
