# Kubernetes Deployment Plan - Food Delivery App on AWS EC2

## 🎯 Overview

Deploy the 11-container food delivery application to Kubernetes using **kubeadm** on AWS EC2 instances.

---

## 📋 Architecture Plan

### Infrastructure Components:
```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────────────────────────┐ │
│  │  Control Plane  │  │        Worker Nodes              │ │
│  │   (Master)      │  │                                  │ │
│  │                 │  │  ┌──────────┐  ┌──────────┐     │ │
│  │  • API Server   │  │  │  Node 1  │  │  Node 2  │     │ │
│  │  • etcd         │  │  │          │  │          │     │ │
│  │  • Scheduler    │  │  │ Services │  │ Services │     │ │
│  │  • Controller   │  │  │   Pods   │  │   Pods   │     │ │
│  └─────────────────┘  │  └──────────┘  └──────────┘     │ │
│                        └──────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Application Load Balancer                   │ │
│  │         (Ingress Controller - nginx/ALB)                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ EC2 Instance Requirements

### Option 1: Minimal Setup (For Testing)
| Node Type | Count | Instance Type | vCPU | RAM | Storage | Purpose |
|-----------|-------|---------------|------|-----|---------|---------|
| Master | 1 | t3.medium | 2 | 4GB | 30GB | Control plane |
| Worker | 2 | t3.medium | 2 | 4GB | 30GB | Application pods |

**Monthly Cost:** ~$75-90 USD (with reserved instances)

### Option 2: Production-Ready
| Node Type | Count | Instance Type | vCPU | RAM | Storage | Purpose |
|-----------|-------|---------------|------|-----|---------|---------|
| Master | 1 | t3.large | 2 | 8GB | 50GB | Control plane |
| Worker | 3 | t3.large | 2 | 8GB | 50GB | Application pods |
| Database | 1 | t3.large | 2 | 8GB | 100GB | PostgreSQL (or use RDS) |

**Monthly Cost:** ~$200-250 USD (with reserved instances)

### Recommended: Option 1 to start, scale to Option 2 for production

---

## 📦 Application Components to Deploy

### Microservices (9):
1. user-service
2. restaurant-service
3. order-service
4. delivery-service
5. notification-service
6. payment-service
7. review-service
8. coupon-service
9. api-gateway

### Infrastructure:
10. PostgreSQL (StatefulSet)
11. Frontend (React app)

### Supporting Services:
- Ingress Controller (nginx)
- Persistent Volume Claims for database
- ConfigMaps for environment variables
- Secrets for sensitive data

---

## 🚀 Deployment Steps

### Phase 1: AWS Infrastructure Setup (30-45 minutes)

#### Step 1.1: Create EC2 Instances
```bash
# Launch instances with these specifications:
- AMI: Ubuntu 22.04 LTS
- Security Group: Allow ports 22, 80, 443, 6443, 2379-2380, 10250-10252, 30000-32767
- Key Pair: Create and download your SSH key
- VPC: Default or custom VPC with proper routing
```

**Security Group Rules:**
```
Inbound:
- SSH (22)         - Your IP
- HTTP (80)        - 0.0.0.0/0
- HTTPS (443)      - 0.0.0.0/0
- K8s API (6443)   - Within VPC
- etcd (2379-2380) - Within VPC
- Kubelet (10250)  - Within VPC
- NodePort (30000-32767) - 0.0.0.0/0
```

#### Step 1.2: Configure EC2 Instances
```bash
# On ALL nodes (master + workers)
sudo hostnamectl set-hostname master-node  # or worker-1, worker-2

# Update /etc/hosts on all nodes
sudo nano /etc/hosts
# Add:
<MASTER_PRIVATE_IP> master-node
<WORKER1_PRIVATE_IP> worker-1
<WORKER2_PRIVATE_IP> worker-2
```

---

### Phase 2: Install Container Runtime & Kubernetes (20-30 minutes)

#### Step 2.1: Install containerd on ALL nodes
```bash
# Run on ALL nodes (master + workers)
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sudo sysctl --system

# Install containerd
sudo apt update
sudo apt install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo systemctl enable containerd
```

#### Step 2.2: Install kubeadm, kubelet, kubectl on ALL nodes
```bash
# Run on ALL nodes
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Disable swap (required for k8s)
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab
```

---

### Phase 3: Initialize Kubernetes Cluster (15-20 minutes)

#### Step 3.1: Initialize Master Node
```bash
# Run ONLY on master node
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=<MASTER_PRIVATE_IP>

# Save the join command that appears! It looks like:
# kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>

# Setup kubectl for ubuntu user
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Verify
kubectl get nodes
# Should show master node in NotReady state (need CNI plugin)
```

#### Step 3.2: Install Pod Network (Flannel)
```bash
# Run on master node
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Wait for it to be ready
kubectl get pods -n kube-flannel

# Check node status
kubectl get nodes
# Should show master as Ready
```

#### Step 3.3: Join Worker Nodes
```bash
# Run on EACH worker node
# Use the join command from step 3.1
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>

# Verify on master node
kubectl get nodes
# Should show all nodes as Ready
```

---

### Phase 4: Prepare Docker Images (30 minutes)

#### Step 4.1: Create Docker Hub Account (if not exists)
- Sign up at https://hub.docker.com
- Create repository: `yourusername/food-delivery-app`

#### Step 4.2: Build and Push Images
```bash
# Run on your local machine (where docker-compose.yml is)
cd /home/atharva/Downloads/food-delivery-app

# Login to Docker Hub
docker login

# Build and push each service
services="user-service restaurant-service order-service delivery-service notification-service payment-service review-service coupon-service api-gateway frontend"

for service in $services; do
  echo "Building $service..."
  docker build -t yourusername/food-delivery-$service:v1.0 ./$service
  docker push yourusername/food-delivery-$service:v1.0
done

# Alternative: Use a script (I'll create this for you)
```

---

### Phase 5: Create Kubernetes Manifests (20 minutes)

I'll create these files in the `k8s/` directory:

#### Directory Structure:
```
k8s/
├── 01-namespace.yaml
├── 02-configmap.yaml
├── 03-secrets.yaml
├── 04-postgres-statefulset.yaml
├── 05-postgres-service.yaml
├── 06-user-service.yaml
├── 07-restaurant-service.yaml
├── 08-order-service.yaml
├── 09-delivery-service.yaml
├── 10-notification-service.yaml
├── 11-payment-service.yaml
├── 12-review-service.yaml
├── 13-coupon-service.yaml
├── 14-api-gateway.yaml
├── 15-frontend.yaml
├── 16-ingress.yaml
└── README.md
```

---

### Phase 6: Deploy to Kubernetes (15-20 minutes)

```bash
# Copy k8s manifests to master node
scp -i your-key.pem -r k8s/ ubuntu@<master-public-ip>:~/

# SSH to master node
ssh -i your-key.pem ubuntu@<master-public-ip>

# Deploy in order
kubectl apply -f k8s/01-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-secrets.yaml
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml

# Wait for postgres to be ready
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

# Deploy ingress
kubectl apply -f k8s/16-ingress.yaml

# Check deployment
kubectl get all -n food-delivery
```

---

### Phase 7: Configure Ingress & DNS (10-15 minutes)

#### Option A: Using NodePort (Simpler)
```bash
# Access via: http://<worker-node-public-ip>:30080
# Frontend will be exposed on NodePort 30080
```

#### Option B: Using AWS Application Load Balancer
```bash
# Install AWS Load Balancer Controller
# Follow: https://kubernetes-sigs.github.io/aws-load-balancer-controller/

# Update ingress.yaml to use ALB annotations
```

#### Option C: Using nginx Ingress with ELB
```bash
# Install nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/aws/deploy.yaml

# Get LoadBalancer URL
kubectl get svc -n ingress-nginx
# Use the EXTERNAL-IP (ELB URL) to access your app
```

---

### Phase 8: Seed Database (5 minutes)

```bash
# Get postgres pod name
POSTGRES_POD=$(kubectl get pod -n food-delivery -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Copy seed script
kubectl cp seed-docker-data.sh food-delivery/$POSTGRES_POD:/tmp/

# Execute seed script (modify for k8s environment)
kubectl exec -n food-delivery $POSTGRES_POD -- bash -c "
psql -U postgres -d restaurantdb -c \"INSERT INTO restaurants...\"
"

# Or use a Kubernetes Job for seeding
```

---

## 📊 Resource Allocation

### Recommended Resource Requests/Limits:

| Service | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|----------|-------------|-----------|----------------|--------------|
| user-service | 2 | 100m | 200m | 128Mi | 256Mi |
| restaurant-service | 2 | 100m | 200m | 128Mi | 256Mi |
| order-service | 2 | 100m | 200m | 128Mi | 256Mi |
| delivery-service | 1 | 100m | 200m | 128Mi | 256Mi |
| notification-service | 1 | 100m | 200m | 128Mi | 256Mi |
| payment-service | 2 | 100m | 200m | 128Mi | 256Mi |
| review-service | 1 | 100m | 200m | 128Mi | 256Mi |
| coupon-service | 1 | 100m | 200m | 128Mi | 256Mi |
| api-gateway | 2 | 100m | 300m | 128Mi | 256Mi |
| frontend | 2 | 100m | 200m | 128Mi | 256Mi |
| postgres | 1 | 500m | 1000m | 512Mi | 1Gi |

**Total:** ~2 vCPU, 3-4GB RAM minimum (fits in 2x t3.medium workers)

---

## 🔒 Security Considerations

### 1. Secrets Management
```bash
# Create secrets for sensitive data
kubectl create secret generic db-credentials \
  --from-literal=username=postgres \
  --from-literal=password=<strong-password> \
  -n food-delivery

kubectl create secret generic jwt-secret \
  --from-literal=secret=<jwt-secret-key> \
  -n food-delivery
```

### 2. Network Policies
- Restrict pod-to-pod communication
- Only allow necessary ingress/egress

### 3. RBAC
- Create service accounts with minimal permissions
- Use Role-Based Access Control

### 4. TLS/SSL
- Use cert-manager for automatic certificate management
- Configure HTTPS for ingress

---

## 🔍 Monitoring & Logging

### Install Prometheus & Grafana
```bash
# Add helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### Access Grafana
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Access: http://localhost:3000
# Username: admin
# Password: prom-operator
```

---

## 💰 Cost Estimation

### Monthly Costs (us-east-1 region):
| Component | Type | Monthly Cost |
|-----------|------|--------------|
| 1x t3.medium (master) | On-Demand | ~$30 |
| 2x t3.medium (workers) | On-Demand | ~$60 |
| 50GB EBS volumes (3x) | gp3 | ~$15 |
| Data transfer (5GB) | Outbound | ~$5 |
| **Total (Minimal)** | | **~$110** |

**Cost Optimization:**
- Use Reserved Instances: Save 40-60%
- Use Spot Instances for workers: Save 70-90%
- Shut down non-prod during off-hours

---

## 🚦 Post-Deployment Checklist

- [ ] All pods are running (`kubectl get pods -n food-delivery`)
- [ ] Services are accessible (`kubectl get svc -n food-delivery`)
- [ ] Database is seeded with test data
- [ ] Ingress is configured and accessible
- [ ] Health checks pass for all services
- [ ] Test end-to-end user flow
- [ ] Setup monitoring dashboards
- [ ] Configure alerts
- [ ] Setup backup for PostgreSQL
- [ ] Document access URLs
- [ ] Setup CI/CD pipeline (optional)

---

## 🔄 CI/CD Integration (Optional - Phase 9)

### Using GitHub Actions:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push images
      - name: Deploy to k8s
```

---

## 📚 Next Steps

1. **Review this plan** - Understand each phase
2. **Create AWS account** - If you don't have one
3. **I'll create all Kubernetes manifests** - Ready-to-use YAML files
4. **I'll create deployment scripts** - Automate the process
5. **Follow step-by-step guide** - I'll create detailed instructions

---

## ⚠️ Important Notes

1. **Costs**: Running 3 EC2 instances 24/7 costs ~$110/month
2. **Alternative**: Use EKS (managed Kubernetes) but costs more (~$145/month minimum)
3. **Database**: Consider using AWS RDS for PostgreSQL in production
4. **Storage**: Use AWS EBS for persistent volumes
5. **Backups**: Setup automated backups for database
6. **Scaling**: Configure Horizontal Pod Autoscaler (HPA)

---

## 🤔 Decision Time

Before I create all the Kubernetes manifests and scripts, please confirm:

1. **Instance choice**: Minimal (2 workers) or Production-ready (3 workers)?
2. **Database**: PostgreSQL in K8s or AWS RDS?
3. **Ingress**: NodePort (simple) or Load Balancer (production)?
4. **Docker registry**: Docker Hub or AWS ECR?
5. **Domain**: Do you have a domain name for DNS?

**Reply with your preferences, and I'll generate all the files!** 🚀
