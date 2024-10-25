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
pip install blinker==1.8.2 click==8.1.7 cloudpickle==3.1.0 colorama==0.4.6 dask==2024.10.0 dask-expr==1.1.16 Flask==3.0.3 fsspec==2024.10.0 greenlet==3.1.1 itsdangerous==2.2.0 Jinja2==3.1.4 locket==1.0.0 MarkupSafe==3.0.2 mysqlclient==2.2.5 numpy==2.1.2 packaging==24.1 pandas==2.2.3 partd==1.4.2 pyarrow==17.0.0 python-dateutil==2.9.0.post0 python-dotenv==1.0.1 pytz==2024.2 PyYAML==6.0.2 six==1.16.0 SQLAlchemy==2.0.36 toolz==1.0.0 typing_extensions==4.12.2 tzdata==2024.2 Werkzeug==3.0.4
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