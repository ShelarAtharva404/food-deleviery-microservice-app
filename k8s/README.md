# Kubernetes Manifests - Food Delivery App

This directory contains all Kubernetes YAML manifests to deploy the food delivery application.

## 📁 Files Overview

| File | Description |
|------|-------------|
| `01-namespace.yaml` | Creates `food-delivery` namespace |
| `02-configmap.yaml` | Environment variables and service URLs |
| `03-secrets.yaml` | Database passwords, JWT secret |
| `04-postgres-statefulset.yaml` | PostgreSQL database with persistent storage |
| `05-postgres-service.yaml` | PostgreSQL ClusterIP service |
| `06-user-service.yaml` | User authentication service |
| `07-restaurant-service.yaml` | Restaurant and menu management |
| `08-order-service.yaml` | Order processing service |
| `09-delivery-service.yaml` | Delivery tracking service |
| `10-notification-service.yaml` | Event notification service |
| `11-payment-service.yaml` | Payment processing service |
| `12-review-service.yaml` | Restaurant review service |
| `13-coupon-service.yaml` | Coupon validation service |
| `14-api-gateway.yaml` | API Gateway with NodePort (30080) |
| `15-frontend.yaml` | React frontend with NodePort (30000) |
| `16-ingress.yaml` | Ingress configuration (optional) |

## 🚀 Quick Deploy

```bash
# Deploy all manifests
kubectl apply -f 01-namespace.yaml
kubectl apply -f 02-configmap.yaml
kubectl apply -f 03-secrets.yaml
kubectl apply -f 04-postgres-statefulset.yaml
kubectl apply -f 05-postgres-service.yaml

# Wait for PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres -n food-delivery --timeout=300s

# Deploy services
kubectl apply -f 06-user-service.yaml
kubectl apply -f 07-restaurant-service.yaml
kubectl apply -f 08-order-service.yaml
kubectl apply -f 09-delivery-service.yaml
kubectl apply -f 10-notification-service.yaml
kubectl apply -f 11-payment-service.yaml
kubectl apply -f 12-review-service.yaml
kubectl apply -f 13-coupon-service.yaml
kubectl apply -f 14-api-gateway.yaml
kubectl apply -f 15-frontend.yaml

# Optional: Ingress
kubectl apply -f 16-ingress.yaml
```

Or use the deployment script:

```bash
../deploy-to-k8s.sh
```

## 🔧 Configuration

### Before Deploying

1. **Update Docker Hub username** in all service YAML files:
   ```bash
   # From project root
   ./update-k8s-images.sh <your-dockerhub-username>
   ```

2. **Change secrets** (IMPORTANT for production):
   Edit `03-secrets.yaml`:
   - Change `DB_PASSWORD`
   - Change `JWT_SECRET` (minimum 32 characters)

3. **Review resource limits**:
   Each service has CPU and memory limits. Adjust if needed based on your cluster size.

### Storage Class

The PostgreSQL StatefulSet uses `storageClassName: gp2` (AWS EBS).

For other cloud providers, change to:
- GCP: `pd-standard`
- Azure: `managed-premium`
- Local: `standard` or `hostpath`

## 📊 Resource Requirements

**Minimum cluster requirements:**

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| Total Services | 1.5 cores | 3 cores | 2 GB | 4 GB |
| PostgreSQL | 0.5 cores | 1 core | 512 MB | 1 GB |
| **Total** | **2 cores** | **4 cores** | **2.5 GB** | **5 GB** |

**Recommended:** 2 worker nodes with t3.medium (2 vCPU, 4GB RAM each)

## 🔐 Secrets Management

Default credentials (CHANGE IN PRODUCTION):

```yaml
Database:
  User: postgres
  Password: postgres

JWT:
  Secret: your-super-secret-jwt-key-change-in-production-min-32-chars
```

To update secrets:

```bash
# Edit secrets
kubectl edit secret app-secrets -n food-delivery

# Or delete and recreate
kubectl delete secret app-secrets -n food-delivery
kubectl apply -f 03-secrets.yaml
```

## 🌐 Service Endpoints

### Internal (ClusterIP)

Services communicate within the cluster:

```
user-service:4001
restaurant-service:4002
order-service:4003
delivery-service:4004
notification-service:4006
payment-service:4007
review-service:4008
coupon-service:4009
postgres-service:5432
```

### External (NodePort)

Access from outside the cluster:

```
Frontend:     http://<NODE_IP>:30000
API Gateway:  http://<NODE_IP>:30080
```

Get node IP:
```bash
kubectl get nodes -o wide
```

## 🔍 Verification

Check deployment status:

```bash
# All resources
kubectl get all -n food-delivery

# Pods only
kubectl get pods -n food-delivery

# Services
kubectl get svc -n food-delivery

# Persistent volumes
kubectl get pvc -n food-delivery
```

Check logs:

```bash
# Specific service
kubectl logs -f deployment/user-service -n food-delivery

# PostgreSQL
kubectl logs -f statefulset/postgres -n food-delivery

# All pods with label
kubectl logs -l app=user-service -n food-delivery
```

## 🐛 Troubleshooting

### Pods not starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n food-delivery

# Check events
kubectl get events -n food-delivery --sort-by='.lastTimestamp'
```

### Image pull errors

```bash
# Check image name
kubectl get pod <pod-name> -n food-delivery -o yaml | grep image:

# Verify on Docker Hub
# Make sure image exists and is public
```

### Database connection errors

```bash
# Check if PostgreSQL is running
kubectl get pods -n food-delivery -l app=postgres

# Test connection from a service pod
kubectl exec -it deployment/user-service -n food-delivery -- \
  nc -zv postgres-service 5432
```

### Service not accessible

```bash
# Check service endpoints
kubectl get endpoints -n food-delivery

# Check NodePort
kubectl get svc -n food-delivery | grep NodePort

# Verify security group allows NodePort range (30000-32767)
```

## 📈 Scaling

Scale any service:

```bash
# Scale user service to 3 replicas
kubectl scale deployment user-service --replicas=3 -n food-delivery

# Auto-scale based on CPU
kubectl autoscale deployment user-service \
  --cpu-percent=70 \
  --min=2 --max=5 \
  -n food-delivery
```

## 🔄 Updates

Update to new version:

```bash
# Update image
kubectl set image deployment/user-service \
  user-service=yourusername/food-delivery-user-service:v1.1 \
  -n food-delivery

# Check rollout status
kubectl rollout status deployment/user-service -n food-delivery

# Rollback if needed
kubectl rollout undo deployment/user-service -n food-delivery
```

## 🗑️ Cleanup

Remove everything:

```bash
# Delete namespace (removes all resources)
kubectl delete namespace food-delivery

# Or delete individually
kubectl delete -f 15-frontend.yaml
kubectl delete -f 14-api-gateway.yaml
# ... etc
```

## 📝 Notes

- **Namespace isolation**: All resources are in `food-delivery` namespace
- **Persistent data**: PostgreSQL data persists across pod restarts
- **Health checks**: All services have liveness and readiness probes
- **Resource limits**: Set to prevent resource starvation
- **Security**: Uses ClusterIP for internal services, NodePort for external access

## 🎯 Next Steps

1. **Setup monitoring**: Install Prometheus + Grafana
2. **Enable logging**: Deploy ELK stack or Loki
3. **Add ingress**: Install nginx-ingress for domain-based routing
4. **Enable TLS**: Use cert-manager for SSL certificates
5. **Setup backups**: Create CronJob for database backups
6. **CI/CD**: Automate deployments with GitHub Actions

## 📚 References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
