#!/bin/bash

# Script to build and push all Docker images to Docker Hub
# Usage: ./build-and-push-images.sh <your-dockerhub-username>

set -e

if [ -z "$1" ]; then
  echo "Error: Docker Hub username required"
  echo "Usage: ./build-and-push-images.sh <your-dockerhub-username>"
  exit 1
fi

DOCKER_USERNAME=$1
VERSION=${2:-v1.0}

echo "=========================================="
echo "Building and Pushing Docker Images"
echo "Docker Hub User: $DOCKER_USERNAME"
echo "Version: $VERSION"
echo "=========================================="
echo ""

# Login to Docker Hub
echo "Logging in to Docker Hub..."
docker login

# Array of services to build
services=(
  "user-service"
  "restaurant-service"
  "order-service"
  "delivery-service"
  "notification-service"
  "payment-service"
  "review-service"
  "coupon-service"
  "api-gateway"
)

# Build and push each service
for service in "${services[@]}"; do
  echo ""
  echo "=========================================="
  echo "Building $service..."
  echo "=========================================="
  
  IMAGE_NAME="$DOCKER_USERNAME/food-delivery-$service:$VERSION"
  
  if [ -f "./$service/Dockerfile" ]; then
    docker build -t "$IMAGE_NAME" "./$service"
    docker tag "$IMAGE_NAME" "$DOCKER_USERNAME/food-delivery-$service:latest"
    
    echo "Pushing $IMAGE_NAME..."
    docker push "$IMAGE_NAME"
    docker push "$DOCKER_USERNAME/food-delivery-$service:latest"
    
    echo "✓ $service complete"
  else
    echo "⚠ Warning: Dockerfile not found for $service"
  fi
done

# Build and push frontend
echo ""
echo "=========================================="
echo "Building frontend..."
echo "=========================================="

IMAGE_NAME="$DOCKER_USERNAME/food-delivery-frontend:$VERSION"

if [ -f "./frontend/Dockerfile" ]; then
  docker build -t "$IMAGE_NAME" "./frontend"
  docker tag "$IMAGE_NAME" "$DOCKER_USERNAME/food-delivery-frontend:latest"
  
  echo "Pushing $IMAGE_NAME..."
  docker push "$IMAGE_NAME"
  docker push "$DOCKER_USERNAME/food-delivery-frontend:latest"
  
  echo "✓ frontend complete"
else
  echo "⚠ Warning: Dockerfile not found for frontend"
fi

echo ""
echo "=========================================="
echo "✓ All images built and pushed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update k8s YAML files with your Docker Hub username"
echo "2. Run: ./update-k8s-images.sh $DOCKER_USERNAME"
echo ""
