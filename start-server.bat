@echo off
setlocal

where py >nul 2>nul
if not errorlevel 1 (
    py -3 -m http.server 8000
    exit /b %errorlevel%
)

where python.exe >nul 2>nul
if not errorlevel 1 (
    python.exe -m http.server 8000
    exit /b %errorlevel%
)

where python3.exe >nul 2>nul
if not errorlevel 1 (
    python3.exe -m http.server 8000
    exit /b %errorlevel%
)

echo Python was not found.
echo Install Python from https://www.python.org/downloads/windows/
echo Then enable "Add python.exe to PATH" during installation.
exit /b 1
