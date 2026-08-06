#!/bin/bash

# ==================================================
# Z-EXAM PORTABLE SERVER SETUP
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
echo -e "${BLUE}       Z-EXAM PORTABLE SERVER SETUP               ${NC}"
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

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$ID
            VER=$VERSION_ID
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    print_status "Detected OS: $OS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Setup portable PHP
setup_php() {
    print_status "Setting up PHP..."
    
    PHP_DIR="$SCRIPT_DIR/php-portable"
    PHP_BIN="$PHP_DIR/bin/php"
    
    if [ -f "$PHP_BIN" ]; then
        print_success "PHP already installed at $PHP_DIR"
        export PATH="$PHP_DIR/bin:$PATH"
        return 0
    fi
    
    print_status "Downloading portable PHP..."
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        # Install PHP and extensions via apt
        print_status "Installing PHP via apt..."
        sudo apt-get update
        sudo apt-get install -y php8.2 php8.2-cli php8.2-pgsql php8.2-sqlite3 php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-gd php8.2-bcmath php8.2-intl php8.2-redis php8.2-pcntl php8.2-opcache
        
        # Create symlink for portable usage
        mkdir -p "$PHP_DIR/bin"
        ln -sf $(which php) "$PHP_DIR/bin/php"
        ln -sf $(which phpize) "$PHP_DIR/bin/phpize" 2>/dev/null || true
        ln -sf $(which php-config) "$PHP_DIR/bin/php-config" 2>/dev/null || true
        
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install php@8.2
            mkdir -p "$PHP_DIR/bin"
            ln -sf $(which php) "$PHP_DIR/bin/php"
        else
            print_error "Homebrew not found. Please install PHP 8.2+ manually."
            exit 1
        fi
    else
        print_warning "Unsupported OS for automatic PHP installation. Please install PHP 8.2+ with extensions: pdo_pgsql, pdo_sqlite, mbstring, xml, curl, zip, gd, bcmath, intl, redis, pcntl, opcache"
        print_warning "Then create symlink at $PHP_DIR/bin/php"
        read -p "Press Enter after installing PHP manually..."
    fi
    
    export PATH="$PHP_DIR/bin:$PATH"
    print_success "PHP setup complete"
}

# Setup portable PostgreSQL
setup_postgresql() {
    print_status "Setting up PostgreSQL..."
    
    PG_DIR="$SCRIPT_DIR/postgresql-portable"
    PG_DATA="$PG_DIR/data"
    PG_BIN="$PG_DIR/bin"
    
    if [ -f "$PG_BIN/postgres" ]; then
        print_success "PostgreSQL already installed at $PG_DIR"
        export PATH="$PG_BIN:$PATH"
        return 0
    fi
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        print_status "Installing PostgreSQL via apt..."
        sudo apt-get install -y postgresql-16 postgresql-client-16
        
        # Create portable symlinks
        mkdir -p "$PG_BIN"
        ln -sf $(which postgres) "$PG_BIN/postgres" 2>/dev/null || true
        ln -sf $(which psql) "$PG_BIN/psql" 2>/dev/null || true
        ln -sf $(which pg_ctl) "$PG_BIN/pg_ctl" 2>/dev/null || true
        ln -sf $(which initdb) "$PG_BIN/initdb" 2>/dev/null || true
        ln -sf $(which createdb) "$PG_BIN/createdb" 2>/dev/null || true
        ln -sf $(which dropdb) "$PG_BIN/dropdb" 2>/dev/null || true
        
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install postgresql@16
            mkdir -p "$PG_BIN"
            ln -sf $(which postgres) "$PG_BIN/postgres" 2>/dev/null || true
            ln -sf $(which psql) "$PG_BIN/psql" 2>/dev/null || true
            ln -sf $(which pg_ctl) "$PG_BIN/pg_ctl" 2>/dev/null || true
            ln -sf $(which initdb) "$PG_BIN/initdb" 2>/dev/null || true
        else
            print_error "Homebrew not found. Please install PostgreSQL 16+ manually."
            exit 1
        fi
    else
        print_warning "Unsupported OS for automatic PostgreSQL installation."
        print_warning "Please install PostgreSQL 16+ manually and create symlinks at $PG_BIN"
        read -p "Press Enter after installing PostgreSQL manually..."
    fi
    
    # Initialize database cluster if not exists
    if [ ! -d "$PG_DATA" ]; then
        print_status "Initializing PostgreSQL data directory..."
        mkdir -p "$PG_DATA"
        "$PG_BIN/initdb" -D "$PG_DATA" --auth=trust
    fi
    
    export PATH="$PG_BIN:$PATH"
    print_success "PostgreSQL setup complete"
}

# Start PostgreSQL
start_postgresql() {
    print_status "Starting PostgreSQL..."
    
    PG_DIR="$SCRIPT_DIR/postgresql-portable"
    PG_DATA="$PG_DIR/data"
    PG_LOG="$PG_DIR/postgresql.log"
    PG_BIN="$PG_DIR/bin"
    
    export PATH="$PG_BIN:$PATH"
    
    # Check if already running
    if "$PG_BIN/pg_ctl" -D "$PG_DATA" status >/dev/null 2>&1; then
        print_success "PostgreSQL is already running"
        return 0
    fi
    
    # Start PostgreSQL
    "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" start
    
    # Wait for PostgreSQL to be ready
    sleep 3
    
    # Create database and user if not exists
    print_status "Setting up database..."
    "$PG_BIN/psql" -h localhost -p 5432 -U postgres -c "CREATE DATABASE z_exam;" 2>/dev/null || true
    "$PG_BIN/psql" -h localhost -p 5432 -U postgres -c "CREATE USER z_exam WITH PASSWORD 'z_exam_password';" 2>/dev/null || true
    "$PG_BIN/psql" -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE z_exam TO z_exam;" 2>/dev/null || true
    "$PG_BIN/psql" -h localhost -p 5432 -U postgres -c "ALTER USER z_exam CREATEDB;" 2>/dev/null || true
    
    print_success "PostgreSQL started and database configured"
}

# Stop PostgreSQL
stop_postgresql() {
    print_status "Stopping PostgreSQL..."
    
    PG_DIR="$SCRIPT_DIR/postgresql-portable"
    PG_DATA="$PG_DIR/data"
    PG_BIN="$PG_DIR/bin"
    
    if [ -f "$PG_BIN/pg_ctl" ]; then
        "$PG_BIN/pg_ctl" -D "$PG_DATA" stop -m fast 2>/dev/null || true
    fi
}

# Setup Node.js
setup_nodejs() {
    print_status "Setting up Node.js..."
    
    if command_exists node && command_exists npm; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js $(node --version) already installed"
            return 0
        fi
    fi
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        print_status "Installing Node.js via NodeSource..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install node@20
        else
            print_error "Homebrew not found. Please install Node.js 20+ manually."
            exit 1
        fi
    else
        print_warning "Please install Node.js 20+ manually"
        read -p "Press Enter after installing Node.js..."
    fi
    
    print_success "Node.js $(node --version) ready"
}

# Setup Composer
setup_composer() {
    print_status "Setting up Composer..."
    
    if command_exists composer; then
        print_success "Composer already installed"
        return 0
    fi
    
    if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
        sudo apt-get install -y composer
    elif [[ "$OS" == "macos" ]]; then
        if command_exists brew; then
            brew install composer
        else
            print_error "Homebrew not found. Please install Composer manually."
            exit 1
        fi
    else
        print_status "Downloading Composer..."
        php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
        php composer-setup.php --install-dir=/usr/local/bin --filename=composer
        php -r "unlink('composer-setup.php');"
    fi
    
    print_success "Composer ready"
}

# Install PHP dependencies
install_php_deps() {
    print_status "Installing PHP dependencies..."
    
    if [ ! -f "composer.lock" ] || [ ! -d "vendor" ]; then
        composer install --optimize-autoloader --no-dev
    else
        composer install --optimize-autoloader --no-dev
    fi
    
    print_success "PHP dependencies installed"
}

# Install Node.js dependencies and build assets
build_assets() {
    print_status "Installing Node.js dependencies and building assets..."
    
    if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    npm run build
    
    print_success "Assets built successfully"
}

# Setup Laravel application
setup_laravel() {
    print_status "Setting up Laravel application..."
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_status "Created .env from .env.example"
    fi
    
    # Generate app key
    php artisan key:generate --force
    
    # Create storage link
    php artisan storage:link 2>/dev/null || true
    
    # Run migrations
    print_status "Running database migrations..."
    php artisan migrate --force
    
    # Run seeders if needed
    # php artisan db:seed --force
    
    # Optimize for production
    print_status "Optimizing Laravel for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
    
    print_success "Laravel setup complete"
}

# Create .env for PostgreSQL
create_postgres_env() {
    print_status "Creating PostgreSQL configuration..."
    
    cat > .env.postgres << 'EOF'
APP_NAME=Z-EXAM
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost:8000

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=z_exam
DB_USERNAME=z_exam
DB_PASSWORD=z_exam_password

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="${APP_NAME}"
EOF
    
    print_success "PostgreSQL .env configuration created"
}

# Main setup function
main_setup() {
    detect_os
    
    print_status "Starting portable setup..."
    
    setup_php
    setup_nodejs
    setup_composer
    setup_postgresql
    start_postgresql
    create_postgres_env
    
    # Copy postgres env to .env
    cp .env.postgres .env
    
    install_php_deps
    build_assets
    setup_laravel
    
    print_success "=================================================="
    print_success "       PORTABLE SETUP COMPLETE!                   "
    print_success "=================================================="
    print_status "To start the server, run: ./start-portable.sh"
    print_status "To stop PostgreSQL, run: ./stop-portable.sh"
}

# Run main setup if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_setup
fi