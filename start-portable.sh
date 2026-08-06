#!/bin/bash

# ==================================================
# Z-EXAM PORTABLE SERVER STARTUP
# ANDI MARIONO (2026)
# ==================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}       Z-EXAM PORTABLE SERVER STARTUP             ${NC}"
echo -e "${BLUE}            ANDI MARIONO (2026)                   ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup paths for portable environment
PHP_DIR="$SCRIPT_DIR/php-portable"
PHP_BIN="$PHP_DIR/bin/php"

PG_DIR="$SCRIPT_DIR/postgresql-portable"
PG_BIN="$PG_DIR/bin"
PG_DATA="$PG_DIR/data"

# Add portable binaries to PATH
export PATH="$PHP_BIN:$PG_BIN:$PATH"

# Check if portable PHP exists
if [ ! -f "$PHP_BIN" ]; then
    print_error "Portable PHP not found at $PHP_BIN"
    print_error "Please run ./setup-portable.sh first"
    exit 1
fi

# Check if portable PostgreSQL exists
if [ ! -f "$PG_BIN/pg_ctl" ]; then
    print_error "Portable PostgreSQL not found at $PG_BIN"
    print_error "Please run ./setup-portable.sh first"
    exit 1
fi

# 1. Detect Local IP Address
print_status "Detecting IP Address..."
IP_ADDR=$(hostname -I | awk '{print $1}')

if [ -z "$IP_ADDR" ]; then
    print_warning "No active network IP detected. Using localhost."
    IP_ADDR="127.0.0.1"
else
    print_success "IP Address found: $IP_ADDR"
fi

# 2. Ensure Storage Symbolic Link is Active
if [ ! -L "public/storage" ] && [ ! -d "public/storage" ]; then
    print_status "Storage symlink missing. Creating new symlink..."
    "$PHP_BIN" artisan storage:link
else
    print_success "Storage symlink active."
fi

echo ""

# 3. Start PostgreSQL
print_status "Starting PostgreSQL..."
if "$PG_BIN/pg_ctl" -D "$PG_DATA" status >/dev/null 2>&1; then
    print_success "PostgreSQL is already running"
else
    "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_DIR/postgresql.log" start
    sleep 3
    print_success "PostgreSQL started"
fi

# 4. Run Laravel Optimizations (if not already cached)
print_status "Checking Laravel optimizations..."
if [ ! -f "bootstrap/cache/config.php" ]; then
    print_status "Optimizing Laravel for production..."
    "$PHP_BIN" artisan config:cache
    "$PHP_BIN" artisan route:cache
    "$PHP_BIN" artisan view:cache
    "$PHP_BIN" artisan event:cache
    print_success "Laravel optimized"
else
    print_success "Laravel already optimized"
fi

echo ""
echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}             SERVER SIAP DIGUNAKAN!               ${NC}"
echo -e "${BLUE} -------------------------------------------------${NC}"
echo -e "${BLUE}  👉 Ujian Siswa  : http://$IP_ADDR:8000${NC}"
echo -e "${BLUE}  👉 Proktor/Admin: http://$IP_ADDR:8000/login    ${NC}"
echo -e "${BLUE}            Created by : Andi Mariono             ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "${GREEN}Sukses selalu${NC}"
echo ""

# 5. Start Laravel Octane with 4 Workers
print_status "Starting Laravel Octane with 4 workers..."
exec "$PHP_BIN" artisan octane:start --workers=4 --host=$IP_ADDR --port=8000