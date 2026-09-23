#!/bin/bash

# Script to update Kubernetes YAML files with your Docker Hub username
# Usage: ./update-k8s-images.sh <your-dockerhub-username>

set -e

if [ -z "$1" ]; then
  echo "Error: Docker Hub username required"
  echo "Usage: ./update-k8s-images.sh <your-dockerhub-username>"
  exit 1
fi

DOCKER_USERNAME=$1

echo "Updating Kubernetes manifests with Docker Hub username: $DOCKER_USERNAME"
echo ""

# Update all YAML files in k8s directory
for file in k8s/*.yaml; do
  if [ -f "$file" ]; then
    sed -i "s|yourusername/food-delivery|$DOCKER_USERNAME/food-delivery|g" "$file"
    echo "✓ Updated $file"
  fi
done

echo ""
echo "✓ All Kubernetes manifests updated!"
echo ""
echo "Your images will be pulled from:"
echo "  $DOCKER_USERNAME/food-delivery-*:v1.0"
echo ""
