#!/bin/bash

# ==================================================
# Z-EXAM PORTABLE SERVER STOPPER
# ANDI MARIONO (2026)
# ==================================================

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
echo -e "${BLUE}       Z-EXAM PORTABLE SERVER STOPPER             ${NC}"
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

# Setup paths for portable PostgreSQL
PG_DIR="$SCRIPT_DIR/postgresql-portable"
PG_BIN="$PG_DIR/bin"
PG_DATA="$PG_DIR/data"

# Add portable binaries to PATH
export PATH="$PG_BIN:$PATH"

# 1. Stop Laravel Octane (find and kill the process)
print_status "Stopping Laravel Octane..."
OCTANE_PIDS=$(pgrep -f "octane:start" 2>/dev/null || true)
if [ -n "$OCTANE_PIDS" ]; then
    echo "$OCTANE_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 2
    # Force kill if still running
    OCTANE_PIDS=$(pgrep -f "octane:start" 2>/dev/null || true)
    if [ -n "$OCTANE_PIDS" ]; then
        echo "$OCTANE_PIDS" | xargs kill -KILL 2>/dev/null || true
    fi
    print_success "Laravel Octane stopped"
else
    print_warning "Laravel Octane not running"
fi

# 2. Stop PostgreSQL
print_status "Stopping PostgreSQL..."
if [ -f "$PG_BIN/pg_ctl" ] && [ -d "$PG_DATA" ]; then
    if "$PG_BIN/pg_ctl" -D "$PG_DATA" status >/dev/null 2>&1; then
        "$PG_BIN/pg_ctl" -D "$PG_DATA" stop -m fast
        print_success "PostgreSQL stopped"
    else
        print_warning "PostgreSQL not running"
    fi
else
    print_warning "PostgreSQL not found or not initialized"
fi

echo ""
print_success "All services stopped successfully"
echo -e "${BLUE}==================================================${NC}"