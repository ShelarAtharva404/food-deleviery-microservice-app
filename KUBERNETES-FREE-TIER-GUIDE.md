# Kubernetes Deployment - AWS Free Tier Guide

## 🎓 AWS Free Tier Limitations

### What AWS Free Tier Includes (12 months):
- ✅ **750 hours/month** of t2.micro or t3.micro instances
- ✅ **30 GB** of EBS storage (gp2 or gp3)
- ✅ **15 GB** data transfer out per month
- ✅ **5 GB** S3 storage

### What You Need for Kubernetes:
- ❌ **Minimum:** 3 nodes (1 master + 2 workers) = 2,250 hours/month
- ❌ **Instance Type:** t3.medium (2 vCPU, 4GB RAM) - NOT in free tier
- ❌ **Issue:** t2.micro (1 vCPU, 1GB RAM) is too small for Kubernetes

---

## 💡 Your Options with Free Tier

### ❌ Option 1: Full Kubernetes Cluster (NOT POSSIBLE)
**Why it won't work:**
- Kubernetes needs minimum 2GB RAM per node
- t2.micro only has 1GB RAM
- Need 3 nodes (2,250 hours) but free tier only gives 750 hours
- **Cost if attempted:** ~$107/month (all paid)

---

### ✅ Option 2: Single-Node Kubernetes (POSSIBLE - Educational)
**What you can do:**
- 1x t2.micro instance for learning Kubernetes basics
- Deploy only 2-3 lightweight services
- **Cost:** FREE for 12 months (then ~$9/month)

**Limitations:**
- No high availability
- Limited resources (only ~2 pods will fit)
- Not production-ready
- Good for learning only

---

### ✅ Option 3: Docker Compose (RECOMMENDED - FREE)
**What you currently have:**
- ✅ Running locally on your machine
- ✅ All 11 services working
- ✅ Fully functional
- ✅ **Cost:** $0 (completely free)

**Best for:**
- Development
- Testing
- Portfolio demos
- Learning microservices

---

### ⭐ Option 4: Minikube (LOCAL KUBERNETES - BEST FOR FREE)
**What it is:**
- Kubernetes running on your local machine
- Same experience as cloud Kubernetes
- No AWS costs
- Full Kubernetes features

**Best for:**
- Learning Kubernetes
- Developing K8s applications
- Testing deployments
- Free forever

---

### 🚀 Option 5: Free Cloud Kubernetes Services
**Alternatives to AWS:**

1. **Oracle Cloud (Always Free Tier)**
   - 2x AMD instances (1 OCPU, 1GB RAM each)
   - 4x ARM instances (1 OCPU, 6GB RAM each!)
   - 200GB total storage
   - **Truly forever free** (not just 12 months)
   - Can run small K8s cluster

2. **Google Cloud (GKE Free Tier)**
   - $300 credit for 90 days
   - Then ~$74/month for small cluster

3. **Digital Ocean**
   - $200 credit for 60 days
   - Then ~$36/month for smallest cluster

---

## 🎯 My Recommendation for You

### Path 1: Learn Locally (FREE)

**Step 1: Keep Using Docker Compose** (What you have now)
```bash
# Already working!
docker compose up -d
# Access at http://localhost:3000
```
✅ Cost: $0  
✅ Time: 0 minutes (already done)  
✅ Features: All 11 services working

**Step 2: Learn Kubernetes with Minikube**
```bash
# Install Minikube on your Ubuntu machine
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start local Kubernetes cluster
minikube start --memory=8192 --cpus=4

# Use your existing manifests!
kubectl apply -f k8s/

# Access application
minikube service frontend -n food-delivery
```
✅ Cost: $0  
✅ Time: 15 minutes  
✅ Features: Full Kubernetes experience locally

---

### Path 2: Free Cloud Kubernetes (BEST FREE CLOUD OPTION)

**Use Oracle Cloud Always Free Tier**

**What you get (FOREVER FREE):**
- 4x ARM-based instances (1 OCPU, 6GB RAM each = 24GB total!)
- 200GB storage
- 10TB outbound data transfer/month
- Truly free forever, not just 12 months

**Setup:**
1. Sign up at oracle.com/cloud/free
2. Create 3 ARM instances (1 master + 2 workers)
3. Follow the same Kubernetes setup guide
4. Deploy your application

✅ Cost: $0 forever  
✅ Time: 2-3 hours  
✅ Features: Production-ready Kubernetes cluster

---

### Path 3: Use AWS Credits (If Student)

**AWS Educate / AWS Academy:**
- Students get $100-300 in AWS credits
- Check if your college has AWS Educate program
- Apply at: aws.amazon.com/education/awseducate/

**GitHub Student Developer Pack:**
- Includes AWS credits
- Apply at: education.github.com

---

## 📊 Cost Comparison

| Option | Setup Time | Monthly Cost | Best For |
|--------|------------|--------------|----------|
| **Docker Compose** | ✅ Done | **$0** | Development |
| **Minikube (Local K8s)** | 15 min | **$0** | Learning K8s |
| **Oracle Cloud Free** | 2-3 hours | **$0 forever** | Production (free) |
| **AWS Free Tier (1 node)** | 2 hours | **$0** (12 mo) | Learning only |
| **AWS (3 nodes)** | 2 hours | **$107/month** | Production (paid) |

---

## 🎓 Step-by-Step: Minikube Setup (RECOMMENDED)

### Prerequisites:
- Docker already installed ✅
- At least 8GB RAM on your machine
- 20GB free disk space

### Installation:

```bash
# 1. Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# 2. Start Minikube with enough resources
minikube start --memory=8192 --cpus=4 --disk-size=20g

# 3. Verify installation
kubectl get nodes
# Should show 1 node ready

# 4. Enable addons
minikube addons enable ingress
minikube addons enable metrics-server

# 5. Build images and load into Minikube
# Option A: Use Docker Hub (need to push images)
./build-and-push-images.sh <dockerhub-username>
./update-k8s-images.sh <dockerhub-username>

# Option B: Use local Docker images (faster, no push needed)
eval $(minikube docker-env)
docker compose build

# Update manifests to use local images
# Change imagePullPolicy: Always to imagePullPolicy: Never

# 6. Deploy application
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-secrets.yaml
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml

# Wait for PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres -n food-delivery --timeout=300s

# Deploy services
kubectl apply -f k8s/06-user-service.yaml
kubectl apply -f k8s/07-restaurant-service.yaml
kubectl apply -f k8s/08-order-service.yaml
kubectl apply -f k8s/09-delivery-service.yaml
kubectl apply -f k8s/10-notification-service.yaml
kubectl apply -f k8s/11-payment-service.yaml
kubectl apply -f k8s/12-review-service.yaml
kubectl apply -f k8s/13-coupon-service.yaml
kubectl apply -f k8s/14-api-gateway.yaml
kubectl apply -f k8s/15-frontend.yaml

# 7. Seed database
./seed-k8s-database.sh

# 8. Access application
minikube service frontend -n food-delivery
# Opens browser automatically!

# Or get the URL
minikube service frontend -n food-delivery --url
```

### Useful Minikube Commands:

```bash
# Check status
minikube status

# Access Kubernetes dashboard
minikube dashboard

# Stop cluster (saves state)
minikube stop

# Start again
minikube start

# Delete cluster
minikube delete

# SSH into the node
minikube ssh

# View logs
minikube logs
```

---

## 🌟 Step-by-Step: Oracle Cloud Setup (FREE FOREVER)

### Step 1: Sign Up (10 minutes)

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start for free"
3. Create account (requires credit card for verification, but won't be charged)
4. Choose "Always Free" resources

### Step 2: Create Instances (20 minutes)

```bash
# Create 3 ARM-based instances:
Instance Type: VM.Standard.A1.Flex
OCPU: 1
Memory: 6GB RAM
OS: Ubuntu 22.04
Storage: 50GB per instance

# Create 3 instances:
- k8s-master (ARM, 1 OCPU, 6GB RAM)
- k8s-worker-1 (ARM, 1 OCPU, 6GB RAM)
- k8s-worker-2 (ARM, 1 OCPU, 6GB RAM)
```

### Step 3: Setup Kubernetes (Same as AWS Guide)

Follow the same steps from KUBERNETES-SETUP-GUIDE.md:
- Phase 2: Install containerd & Kubernetes
- Phase 3: Initialize cluster
- Phase 4: Build images
- Phase 5: Deploy

**Important:** Use ARM-compatible images or build for ARM architecture.

---

## 🎯 My Specific Recommendation for You

Since you have AWS Free Tier, here's the best path:

### Short-term (Next 2-4 weeks):

**1. Learn Kubernetes with Minikube (FREE, LOCAL)**
```bash
# Install Minikube on your machine
minikube start --memory=8192 --cpus=4

# Deploy your app
kubectl apply -f k8s/

# Learn kubectl commands
kubectl get pods -n food-delivery
kubectl logs -f deployment/user-service -n food-delivery

# Access application
minikube service frontend -n food-delivery
```

**Benefits:**
- ✅ $0 cost
- ✅ Full Kubernetes experience
- ✅ Use your existing manifests
- ✅ Learn at your own pace
- ✅ Can stop/start anytime

### Long-term (For production/portfolio):

**2. Switch to Oracle Cloud Free Tier**
- Sign up for Oracle Cloud Always Free
- Much more generous than AWS (6GB RAM per instance!)
- Deploy same application
- Keep running forever for free

**OR**

**3. Keep Docker Compose for portfolio**
- Record a video demo
- Take screenshots
- Deploy to your local machine for interviews
- Show the code on GitHub

---

## 💡 What I Suggest RIGHT NOW

### Option A: Learn with Minikube (Best for Learning)

```bash
# 15 minutes to get started
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube start --memory=8192 --cpus=4
kubectl apply -f k8s/
```

### Option B: Keep Docker Compose (Best for Portfolio)

```bash
# Already working!
# Just document it well:
# - Take screenshots
# - Record demo video
# - Add to GitHub
# - Explain architecture in README
```

---

## 📝 Modified Manifests for Minikube

I can create reduced resource versions:

```yaml
# Reduce resources for Minikube
resources:
  requests:
    cpu: 50m      # Was 100m
    memory: 64Mi  # Was 128Mi
  limits:
    cpu: 100m     # Was 200m
    memory: 128Mi # Was 256Mi

# Reduce replicas
replicas: 1  # Was 2 for most services
```

Would you like me to:
1. Create Minikube-optimized manifests? (reduced resources)
2. Create Oracle Cloud setup guide?
3. Create a comprehensive video script for portfolio demo?

---

## ✅ Summary

**For AWS Free Tier:**
- ❌ Can't run full 3-node Kubernetes cluster
- ✅ Can learn Kubernetes locally with Minikube (FREE)
- ✅ Can keep Docker Compose running (FREE)

**Best Path:**
1. **Now:** Keep Docker Compose for demos
2. **This week:** Install Minikube and deploy to local K8s
3. **Next month:** If you want cloud, use Oracle Cloud Free Tier

**Cost Breakdown:**
- Docker Compose: **$0**
- Minikube: **$0**
- Oracle Cloud Free: **$0 forever**
- AWS (3 nodes): **$107/month** ❌ Not free tier

**My Recommendation:**
Install Minikube today and deploy your app to local Kubernetes. It's the perfect learning environment and completely free!

Want me to create the Minikube-optimized deployment files?
