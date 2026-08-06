@echo off
REM ==================================================
REM Z-EXAM PORTABLE SERVER SETUP - WINDOWS
REM ANDI MARIONO (2026)
REM ==================================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ==================================================
echo       Z-EXAM PORTABLE SERVER SETUP
echo            ANDI MARIONO (2026)
echo ==================================================
echo.

REM Skip over the subroutine definitions below and jump to the main logic
goto :main

REM Function to print status
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:main
REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    call :print_error "Please run this script as Administrator"
    pause
    exit /b 1
)

REM Setup paths for portable environment
set "PHP_DIR=%SCRIPT_DIR%php-portable"
set "PHP_BIN=%PHP_DIR%\bin\php.exe"

set "PG_DIR=%SCRIPT_DIR%postgresql-portable"
set "PG_BIN=%PG_DIR%\bin"
set "PG_DATA=%PG_DIR%\data"

set "NODE_DIR=%SCRIPT_DIR%nodejs-portable"
set "NODE_BIN=%NODE_DIR%"

REM Add portable binaries to PATH
set "PATH=%PHP_DIR%\bin;%PG_BIN%;%NODE_BIN%;%PATH%"

REM 1. Install PHP
call :print_status "Setting up PHP..."
if exist "%PHP_BIN%" (
    call :print_success "PHP already installed at %PHP_DIR%"
    goto :check_php_extensions
)

call :print_status "Downloading PHP for Windows..."
REM Download PHP 8.2 for Windows
powershell -Command "
    $url = 'https://windows.php.net/downloads/releases/php-8.2.33-nts-Win32-vs16-x64.zip'
    $output = '%SCRIPT_DIR%php.zip'
    Write-Host 'Downloading PHP...'
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host 'Extracting PHP...'
    Expand-Archive -Path $output -DestinationPath '%PHP_DIR%' -Force
    Remove-Item $output
"

if not exist "%PHP_BIN%" (
    call :print_error "Failed to install PHP. Please install PHP 8.2+ manually from https://windows.php.net/download/"
    pause
    exit /b 1
)

REM Create php.ini with required extensions
call :print_status "Configuring PHP extensions..."
copy /Y "%PHP_DIR%\php.ini-development" "%PHP_DIR%\php.ini" >nul

REM Enable required extensions in php.ini
powershell -Command "
    $ini = Get-Content '%PHP_DIR%\php.ini'
    $extensions = @('pdo_pgsql', 'pdo_sqlite', 'mbstring', 'xml', 'curl', 'zip', 'gd', 'bcmath', 'intl', 'redis', 'pcntl', 'opcache')
    foreach ($ext in $extensions) {
        $ini = $ini -replace (';extension=' + $ext + '\b'), ('extension=' + $ext)
        $ini = $ini -replace (';extension=php_' + $ext + '\.dll'), ('extension=php_' + $ext + '.dll')
    }
    $ini | Set-Content '%PHP_DIR%\php.ini' -Encoding UTF8
"

:check_php_extensions
call :print_success "PHP setup complete"

REM 2. Install PostgreSQL
call :print_status "Setting up PostgreSQL..."
if exist "%PG_BIN%\postgres.exe" (
    call :print_success "PostgreSQL already installed at %PG_DIR%"
    goto :init_postgresql
)

call :print_status "Downloading PostgreSQL for Windows..."
powershell -Command "
    $url = 'https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip'
    $output = '%SCRIPT_DIR%postgresql.zip'
    Write-Host 'Downloading PostgreSQL...'
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host 'Extracting PostgreSQL...'
    Expand-Archive -Path $output -DestinationPath '%PG_DIR%' -Force
    Remove-Item $output
"

if not exist "%PG_BIN%\postgres.exe" (
    call :print_error "Failed to install PostgreSQL. Please install PostgreSQL 16+ manually from https://www.postgresql.org/download/windows/"
    pause
    exit /b 1
)

:init_postgresql
REM Initialize database cluster if not exists
if not exist "%PG_DATA%" (
    call :print_status "Initializing PostgreSQL data directory..."
    mkdir "%PG_DATA%" 2>nul
    "%PG_BIN%\initdb.exe" -D "%PG_DATA%" -U postgres -A trust
)

call :print_success "PostgreSQL setup complete"

REM 3. Install Node.js
call :print_status "Setting up Node.js..."
where node >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=2 delims=v." %%a in ('node --version') do set NODE_MAJOR=%%a
    if !NODE_MAJOR! geq 18 (
        call :print_success "Node.js already installed"
        goto :node_done
    )
)

call :print_status "Downloading Node.js for Windows..."
powershell -Command "
    $url = 'https://nodejs.org/dist/v20.15.0/node-v20.15.0-win-x64.zip'
    $output = '%SCRIPT_DIR%nodejs.zip'
    Write-Host 'Downloading Node.js...'
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host 'Extracting Node.js...'
    Expand-Archive -Path $output -DestinationPath '%NODE_DIR%' -Force
    Remove-Item $output
"

REM Find the extracted node folder
for /d %%a in ("%NODE_DIR%\node-v*-win-x64") do set "NODE_BIN=%%a"
set "PATH=%NODE_BIN%;%PATH%"

:node_done
call :print_success "Node.js setup complete"

REM 4. Install Composer
call :print_status "Setting up Composer..."
where composer >nul 2>&1
if %errorLevel% neq 0 (
    call :print_status "Downloading Composer..."
    powershell -Command "
        Invoke-WebRequest -Uri 'https://getcomposer.org/installer' -OutFile '%SCRIPT_DIR%composer-setup.php' -UseBasicParsing
        & '%PHP_BIN%' '%SCRIPT_DIR%composer-setup.php' --install-dir='%PHP_DIR%\bin' --filename=composer.bat
        Remove-Item '%SCRIPT_DIR%composer-setup.php'
    "
)

call :print_success "Composer setup complete"

REM 5. Install RoadRunner (Octane driver for Windows)
call :print_status "Setting up RoadRunner (Octane driver for Windows)..."
set "RR_BIN=%SCRIPT_DIR%roadrunner\rr.exe"
if not exist "%RR_BIN%" (
    call :print_status "Downloading RoadRunner..."
    powershell -Command "
        $url = 'https://github.com/roadrunner-server/roadrunner/releases/download/v2024.2.1/roadrunner-2024.2.1-windows-amd64.zip'
        $output = '%SCRIPT_DIR%roadrunner.zip'
        Write-Host 'Downloading RoadRunner...'
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host 'Extracting RoadRunner...'
        Expand-Archive -Path $output -DestinationPath '%SCRIPT_DIR%roadrunner' -Force
        Remove-Item $output
    "
)
if exist "%RR_BIN%" (
    set "PATH=%SCRIPT_DIR%roadrunner;%PATH%"
    call :print_success "RoadRunner installed"
) else (
    call :print_warning "RoadRunner download failed, will try to install via Composer later"
)

REM 5. Start PostgreSQL
call :print_status "Starting PostgreSQL..."
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_DIR%\postgresql.log" start
timeout /t 3 /nobreak >nul

REM Create database and user
call :print_status "Setting up database..."
"%PG_BIN%\psql.exe" -h localhost -p 5432 -U postgres -c "CREATE DATABASE z_exam;" >nul 2>nul
"%PG_BIN%\psql.exe" -h localhost -p 5432 -U postgres -c "CREATE USER z_exam WITH PASSWORD 'z_exam_password';" >nul 2>nul
"%PG_BIN%\psql.exe" -h localhost -p 5432 -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE z_exam TO z_exam;" >nul 2>nul
"%PG_BIN%\psql.exe" -h localhost -p 5432 -U postgres -c "ALTER USER z_exam CREATEDB;" >nul 2>nul

call :print_success "PostgreSQL started and database configured"

REM 6. Create .env for PostgreSQL
call :print_status "Creating PostgreSQL configuration..."
(
echo APP_NAME=Z-EXAM
echo APP_ENV=production
echo APP_KEY=
echo APP_DEBUG=false
echo APP_URL=http://localhost:8000
echo.
echo APP_LOCALE=en
echo APP_FALLBACK_LOCALE=en
echo APP_FAKER_LOCALE=en_US
echo.
echo APP_MAINTENANCE_DRIVER=file
echo.
echo BCRYPT_ROUNDS=12
echo.
echo LOG_CHANNEL=stack
echo LOG_STACK=single
echo LOG_DEPRECATIONS_CHANNEL=null
echo LOG_LEVEL=error
echo.
echo DB_CONNECTION=pgsql
echo DB_HOST=127.0.0.1
echo DB_PORT=5432
echo DB_DATABASE=z_exam
echo DB_USERNAME=z_exam
echo DB_PASSWORD=z_exam_password
echo.
echo SESSION_DRIVER=database
echo SESSION_LIFETIME=120
echo SESSION_ENCRYPT=false
echo SESSION_PATH=/
echo SESSION_DOMAIN=null
echo.
echo BROADCAST_CONNECTION=log
echo FILESYSTEM_DISK=local
echo QUEUE_CONNECTION=database
echo.
echo CACHE_STORE=database
echo.
echo MEMCACHED_HOST=127.0.0.1
echo.
echo REDIS_CLIENT=phpredis
echo REDIS_HOST=127.0.0.1
echo REDIS_PASSWORD=null
echo REDIS_PORT=6379
echo.
echo MAIL_MAILER=log
echo MAIL_SCHEME=null
echo MAIL_HOST=127.0.0.1
echo MAIL_PORT=2525
echo MAIL_USERNAME=null
echo MAIL_PASSWORD=null
echo MAIL_FROM_ADDRESS="hello@example.com"
echo MAIL_FROM_NAME="%APP_NAME%"
echo.
echo AWS_ACCESS_KEY_ID=
echo AWS_SECRET_ACCESS_KEY=
echo AWS_DEFAULT_REGION=us-east-1
echo AWS_BUCKET=
echo AWS_USE_PATH_STYLE_ENDPOINT=false
echo.
echo VITE_APP_NAME="%APP_NAME%"
) > ".env.postgres"

copy /Y ".env.postgres" ".env" >nul
call :print_success "PostgreSQL .env configuration created"

REM 7. Install PHP dependencies
call :print_status "Installing PHP dependencies..."
call "%PHP_DIR%\bin\composer.bat" install --optimize-autoloader --no-dev
call :print_success "PHP dependencies installed"

REM 8. Install Node.js dependencies and build assets
call :print_status "Installing Node.js dependencies and building assets..."
npm ci
npm run build
call :print_success "Assets built successfully"

REM 9. Setup Laravel application
call :print_status "Setting up Laravel application..."
"%PHP_BIN%" artisan key:generate --force
"%PHP_BIN%" artisan storage:link 2>nul
"%PHP_BIN%" artisan migrate --force
"%PHP_BIN%" artisan config:cache
"%PHP_BIN%" artisan route:cache
"%PHP_BIN%" artisan view:cache
"%PHP_BIN%" artisan event:cache
call :print_success "Laravel setup complete"

echo.
echo ==================================================
echo       PORTABLE SETUP COMPLETE!
echo ==================================================
echo.
echo To start the server, run: start-portable.bat
echo To stop the server, run: stop-portable.bat
echo.
pause
exit /b 0