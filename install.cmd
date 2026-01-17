@echo off
echo ================================
echo DECA Quizzler - React Setup
echo ================================
echo.

echo Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found!
node --version
echo.

echo Checking for npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    echo npm usually comes with Node.js. Please reinstall Node.js.
    echo.
    pause
    exit /b 1
)

echo npm found!
npm --version
echo.

echo Installing dependencies...
echo This may take a few minutes...
echo.

npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo ================================
echo Installation Complete!
echo ================================
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo To build for production, run:
echo   npm run build
echo.
pause
