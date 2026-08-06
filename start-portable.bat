@echo off
REM ==================================================
REM Z-EXAM PORTABLE SERVER STARTUP - WINDOWS
REM ANDI MARIONO (2026)
REM ==================================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ==================================================
echo       Z-EXAM PORTABLE SERVER STARTUP
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
REM Setup paths for portable environment
set "PHP_DIR=%SCRIPT_DIR%php-portable"
set "PHP_BIN=%PHP_DIR%\bin\php.exe"

set "PG_DIR=%SCRIPT_DIR%postgresql-portable"
set "PG_BIN=%PG_DIR%\bin"
set "PG_DATA=%PG_DIR%\data"

set "RR_DIR=%SCRIPT_DIR%roadrunner"

REM Add portable binaries to PATH
set "PATH=%PHP_DIR%\bin;%PG_BIN%;%RR_DIR%;%PATH%"

REM Check if portable PHP exists
if not exist "%PHP_BIN%" (
    call :print_error "Portable PHP not found at %PHP_BIN%"
    call :print_error "Please run setup-portable.bat first"
    pause
    exit /b 1
)

REM Check if portable PostgreSQL exists
if not exist "%PG_BIN%\pg_ctl.exe" (
    call :print_error "Portable PostgreSQL not found at %PG_BIN%"
    call :print_error "Please run setup-portable.bat first"
    pause
    exit /b 1
)

REM 1. Detect Local IP Address
call :print_status "Detecting IP Address..."
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do set "IP_ADDR=%%a"
set "IP_ADDR=%IP_ADDR: =%"

if "%IP_ADDR%"=="" (
    call :print_warning "No active network IP detected. Using localhost."
    set "IP_ADDR=127.0.0.1"
) else (
    call :print_success "IP Address found: %IP_ADDR%"
)

REM 2. Ensure Storage Symbolic Link is Active
if not exist "public\storage" (
    call :print_status "Storage symlink missing. Creating new symlink..."
    "%PHP_BIN%" artisan storage:link
) else (
    call :print_success "Storage symlink active."
)

echo.

REM 3. Start PostgreSQL
call :print_status "Starting PostgreSQL..."
"%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
if %errorLevel% equ 0 (
    call :print_success "PostgreSQL is already running"
) else (
    "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_DIR%\postgresql.log" start
    timeout /t 3 /nobreak >nul
    call :print_success "PostgreSQL started"
)

REM 4. Run Laravel Optimizations (if not already cached)
call :print_status "Checking Laravel optimizations..."
if not exist "bootstrap\cache\config.php" (
    call :print_status "Optimizing Laravel for production..."
    "%PHP_BIN%" artisan config:cache
    "%PHP_BIN%" artisan route:cache
    "%PHP_BIN%" artisan view:cache
    "%PHP_BIN%" artisan event:cache
    call :print_success "Laravel optimized"
) else (
    call :print_success "Laravel already optimized"
)

echo.
echo ==================================================
echo             SERVER SIAP DIGUNAKAN!
echo --------------------------------------------------
echo   Ujian Siswa  : http://%IP_ADDR%:8000
echo   Proktor/Admin: http://%IP_ADDR%:8000/login
echo             Created by : Andi Mariono
echo ==================================================
echo.
echo Sukses selalu
echo.

REM 5. Start Laravel Octane with 4 Workers (using RoadRunner on Windows)
call :print_status "Starting Laravel Octane with 4 workers (RoadRunner)..."
"%PHP_BIN%" artisan octane:start --server=roadrunner --workers=4 --host=%IP_ADDR% --port=8000
