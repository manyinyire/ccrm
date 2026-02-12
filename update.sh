#!/bin/bash
# ============================================================
# Church CRM - Quick Update Script
# Run this on VPS to pull latest changes and redeploy
# ============================================================

set -e

APP_DIR="/var/www/ccrm"
cd "$APP_DIR"

echo "Pulling latest changes..."
git pull origin main

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Running migrations..."
npx prisma generate
npx prisma migrate deploy

echo "Building..."
pnpm build

echo "Copying static assets..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "Restarting PM2..."
pm2 restart ccrm

echo "Done! App restarted."
