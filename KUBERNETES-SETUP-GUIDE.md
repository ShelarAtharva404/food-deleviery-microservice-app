# Step-by-Step Kubernetes Deployment Guide

Complete guide to deploy the Food Delivery Application on AWS EC2 using kubeadm.

---

## 📋 Prerequisites

- AWS Account with billing enabled
- SSH client installed on your local machine
- Docker Hub account (free tier works)
- Basic knowledge of Linux commands

---

## Phase 1: AWS Setup (30 minutes)

### Step 1: Launch EC2 Instances

1. **Login to AWS Console** → EC2 Dashboard

2. **Launch Instances** (Do this 3 times for 3 nodes):

   **Master Node (1 instance):**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: `t3.medium` (2 vCPU, 4GB RAM)
   - Storage: 30 GB gp3
   - Name tag: `k8s-master`

   **Worker Nodes (2 instances):**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: `t3.medium` (2 vCPU, 4GB RAM)
   - Storage: 30 GB gp3
   - Name tags: `k8s-worker-1`, `k8s-worker-2`

3. **Create Security Group** (name: `k8s-cluster-sg`):

   Click "Security Groups" → "Create Security Group"
   
   **Inbound Rules:**
   ```
   Type              Port Range    Source              Description
   SSH               22            Your IP             SSH access
   HTTP              80            0.0.0.0/0           HTTP access
   HTTPS             443           0.0.0.0/0           HTTPS access
   Custom TCP        6443          VPC CIDR            K8s API Server
   Custom TCP        2379-2380     VPC CIDR            etcd
   Custom TCP        10250-10252   VPC CIDR            Kubelet/Scheduler
   Custom TCP        30000-32767   0.0.0.0/0           NodePort Services
   All Traffic       All           sg-xxxxx (self)     Inter-node communication
   ```

4. **Create Key Pair**:
   - Key pair name: `k8s-cluster-key`
   - Download the `.pem` file
   - Save it securely (you'll need it for SSH)

5. **Assign Security Group** to all 3 instances

6. **Note down the IPs**:
   ```
   Master Node:   Public IP: ___.___.___.___   Private IP: 172.31.x.x
   Worker Node 1: Public IP: ___.___.___.___   Private IP: 172.31.y.y
   Worker Node 2: Public IP: ___.___.___.___   Private IP: 172.31.z.z
   ```

### Step 2: Configure SSH Key

On your local machine:

```bash
# Set correct permissions for your key
chmod 400 ~/Downloads/k8s-cluster-key.pem

# Test SSH connection to master
ssh -i ~/Downloads/k8s-cluster-key.pem ubuntu@<MASTER_PUBLIC_IP>
```

---

## Phase 2: Prepare All Nodes (20 minutes)

Run these commands on **ALL 3 NODES** (master + 2 workers).

### Step 1: SSH to Each Node

Open 3 terminal windows:

```bash
# Terminal 1 - Master
ssh -i ~/Downloads/k8s-cluster-key.pem ubuntu@<MASTER_PUBLIC_IP>

# Terminal 2 - Worker 1
ssh -i ~/Downloads/k8s-cluster-key.pem ubuntu@<WORKER1_PUBLIC_IP>

# Terminal 3 - Worker 2
ssh -i ~/Downloads/k8s-cluster-key.pem ubuntu@<WORKER2_PUBLIC_IP>
```

### Step 2: Set Hostnames

```bash
# On master node:
sudo hostnamectl set-hostname k8s-master

# On worker 1:
sudo hostnamectl set-hostname k8s-worker-1

# On worker 2:
sudo hostnamectl set-hostname k8s-worker-2

# Verify
hostname
```

### Step 3: Update /etc/hosts (On ALL nodes)

```bash
# Edit hosts file
sudo nano /etc/hosts

# Add these lines (use your PRIVATE IPs):
<MASTER_PRIVATE_IP>   k8s-master
<WORKER1_PRIVATE_IP>  k8s-worker-1
<WORKER2_PRIVATE_IP>  k8s-worker-2

# Save and exit (Ctrl+X, Y, Enter)

# Test
ping -c 2 k8s-master
```

### Step 4: Install containerd (On ALL nodes)

```bash
# Load kernel modules
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# Setup network
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system

# Install containerd
sudo apt update
sudo apt install -y containerd

# Configure containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# Enable SystemdCgroup
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

# Restart containerd
sudo systemctl restart containerd
sudo systemctl enable containerd

# Verify
sudo systemctl status containerd
```

### Step 5: Install Kubernetes Tools (On ALL nodes)

```bash
# Disable swap
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Install dependencies
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl

# Add Kubernetes GPG key
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# Add Kubernetes repository
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list

# Install kubeadm, kubelet, kubectl
sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Verify installation
kubeadm version
kubectl version --client
```

---

## Phase 3: Initialize Kubernetes Cluster (15 minutes)

### Step 1: Initialize Master Node (On MASTER ONLY)

```bash
# Initialize cluster (use master's PRIVATE IP)
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=<MASTER_PRIVATE_IP>

# IMPORTANT: Save the "kubeadm join" command that appears!
# It looks like this:
# kubeadm join <master-ip>:6443 --token xxxxx \
#   --discovery-token-ca-cert-hash sha256:xxxxx
```

### Step 2: Configure kubectl (On MASTER ONLY)

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Verify
kubectl get nodes
# Should show master node in NotReady state
```

### Step 3: Install Flannel CNI (On MASTER ONLY)

```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Wait for it to be ready (takes 1-2 minutes)
kubectl get pods -n kube-flannel -w

# Press Ctrl+C when all pods are Running

# Check node status
kubectl get nodes
# Should now show Ready
```

### Step 4: Join Worker Nodes (On WORKER NODES ONLY)

```bash
# On worker-1 and worker-2, run the join command you saved:
sudo kubeadm join <master-ip>:6443 --token xxxxx \
  --discovery-token-ca-cert-hash sha256:xxxxx

# If you lost the join command, generate a new one on master:
# kubeadm token create --print-join-command
```

### Step 5: Verify Cluster (On MASTER)

```bash
kubectl get nodes

# Should show all 3 nodes as Ready:
# NAME           STATUS   ROLES           AGE   VERSION
# k8s-master     Ready    control-plane   5m    v1.28.x
# k8s-worker-1   Ready    <none>          2m    v1.28.x
# k8s-worker-2   Ready    <none>          2m    v1.28.x
```

---

## Phase 4: Build and Push Docker Images (30 minutes)

**Run this on YOUR LOCAL MACHINE** (not on EC2):

### Step 1: Login to Docker Hub

```bash
# Create account at https://hub.docker.com if you don't have one

# Login
docker login
# Enter your Docker Hub username and password
```

### Step 2: Build and Push Images

```bash
cd /home/atharva/Downloads/food-delivery-app

# Run the build script
./build-and-push-images.sh <your-dockerhub-username>

# This will take 20-30 minutes
# It builds all 10 services and pushes them to Docker Hub
```

### Step 3: Update Kubernetes Manifests

```bash
# Update YAML files with your Docker Hub username
./update-k8s-images.sh <your-dockerhub-username>

# Verify
grep "image:" k8s/06-user-service.yaml
# Should show: image: <your-username>/food-delivery-user-service:v1.0
```

---

## Phase 5: Deploy to Kubernetes (15 minutes)

### Step 1: Copy Files to Master Node

**From your local machine:**

```bash
# Copy k8s directory to master
scp -i ~/Downloads/k8s-cluster-key.pem -r k8s/ \
  ubuntu@<MASTER_PUBLIC_IP>:~/

# Copy deployment scripts
scp -i ~/Downloads/k8s-cluster-key.pem \
  deploy-to-k8s.sh seed-k8s-database.sh \
  ubuntu@<MASTER_PUBLIC_IP>:~/
```

### Step 2: Deploy Application (On MASTER)

```bash
# SSH to master
ssh -i ~/Downloads/k8s-cluster-key.pem ubuntu@<MASTER_PUBLIC_IP>

# Make scripts executable
chmod +x deploy-to-k8s.sh seed-k8s-database.sh

# Deploy!
./deploy-to-k8s.sh

# This will:
# - Create namespace
# - Deploy PostgreSQL
# - Deploy all 9 microservices
# - Deploy API Gateway and Frontend
```

### Step 3: Monitor Deployment

```bash
# Watch pods starting up
kubectl get pods -n food-delivery -w

# Wait until all pods show Running status
# Press Ctrl+C to stop watching

# Check all resources
kubectl get all -n food-delivery

# Check pod logs if any issues
kubectl logs -f deployment/user-service -n food-delivery
```

### Step 4: Seed Database

```bash
# Wait for PostgreSQL to be fully ready
kubectl wait --for=condition=ready pod -l app=postgres -n food-delivery --timeout=300s

# Seed the database
./seed-k8s-database.sh

# This adds:
# - 10 restaurants
# - 50 menu items
# - 4 coupons
```

---

## Phase 6: Access Your Application (5 minutes)

### Step 1: Get Worker Node IPs

```bash
kubectl get nodes -o wide

# Note the EXTERNAL-IP of any worker node
```

### Step 2: Access the Application

Open your browser:

- **Frontend:** `http://<WORKER_PUBLIC_IP>:30000`
- **API:** `http://<WORKER_PUBLIC_IP>:30080/api/restaurants`

### Step 3: Test the Application

1. Click "Register" and create an account
2. Login with your credentials
3. Browse restaurants
4. Add items to cart
5. Use coupon: `WELCOME50`
6. Place an order
7. View your orders

---

## 🔍 Verification & Troubleshooting

### Check Cluster Health

```bash
# All nodes should be Ready
kubectl get nodes

# All pods should be Running
kubectl get pods -n food-delivery

# All services should have ClusterIP
kubectl get svc -n food-delivery
```

### Common Issues

#### 1. Pods in CrashLoopBackOff

```bash
# Check logs
kubectl logs <pod-name> -n food-delivery

# Describe pod for events
kubectl describe pod <pod-name> -n food-delivery

# Common causes:
# - Wrong image name (check Docker Hub username)
# - Database not ready (wait longer)
# - Environment variables missing
```

#### 2. ImagePullBackOff

```bash
# Check image name
kubectl describe pod <pod-name> -n food-delivery | grep Image

# Verify image exists on Docker Hub
docker pull <your-username>/food-delivery-user-service:v1.0

# If image is private, create ImagePullSecret:
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<your-username> \
  --docker-password=<your-password> \
  -n food-delivery
```

#### 3. Cannot Access Application

```bash
# Check NodePort service
kubectl get svc -n food-delivery

# Verify security group allows ports 30000-32767

# Test from master node
curl http://localhost:30080/health
```

#### 4. Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -n food-delivery -l app=postgres

# Check logs
kubectl logs -f statefulset/postgres -n food-delivery

# Test connection from another pod
kubectl exec -it deployment/user-service -n food-delivery -- \
  nc -zv postgres-service 5432
```

---

## 📊 Monitoring

### Install Metrics Server (Optional)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait a minute, then check
kubectl top nodes
kubectl top pods -n food-delivery
```

### Useful Commands

```bash
# Get all resources
kubectl get all -n food-delivery

# Watch pod status
kubectl get pods -n food-delivery -w

# View logs
kubectl logs -f deployment/<service-name> -n food-delivery

# Get pod details
kubectl describe pod <pod-name> -n food-delivery

# Execute command in pod
kubectl exec -it <pod-name> -n food-delivery -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/api-gateway 4000:4000 -n food-delivery

# Get events
kubectl get events -n food-delivery --sort-by='.lastTimestamp'
```

---

## 🔒 Security Best Practices

### 1. Change Default Passwords

```bash
# Edit secrets
kubectl edit secret app-secrets -n food-delivery

# Change:
# - DB_PASSWORD
# - JWT_SECRET
```

### 2. Use RBAC

```bash
# Create service account with limited permissions
kubectl create serviceaccount app-sa -n food-delivery
```

### 3. Enable Network Policies

```bash
# Create network policy to restrict pod-to-pod communication
# See k8s/network-policy.yaml (if you want to create this)
```

---

## 💰 Cost Optimization

### Stop Instances When Not in Use

```bash
# From AWS Console:
# EC2 → Instances → Select all 3 → Instance State → Stop

# To restart:
# Instance State → Start
# Then reconfigure kubectl on master
```

### Use Spot Instances for Workers

- Can save 70-90% on worker nodes
- Configure Auto Scaling Group with spot instances

### Resize to Smaller Instances

```bash
# For testing/dev, use t3.small instead of t3.medium
# Saves ~50% on costs
```

---

## 🚀 Next Steps

### 1. Add Load Balancer (Production)

```bash
# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/aws/deploy.yaml

# Get LoadBalancer URL
kubectl get svc -n ingress-nginx
```

### 2. Setup SSL/TLS

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Configure Let's Encrypt
```

### 3. Setup CI/CD

- GitHub Actions or GitLab CI
- Automate image building
- Auto-deploy on git push

### 4. Backup Database

```bash
# Create cronjob for database backups
kubectl create cronjob pg-backup --image=postgres:15-alpine \
  --schedule="0 2 * * *" \
  -n food-delivery -- \
  pg_dump -U postgres > /backup/backup.sql
```

---

## 📚 Additional Resources

- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [kubeadm Setup Guide](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/)
- [AWS EKS](https://aws.amazon.com/eks/) - Managed Kubernetes alternative
- [Kubernetes Patterns](https://kubernetes.io/docs/concepts/)

---

## ✅ Deployment Checklist

- [ ] 3 EC2 instances created (1 master, 2 workers)
- [ ] Security group configured
- [ ] SSH access working to all nodes
- [ ] Hostnames and /etc/hosts configured
- [ ] containerd installed on all nodes
- [ ] Kubernetes tools installed on all nodes
- [ ] Master node initialized
- [ ] Flannel CNI installed
- [ ] Worker nodes joined cluster
- [ ] All nodes showing Ready status
- [ ] Docker images built and pushed
- [ ] Kubernetes manifests updated with Docker Hub username
- [ ] Application deployed to Kubernetes
- [ ] All pods running successfully
- [ ] Database seeded with initial data
- [ ] Frontend accessible via browser
- [ ] End-to-end user flow tested
- [ ] Monitoring setup (optional)

---

## 🎉 Congratulations!

Your Food Delivery Application is now running on Kubernetes in AWS! 🚀

**Access Points:**
- Frontend: `http://<WORKER_IP>:30000`
- API: `http://<WORKER_IP>:30080/api`

**Test Coupons:**
- WELCOME50 (50% off, max $10)
- SAVE20 (20% off)
- FLAT10 ($10 flat)
- FEAST30 (30% off)

For support, check logs: `kubectl logs -f deployment/<service> -n food-delivery`
