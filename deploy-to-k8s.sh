#!/bin/bash

# Script to deploy the food delivery app to Kubernetes
# Run this on your Kubernetes master node after copying k8s/ directory

set -e

echo "=========================================="
echo "Deploying Food Delivery App to Kubernetes"
echo "=========================================="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
  echo "Error: kubectl is not installed"
  exit 1
fi

# Check if k8s directory exists
if [ ! -d "k8s" ]; then
  echo "Error: k8s directory not found"
  echo "Please copy the k8s directory to this location first"
  exit 1
fi

# Deploy in order
echo "Step 1: Creating namespace..."
kubectl apply -f k8s/01-namespace.yaml

echo ""
echo "Step 2: Creating ConfigMap..."
kubectl apply -f k8s/02-configmap.yaml

echo ""
echo "Step 3: Creating Secrets..."
kubectl apply -f k8s/03-secrets.yaml

echo ""
echo "Step 4: Deploying PostgreSQL..."
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml

echo ""
echo "Waiting for PostgreSQL to be ready (this may take 1-2 minutes)..."
kubectl wait --for=condition=ready pod -l app=postgres -n food-delivery --timeout=300s || {
  echo "Warning: PostgreSQL pod not ready yet. Check with: kubectl get pods -n food-delivery"
}

echo ""
echo "Step 5: Deploying microservices..."
kubectl apply -f k8s/06-user-service.yaml
kubectl apply -f k8s/07-restaurant-service.yaml
kubectl apply -f k8s/08-order-service.yaml
kubectl apply -f k8s/09-delivery-service.yaml
kubectl apply -f k8s/10-notification-service.yaml
kubectl apply -f k8s/11-payment-service.yaml
kubectl apply -f k8s/12-review-service.yaml
kubectl apply -f k8s/13-coupon-service.yaml

echo ""
echo "Step 6: Deploying API Gateway..."
kubectl apply -f k8s/14-api-gateway.yaml

echo ""
echo "Step 7: Deploying Frontend..."
kubectl apply -f k8s/15-frontend.yaml

echo ""
echo "Step 8: Creating Ingress (optional)..."
kubectl apply -f k8s/16-ingress.yaml

echo ""
echo "=========================================="
echo "Deployment initiated!"
echo "=========================================="
echo ""
echo "Checking deployment status..."
echo ""

# Wait a bit for pods to start
sleep 10

# Show pod status
kubectl get pods -n food-delivery

echo ""
echo "=========================================="
echo "Access your application:"
echo "=========================================="
echo ""
echo "Frontend:     http://<worker-node-ip>:30000"
echo "API Gateway:  http://<worker-node-ip>:30080"
echo ""
echo "To get worker node IP:"
echo "  kubectl get nodes -o wide"
echo ""
echo "To check deployment status:"
echo "  kubectl get all -n food-delivery"
echo ""
echo "To check logs:"
echo "  kubectl logs -f deployment/<service-name> -n food-delivery"
echo ""
echo "To seed database, run:"
echo "  ./seed-k8s-database.sh"
echo ""
