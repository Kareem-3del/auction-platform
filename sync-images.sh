#!/bin/bash

# Script to sync images from Next.js public folder to nginx static directory
# This ensures production images are always up to date

echo "Syncing images from Next.js public folder to nginx directory..."

# Source and destination directories
SOURCE_DIR="/home/ubuntu/auction-platform/public/images"
DEST_DIR="/var/www/html/images"

# Create destination directory if it doesn't exist
sudo mkdir -p "$DEST_DIR"

# Sync all images
sudo rsync -av --delete "$SOURCE_DIR/" "$DEST_DIR/"

# Fix ownership
sudo chown -R www-data:www-data "$DEST_DIR"

# Fix permissions
sudo chmod -R 755 "$DEST_DIR"

echo "Image sync completed successfully!"
echo "Source: $SOURCE_DIR"
echo "Destination: $DEST_DIR"

# List synced files
echo -e "\nSynced files:"
sudo find "$DEST_DIR" -type f -name "*.jpg" -o -name "*.png" -o -name "*.svg" -o -name "*.webp" | head -20