@echo off
REM ==================================================
REM Z-EXAM PORTABLE SERVER STOPPER - WINDOWS
REM ANDI MARIONO (2026)
REM ==================================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ==================================================
echo       Z-EXAM PORTABLE SERVER STOPPER
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
REM Setup paths for portable PostgreSQL
set "PG_DIR=%SCRIPT_DIR%postgresql-portable"
set "PG_BIN=%PG_DIR%\bin"
set "PG_DATA=%PG_DIR%\data"

REM Add portable binaries to PATH
set "PATH=%PG_BIN%;%PATH%"

REM 1. Stop Laravel Octane (find and kill the process)
call :print_status "Stopping Laravel Octane..."
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq php.exe" /FO CSV /NH ^| findstr /I "octane:start"') do (
    set "PID=%%a"
    set "PID=!PID:"=!"
    taskkill /PID !PID! /F >nul 2>&1
)

REM Also try to kill by window title or command line
wmic process where "CommandLine like '%octane:start%'" call terminate >nul 2>&1

timeout /t 2 /nobreak >nul

REM Check if any octane processes still running
wmic process where "CommandLine like '%octane:start%'" get ProcessId >nul 2>&1
if %errorLevel% equ 0 (
    wmic process where "CommandLine like '%octane:start%'" call terminate >nul 2>&1
    call :print_success "Laravel Octane stopped (force killed)"
) else (
    call :print_success "Laravel Octane stopped"
)

REM 2. Stop PostgreSQL
call :print_status "Stopping PostgreSQL..."
if exist "%PG_BIN%\pg_ctl.exe" (
    if exist "%PG_DATA%" (
        "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" status >nul 2>&1
        if %errorLevel% equ 0 (
            "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" stop -m fast
            call :print_success "PostgreSQL stopped"
        ) else (
            call :print_warning "PostgreSQL not running"
        )
    ) else (
        call :print_warning "PostgreSQL data directory not found"
    )
) else (
    call :print_warning "PostgreSQL not found or not initialized"
)

echo.
call :print_success "All services stopped successfully"
echo ==================================================
pause