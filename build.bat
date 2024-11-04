@echo off
title Project Build Script
echo.
echo ===========================================
echo          Building the Project...
echo ===========================================
echo.
REM Step 1: Create a virtual environment
echo Creating Python virtual environment...
python -m venv venv
if %ERRORLEVEL% neq 0 (
   color 0C
   echo Failed to create virtual environment!
   exit /b
)
echo Done!
echo.
REM Step 2: Activate the virtual environment
echo Activating the virtual environment...
call venv\Scripts\activate
if %ERRORLEVEL% neq 0 (
   color 0C
   echo Failed to activate virtual environment!
   exit /b
)
echo Done!
echo.
REM Upgrade pip
python.exe -m pip install --upgrade pip
echo Done!
echo.
REM Step 3: Install dependencies
echo Installing dependencies ...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
   color 0C
   echo Failed to install dependencies!
   exit /b
)
echo Dependencies installed successfully!
echo.
REM Step 4: down Docker containers
echo Stopping Docker containers...
docker-compose down
echo.
REM Step 4: Start Docker containers
echo Starting Docker containers...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
   color 0C
   echo Docker failed to start!
   exit /b
)
echo Docker containers started!
echo.
echo Setup is complete.
exit