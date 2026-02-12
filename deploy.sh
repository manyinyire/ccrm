#!/bin/bash
# ============================================================
# Church CRM - VPS Deployment Script (Standalone + PM2)
# ============================================================
# Run this script ON YOUR VPS after cloning the repo.
# Prerequisites: Node.js 20+, pnpm, PostgreSQL, PM2
# ============================================================

set -e

APP_DIR="/var/www/ccrm"
REPO_URL="https://github.com/manyinyire/ccrm.git"
BRANCH="main"

echo "=========================================="
echo "  Church CRM - VPS Deployment"
echo "=========================================="

# -----------------------------------------------------------
# 1. Install system dependencies (Ubuntu/Debian)
# -----------------------------------------------------------
install_deps() {
  echo "[1/8] Installing system dependencies..."
  sudo apt update
  sudo apt install -y curl git nginx certbot python3-certbot-nginx

  # Node.js 20 via NodeSource
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
  fi

  # pnpm
  if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
  fi

  # PM2
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
  fi

  echo "  Node: $(node -v) | pnpm: $(pnpm -v) | PM2: $(pm2 -v)"
}

# -----------------------------------------------------------
# 2. Setup PostgreSQL
# -----------------------------------------------------------
setup_db() {
  echo "[2/8] Setting up PostgreSQL..."
  if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
  fi

  # Create DB user and database (skip if exists)
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='ccrm_user'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER ccrm_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';"

  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='ccrm'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ccrm OWNER ccrm_user;"

  echo "  Database 'ccrm' ready."
  echo "  ⚠  IMPORTANT: Change the default password in .env!"
}

# -----------------------------------------------------------
# 3. Clone / pull repo
# -----------------------------------------------------------
setup_repo() {
  echo "[3/8] Setting up application..."
  if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git pull origin "$BRANCH"
  else
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
  fi
}

# -----------------------------------------------------------
# 4. Configure environment
# -----------------------------------------------------------
setup_env() {
  echo "[4/8] Configuring environment..."
  if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
    echo "  ⚠  Created .env from template - EDIT IT NOW with your real values!"
    echo "     nano $APP_DIR/.env"
    echo ""
    read -p "  Press Enter after editing .env to continue..."
  else
    echo "  .env already exists, skipping."
  fi
}

# -----------------------------------------------------------
# 5. Install dependencies & build
# -----------------------------------------------------------
build_app() {
  echo "[5/8] Installing dependencies & building..."
  cd "$APP_DIR"
  pnpm install --frozen-lockfile
  npx prisma generate
  npx prisma migrate deploy
  pnpm build

  # Copy static + public assets into standalone
  cp -r public .next/standalone/public
  cp -r .next/static .next/standalone/.next/static

  # Create logs directory
  mkdir -p logs

  echo "  Build complete."
}

# -----------------------------------------------------------
# 6. Seed database (first time only)
# -----------------------------------------------------------
seed_db() {
  cd "$APP_DIR"
  read -p "[6/8] Seed database with default admin user? (y/N): " seed_choice
  if [ "$seed_choice" = "y" ] || [ "$seed_choice" = "Y" ]; then
    npx tsx prisma/seed.ts
    node prisma/seed-permissions.js
    echo "  Seeded: admin@church.org / admin123"
  else
    echo "  Skipped seeding."
  fi
}

# -----------------------------------------------------------
# 7. Start with PM2
# -----------------------------------------------------------
start_pm2() {
  echo "[7/8] Starting application with PM2..."
  cd "$APP_DIR"

  # Stop existing instance if running
  pm2 delete ccrm 2>/dev/null || true

  # Start
  pm2 start ecosystem.config.js

  # Save PM2 process list and setup startup
  pm2 save
  pm2 startup 2>/dev/null || true

  echo "  App running on http://localhost:3000"
}

# -----------------------------------------------------------
# 8. Configure Nginx reverse proxy
# -----------------------------------------------------------
setup_nginx() {
  echo "[8/8] Configuring Nginx..."

  read -p "  Enter your domain (e.g. crm.yourchurch.org): " DOMAIN

  sudo tee /etc/nginx/sites-available/ccrm > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  sudo ln -sf /etc/nginx/sites-available/ccrm /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx

  echo ""
  read -p "  Setup SSL with Let's Encrypt? (y/N): " ssl_choice
  if [ "$ssl_choice" = "y" ] || [ "$ssl_choice" = "Y" ]; then
    sudo certbot --nginx -d "$DOMAIN"
    echo "  SSL configured!"
  fi

  echo ""
  echo "=========================================="
  echo "  Deployment complete!"
  echo "  URL: http://$DOMAIN"
  echo "  Login: admin@church.org / admin123"
  echo "  ⚠  Change the admin password immediately!"
  echo "=========================================="
}

# -----------------------------------------------------------
# Run all steps
# -----------------------------------------------------------
install_deps
setup_db
setup_repo
setup_env
build_app
seed_db
start_pm2
setup_nginx
