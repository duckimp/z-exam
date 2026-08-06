# Z-EXAM Portable Setup Guide

## Overview
This guide explains how to set up and run Z-EXAM on a new laptop without installing XAMPP or any system-wide services. Everything runs from the project folder using portable PHP and PostgreSQL.

## Prerequisites

### Linux/macOS
- Ubuntu/Debian Linux or macOS
- Internet connection (for initial setup)
- sudo access (for installing system packages during setup)

### Windows
- Windows 10/11 (64-bit)
- Internet connection (for initial setup)
- **Run as Administrator** (required for installing services)

## Quick Start

### Linux/macOS

#### 1. Initial Setup (Run Once)
```bash
# Make scripts executable
chmod +x setup-portable.sh start-portable.sh stop-portable.sh

# Run the setup script (installs PHP, PostgreSQL, Node.js, Composer, builds assets)
./setup-portable.sh
```

This will:
- Install PHP 8.2+ with required extensions (pdo_pgsql, mbstring, xml, curl, zip, gd, bcmath, intl, redis, pcntl, opcache)
- Install PostgreSQL 16+ with a local data directory
- Install Node.js 20+ and npm
- Install Composer
- Create database and user
- Install PHP dependencies (vendor/)
- Build frontend assets (public/build/)
- Run Laravel migrations and optimizations

#### 2. Start the Server
```bash
./start-portable.sh
```

This will:
- Detect your IP address
- Start PostgreSQL
- Verify storage link
- Optimize Laravel (if needed)
- Start Laravel Octane with 4 workers on port 8000

Access the application at:
- **Student Exam**: http://YOUR_IP:8000
- **Proctor/Admin**: http://YOUR_IP:8000/login

#### 3. Stop the Server
```bash
./stop-portable.sh
```

This will:
- Stop Laravel Octane
- Stop PostgreSQL

---

### Windows

#### 1. Initial Setup (Run Once)
1. **Right-click** `setup-portable.bat` and select **"Run as Administrator"**
2. Wait for the script to complete (downloads and installs PHP, PostgreSQL, Node.js, Composer)

This will:
- Download and install PHP 8.2+ (Non-Thread Safe) with required extensions
- Download and install PostgreSQL 16+ binaries with a local data directory
- Download and install Node.js 20+
- Install Composer
- Create database and user
- Install PHP dependencies (vendor/)
- Build frontend assets (public/build/)
- Run Laravel migrations and optimizations

#### 2. Start the Server
Double-click `start-portable.bat` (or run from Command Prompt)

This will:
- Detect your IP address
- Start PostgreSQL
- Verify storage link
- Optimize Laravel (if needed)
- Start Laravel Octane with 4 workers on port 8000

Access the application at:
- **Student Exam**: http://YOUR_IP:8000
- **Proctor/Admin**: http://YOUR_IP:8000/login

#### 3. Stop the Server
Double-click `stop-portable.bat` (or run from Command Prompt)

This will:
- Stop Laravel Octane
- Stop PostgreSQL

---

## Project Structure After Setup

```
z-exam/
├── php-portable/           # Portable PHP installation
│   └── bin/
│       ├── php.exe         # PHP executable (Windows)
│       ├── php.ini         # PHP configuration
│       └── composer.bat    # Composer wrapper
├── postgresql-portable/    # Portable PostgreSQL
│   ├── bin/                # PostgreSQL binaries
│   │   ├── postgres.exe
│   │   ├── pg_ctl.exe
│   │   ├── psql.exe
│   │   └── ...
│   ├── data/               # PostgreSQL data directory
│   └── postgresql.log      # PostgreSQL log file
├── nodejs-portable/        # Portable Node.js (Windows only)
│   └── node.exe
├── vendor/                 # PHP dependencies (created by composer install)
├── node_modules/           # Node.js dependencies (created by npm install)
├── public/build/           # Built frontend assets (created by npm run build)
├── bootstrap/cache/        # Laravel cached config/routes/views
├── setup-portable.sh       # Linux/macOS initial setup script
├── start-portable.sh       # Linux/macOS start server script
├── stop-portable.sh        # Linux/macOS stop server script
├── setup-portable.bat      # Windows initial setup script
├── start-portable.bat      # Windows start server script
├── stop-portable.bat       # Windows stop server script
└── .env                    # Environment configuration (PostgreSQL)
```

## Moving to a New Laptop

### Option 1: Full Copy (Includes vendor/ and node_modules/)

#### Linux/macOS to Linux/macOS
```bash
# On old laptop
tar -czf z-exam-portable.tar.gz z-exam/

# Copy to new laptop
scp z-exam-portable.tar.gz user@new-laptop:~/

# On new laptop
tar -xzf z-exam-portable.tar.gz
cd z-exam
./start-portable.sh
```

#### Windows to Windows
```cmd
REM On old laptop - compress folder
tar -czf z-exam-portable.tar.gz z-exam/

REM Copy to new laptop (via USB, network, cloud)

REM On new laptop
tar -xzf z-exam-portable.tar.gz
cd z-exam
start-portable.bat
```

#### Cross-Platform (Linux/macOS ↔ Windows)
**Not recommended** for full copy due to binary incompatibility. Use Option 2 instead.

---

### Option 2: Lightweight Copy (Excludes vendor/ and node_modules/) - **Recommended for Cross-Platform**

#### From any OS to any OS
```bash
# On old laptop - exclude heavy folders
tar -czf z-exam-light.tar.gz z-exam/ \
  --exclude=vendor \
  --exclude=node_modules \
  --exclude=public/build \
  --exclude=bootstrap/cache \
  --exclude=postgresql-portable/data \
  --exclude=php-portable \
  --exclude=nodejs-portable \
  --exclude=.git
```

```cmd
REM On Windows old laptop - using PowerShell
Compress-Archive -Path z-exam\* -DestinationPath z-exam-light.zip -CompressionLevel Optimal
# Then manually delete excluded folders from zip or use 7-Zip with exclusions
```

```bash
# On new laptop (Linux/macOS)
tar -xzf z-exam-light.tar.gz
cd z-exam
./setup-portable.sh  # This will reinstall dependencies and build assets
./start-portable.sh
```

```cmd
REM On new laptop (Windows)
tar -xzf z-exam-light.tar.gz
cd z-exam
REM Right-click setup-portable.bat -> Run as Administrator
setup-portable.bat
start-portable.bat
```

---

## Required PHP Extensions

The following PHP extensions are required and will be installed/configured automatically:

| Extension | Purpose | Linux/macOS | Windows |
|-----------|---------|-------------|---------|
| pdo_pgsql | PostgreSQL database driver | ✅ | ✅ |
| pdo_sqlite | SQLite database driver (fallback) | ✅ | ✅ |
| mbstring | Multibyte string handling | ✅ | ✅ |
| xml | XML processing | ✅ | ✅ |
| curl | HTTP requests | ✅ | ✅ |
| zip | ZIP archive handling | ✅ | ✅ |
| gd | Image processing | ✅ | ✅ |
| bcmath | Arbitrary precision mathematics | ✅ | ✅ |
| intl | Internationalization | ✅ | ✅ |
| redis | Redis client | ✅ | ✅ |
| pcntl | Process control (required for Octane) | ✅ | ⚠️ Limited* |
| opcache | Opcode caching (performance) | ✅ | ✅ |

*On Windows, `pcntl` is not available. Laravel Octane uses the **Swoole** driver on Linux/macOS and **RoadRunner** on Windows (installed automatically by setup-portable.bat). The scripts automatically detect the platform and use the appropriate driver.

---

## PostgreSQL Configuration

Default connection settings (in `.env`):
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=z_exam
DB_USERNAME=z_exam
DB_PASSWORD=z_exam_password
```

To change credentials, edit `.env` and restart the server.

---

## Troubleshooting

### Linux/macOS

#### PHP not found
```bash
# Re-run setup
./setup-portable.sh
```

#### PostgreSQL won't start
```bash
# Check logs
cat postgresql-portable/postgresql.log

# Reset data directory (WARNING: destroys data)
rm -rf postgresql-portable/data
./setup-portable.sh
```

#### Port 8000 already in use
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

#### Octane workers not starting
```bash
# Check PHP extensions
php-portable/bin/php -m | grep -E "pcntl|opcache"

# Reinstall PHP extensions
sudo apt-get install --reinstall php8.2-pcntl php8.2-opcache
```

#### Assets not loading
```bash
# Rebuild assets
npm run build
```

---

### Windows

#### "Access Denied" or Permission Errors
- **Always run `setup-portable.bat` as Administrator**
- Right-click the file → "Run as Administrator"

#### PHP not found / "php.exe is not recognized"
```cmd
REM Re-run setup as Administrator
setup-portable.bat
```

#### PostgreSQL won't start
```cmd
REM Check logs
type postgresql-portable\postgresql.log

REM Reset data directory (WARNING: destroys data)
rmdir /s /q postgresql-portable\data
setup-portable.bat
```

#### Port 8000 already in use
```cmd
REM Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

#### Octane workers not starting on Windows
```cmd
REM Check PHP extensions
php-portable\bin\php.exe -m | findstr /I "opcache"

REM On Windows, Octane uses RoadRunner/FrankenPHP instead of Swoole
REM Ensure you have Visual C++ Redistributable installed
```

#### "The system cannot find the path specified" for npm/node
```cmd
REM Node.js portable path may need refresh
REM Re-run setup or manually add to PATH
set PATH=%CD%\nodejs-portable\node-v20.15.0-win-x64;%PATH%
```

#### Assets not loading
```cmd
REM Rebuild assets
npm run build
```

#### Antivirus blocking downloads or executables
- Add project folder to antivirus exclusions
- Allow PowerShell scripts to run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## Scripts Reference

### Linux/macOS
| Script | Description |
|--------|-------------|
| `setup-portable.sh` | Full initial setup (run once) |
| `start-portable.sh` | Start PostgreSQL + Laravel Octane |
| `stop-portable.sh` | Stop PostgreSQL + Laravel Octane |

### Windows
| Script | Description |
|--------|-------------|
| `setup-portable.bat` | Full initial setup (run once as Administrator) |
| `start-portable.bat` | Start PostgreSQL + Laravel Octane |
| `stop-portable.bat` | Stop PostgreSQL + Laravel Octane |

---

## Production Deployment Notes

For production use:
1. Change `APP_DEBUG=false` in `.env`
2. Set a strong `APP_KEY` (run `php artisan key:generate`)
3. Use secure database passwords
4. Configure proper `APP_URL`
5. Set up SSL/TLS termination (nginx/Apache reverse proxy on Linux, IIS on Windows)
6. Configure firewall rules
7. Set up regular database backups
8. On Windows: Consider running PostgreSQL as a Windows Service for auto-start

---

## License
Created by Andi Mariono (2026)