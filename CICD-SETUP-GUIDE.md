# CI/CD Setup Guide - Bitbucket Pipelines

Complete guide to set up automated CI/CD for your Food Delivery Application using Bitbucket Pipelines.

---

## 📋 What This CI/CD Pipeline Does

### Automated Workflows:

1. **On Every Commit:**
   - ✅ Lint and validate code
   - ✅ Install dependencies
   - ✅ Run tests (if available)

2. **On Push to Main Branch:**
   - ✅ Build all 10 services in parallel
   - ✅ Create Docker images
   - ✅ Push images to Docker Hub
   - ✅ Tag with commit SHA and 'latest'

3. **On Pull Requests:**
   - ✅ Validate code changes
   - ✅ Run dependency checks
   - ✅ Ensure builds pass

4. **Manual Deployment:**
   - ✅ Deploy to Kubernetes (when ready)
   - ✅ Rollback capability
   - ✅ Staging/Production environments

---

## 🚀 Step 1: Prerequisites

### You Need:

1. **Bitbucket Account** (Free tier works)
   - Sign up at: https://bitbucket.org

2. **Docker Hub Account** (Free tier works)
   - Sign up at: https://hub.docker.com
   - Note your username

3. **Your Code in Bitbucket**
   ```bash
   # If not already in Bitbucket, initialize git
   cd /home/atharva/Downloads/food-delivery-app
   git init
   git add .
   git commit -m "Initial commit: Food delivery microservices"
   
   # Create repository on Bitbucket, then:
   git remote add origin https://bitbucket.org/YOUR_USERNAME/food-delivery-app.git
   git push -u origin main
   ```

---

## 🔐 Step 2: Configure Bitbucket Repository Variables

### 2.1: Go to Repository Settings

1. Open your Bitbucket repository
2. Click **Settings** (left sidebar)
3. Click **Repository variables** (under PIPELINES section)

### 2.2: Add Required Variables

Click **Add variable** for each:

| Variable Name | Value | Secured? | Description |
|---------------|-------|----------|-------------|
| `DOCKER_USERNAME` | your-dockerhub-username | No | Your Docker Hub username |
| `DOCKER_PASSWORD` | your-dockerhub-password | **YES** ✅ | Your Docker Hub password/token |
| `KUBE_CONFIG` | base64-encoded-kubeconfig | **YES** ✅ | Kubernetes config (optional, for deployment) |

### 2.3: How to Get KUBE_CONFIG (Optional - only if you have K8s cluster)

```bash
# On your Kubernetes master node
cat ~/.kube/config | base64 -w 0

# Copy the output and paste as KUBE_CONFIG variable value
```

---

## ⚙️ Step 3: Enable Bitbucket Pipelines

### 3.1: Enable Pipelines

1. Go to your repository on Bitbucket
2. Click **Pipelines** (left sidebar)
3. Click **Enable** (if not already enabled)

### 3.2: Verify Pipeline File

1. Your `bitbucket-pipelines.yml` should be in the root directory ✅
2. Bitbucket will automatically detect it

### 3.3: Configure Docker

1. In **Repository Settings** → **Pipelines** → **Settings**
2. Enable **Docker** under Services
3. Set Docker memory to **3072 MB** (recommended)

---

## 🧪 Step 4: Test the Pipeline

### 4.1: Trigger First Build

```bash
# Make a small change
echo "# CI/CD Enabled" >> README.md

# Commit and push
git add README.md
git commit -m "test: Enable CI/CD pipeline"
git push origin main
```

### 4.2: Watch the Build

1. Go to **Pipelines** in Bitbucket
2. You'll see your pipeline running
3. Click on it to see live logs

### 4.3: What You'll See

```
✅ Lint & Validate (30 seconds)
├─ Build User Service (2 minutes)
├─ Build Restaurant Service (2 minutes)
├─ Build Order Service (2 minutes)
├─ Build Payment Service (2 minutes)
├─ Build Review Service (2 minutes)
├─ Build Coupon Service (2 minutes)
├─ Build Delivery Service (2 minutes)
├─ Build Notification Service (2 minutes)
├─ Build API Gateway (2 minutes)
└─ Build Frontend (3 minutes)

Then in parallel:
├─ Build & Push User Service Docker Image (3 minutes)
├─ Build & Push Restaurant Service Docker Image (3 minutes)
├─ Build & Push Order Service Docker Image (3 minutes)
... (all services)

Total Time: ~15-20 minutes
```

---

## 📦 Step 5: Verify Docker Images

After pipeline completes:

1. Go to https://hub.docker.com
2. Login with your account
3. You should see 10 new repositories:
   - `your-username/food-delivery-user-service`
   - `your-username/food-delivery-restaurant-service`
   - `your-username/food-delivery-order-service`
   - `your-username/food-delivery-delivery-service`
   - `your-username/food-delivery-notification-service`
   - `your-username/food-delivery-payment-service`
   - `your-username/food-delivery-review-service`
   - `your-username/food-delivery-coupon-service`
   - `your-username/food-delivery-api-gateway`
   - `your-username/food-delivery-frontend`

Each should have 2 tags:
- `latest` - most recent build
- `<commit-sha>` - specific commit version

---

## 🎯 Step 6: Using the CI/CD Pipeline

### Automatic Triggers

**On every push to main:**
```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
# Pipeline automatically runs
```

**On every pull request:**
```bash
git checkout -b feature/new-feature
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature
# Create PR in Bitbucket UI
# Pipeline runs validation
```

### Manual Deployments

1. Go to **Pipelines** in Bitbucket
2. Click **Run pipeline**
3. Select branch: `main`
4. Choose pipeline:
   - `deploy-production` - Deploy to production K8s
   - `deploy-staging` - Deploy to staging
   - `rollback` - Rollback last deployment

---

## 🔧 Step 7: Customize Your Pipeline

### Enable/Disable Stages

Edit `bitbucket-pipelines.yml`:

```yaml
# Skip deployment for now
# Comment out the deploy stage:
# - step:
#     name: Deploy to Kubernetes (Optional)
#     ...
```

### Add Tests

If you have tests in any service:

```yaml
# In each service step, add:
- npm test
```

### Add Linting

```yaml
# Add ESLint step:
- step:
    name: Lint Code
    script:
      - npm install -g eslint
      - eslint .
```

### Change Docker Registry

To use different registry (e.g., AWS ECR, GitLab Registry):

```yaml
# Change login command
- docker login --username AWS --password $AWS_TOKEN $AWS_REGISTRY
- docker push $AWS_REGISTRY/$IMAGE_NAME:$TAG
```

---

## 📊 Pipeline Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Git Push to Main                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Lint & Validate (30s)        │
        └───────────┬───────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────────────┐
    │  Build & Test All Services (Parallel - 3min)   │
    ├───────────────────────────────────────────────┤
    │  ✓ User Service                                │
    │  ✓ Restaurant Service                          │
    │  ✓ Order Service                               │
    │  ✓ Payment Service                             │
    │  ✓ Review Service                              │
    │  ✓ Coupon Service                              │
    │  ✓ Delivery Service                            │
    │  ✓ Notification Service                        │
    │  ✓ API Gateway                                 │
    │  ✓ Frontend                                    │
    └───────────┬───────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────────────────────┐
    │  Build Docker Images (Parallel - 5min)         │
    ├───────────────────────────────────────────────┤
    │  ✓ docker build for each service               │
    │  ✓ Tag with commit SHA and 'latest'            │
    └───────────┬───────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────────────────────┐
    │  Push to Docker Hub (Parallel - 3min)          │
    ├───────────────────────────────────────────────┤
    │  ✓ Push all 10 images                          │
    │  ✓ Images available at hub.docker.com          │
    └───────────┬───────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────────────────────┐
    │  Deploy to Kubernetes (Manual - 2min)          │
    ├───────────────────────────────────────────────┤
    │  ✓ kubectl set image                           │
    │  ✓ Rolling update                              │
    │  ✓ Verify deployment                           │
    └───────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: Pipeline Fails on Docker Build

**Error:** `Cannot connect to Docker daemon`

**Solution:**
1. Go to Repository Settings → Pipelines → Settings
2. Enable **Docker** service
3. Increase Docker memory to 3072 MB

### Issue: Docker Hub Push Fails

**Error:** `unauthorized: authentication required`

**Solution:**
1. Check `DOCKER_USERNAME` is correct (no typos)
2. Check `DOCKER_PASSWORD` is correct
3. Make sure `DOCKER_PASSWORD` is marked as **Secured**
4. Use Docker Hub **Access Token** instead of password:
   - Go to Docker Hub → Account Settings → Security
   - Create New Access Token
   - Use token as `DOCKER_PASSWORD`

### Issue: Out of Build Minutes

**Error:** `Build minutes exceeded`

**Solution:**
- Bitbucket Free tier: 50 build minutes/month
- Optimize pipeline to skip unnecessary steps
- Or upgrade to Bitbucket Premium

### Issue: Build Timeout

**Error:** `Step exceeded maximum time`

**Solution:**
```yaml
# Add timeout to step
- step:
    name: Build Service
    max-time: 30  # 30 minutes
    script:
      - ...
```

### Issue: Kubernetes Deployment Fails

**Error:** `Unable to connect to cluster`

**Solution:**
1. Verify `KUBE_CONFIG` is set correctly
2. Test locally:
   ```bash
   echo "$KUBE_CONFIG" | base64 -d > kubeconfig
   export KUBECONFIG=kubeconfig
   kubectl get nodes
   ```

---

## 📈 Monitoring & Notifications

### Enable Email Notifications

1. Go to Repository Settings → Pipelines → Notifications
2. Enable notifications for:
   - ✅ Failed builds
   - ✅ Successful deployments
   - ✅ Pull request builds

### Integrate with Slack (Optional)

1. Go to Repository Settings → Integrations
2. Add Slack integration
3. Configure webhook URL
4. Get notified in Slack for builds

### Build Status Badge

Add to your README:

```markdown
[![Build Status](https://bitbucket-badges.useast.staging.atlassian.io/badge/YOUR_USERNAME/food-delivery-app.svg)](https://bitbucket.org/YOUR_USERNAME/food-delivery-app/addon/pipelines/home)
```

---

## 🚀 Advanced Features

### Branch-Specific Deployments

```yaml
branches:
  main:
    - step:
        deployment: production
  develop:
    - step:
        deployment: staging
  'feature/*':
    - step:
        name: Feature Branch Build
```

### Conditional Steps

```yaml
- step:
    name: Deploy
    condition:
      changesets:
        includePaths:
          - "backend/**"
    script:
      - echo "Backend changed, deploying..."
```

### Parallel Docker Builds

Already configured! All services build in parallel to save time.

### Caching Dependencies

```yaml
definitions:
  caches:
    npm-cache: node_modules

- step:
    caches:
      - npm-cache
    script:
      - npm install
```

---

## 📝 Best Practices

### 1. Use Semantic Versioning

```bash
git tag v1.0.0
git push origin v1.0.0
# Triggers release pipeline
```

### 2. Branch Protection

1. Go to Repository Settings → Branch permissions
2. Protect `main` branch
3. Require PR approvals
4. Require pipeline success

### 3. Review Pipeline Results

Before merging PR:
- ✅ Check all builds pass
- ✅ Review Docker image sizes
- ✅ Check for security vulnerabilities

### 4. Optimize Build Time

```yaml
# Use cache for dependencies
# Build only changed services
# Use smaller base images
FROM node:20-alpine  # Instead of node:20
```

### 5. Secrets Management

- ✅ Never commit secrets to git
- ✅ Use Bitbucket repository variables
- ✅ Mark sensitive variables as **Secured**
- ✅ Rotate secrets regularly

---

## 💰 Cost Analysis

### Bitbucket Free Tier

| Resource | Free Tier | Your Usage | Status |
|----------|-----------|------------|--------|
| Build Minutes | 50/month | ~20/build | 2-3 builds/month ✅ |
| Storage | 1 GB | ~500 MB | OK ✅ |
| Users | Up to 5 | 1 | OK ✅ |

### Docker Hub Free Tier

| Resource | Free Tier | Your Usage | Status |
|----------|-----------|------------|--------|
| Repositories | Unlimited public | 10 repos | OK ✅ |
| Image Pulls | 200/6 hours | ~20/day | OK ✅ |
| Storage | Unlimited | ~5 GB | OK ✅ |

### If You Exceed Limits

**Option 1:** Optimize builds
- Build only on main branch
- Skip unnecessary steps
- Use caching

**Option 2:** Upgrade plans
- Bitbucket Standard: $3/user/month
- Docker Hub Pro: $5/month

---

## ✅ Checklist

Before going live with CI/CD:

- [ ] Repository pushed to Bitbucket
- [ ] `bitbucket-pipelines.yml` in root directory
- [ ] Docker Hub account created
- [ ] `DOCKER_USERNAME` variable set
- [ ] `DOCKER_PASSWORD` variable set (secured)
- [ ] Pipelines enabled in Bitbucket
- [ ] Docker service enabled (3072 MB memory)
- [ ] First build tested and passed
- [ ] Docker images visible on Docker Hub
- [ ] Email notifications configured
- [ ] Branch protection enabled (optional)
- [ ] README updated with build badge (optional)

---

## 🎯 Next Steps

After CI/CD is working:

1. **Add Tests** - Write unit tests for services
2. **Add Linting** - ESLint for code quality
3. **Add Security Scanning** - Scan Docker images for vulnerabilities
4. **Setup Kubernetes** - Use Minikube or Oracle Cloud
5. **Enable Auto-Deploy** - Automatic deployment on successful builds
6. **Add Monitoring** - Track deployment metrics

---

## 📚 Resources

- [Bitbucket Pipelines Docs](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/)
- [Docker Hub Docs](https://docs.docker.com/docker-hub/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

---

## 🎉 Success!

Your CI/CD pipeline is ready! Every time you push code:

✅ Code is automatically built  
✅ Docker images are created  
✅ Images are pushed to Docker Hub  
✅ Ready to deploy anywhere  

**Start using it:**
```bash
git add .
git commit -m "feat: My awesome feature"
git push origin main
# Watch the magic happen in Bitbucket Pipelines!
```
