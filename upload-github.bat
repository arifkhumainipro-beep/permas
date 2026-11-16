@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo   UPLOAD PORTAL PERMAS NASIONAL KE GITHUB
echo ==================================================
echo.

git status -s >nul 2>&1
if errorlevel 1 (
    echo [RALAT] Folder ini belum mempunyai repositori Git.
    pause
    exit /b 1
)

for /f "delims=" %%i in ('git remote get-url origin 2^>nul') do set "REMOTE_URL=%%i"

if not defined REMOTE_URL (
    echo Sila cipta repositori baharu di https://github.com/new
    echo kemudian tampal URL repositori anda di bawah.
    echo Contoh: https://github.com/username/permas.git
    echo.
    set /p "REMOTE_URL=Masukkan URL GitHub Repo: "
)

if not defined REMOTE_URL (
    echo [RALAT] Tiada URL repositori dimasukkan.
    pause
    exit /b 1
)

:: Buang tanda petik jika pengguna tampal URL dengan petik
set "REMOTE_URL=%REMOTE_URL:"=%"

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin "%REMOTE_URL%"
) else (
    git remote set-url origin "%REMOTE_URL%"
)

if errorlevel 1 (
    echo [RALAT] Gagal menetapkan remote origin.
    pause
    exit /b 1
)

echo.
echo [1/2] Menetapkan branch utama ke 'main'...
git branch -M main

echo [2/2] Memuat naik fail ke %REMOTE_URL% ...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [PERHATIAN] Muat naik gagal atau dibatalkan.
    echo Pastikan anda log masuk akaun GitHub apabila diminta dan URL repo adalah betul.
    pause
    exit /b 1
)

echo.
echo [BERJAYA] Portal PERMAS telah dimuat naik ke GitHub!
echo Langkah seterusnya untuk siar secara langsung (GitHub Pages):
echo   1. Buka Settings ^> Pages di repositori GitHub anda.
echo   2. Di bawah "Build and deployment", pilih Source: "Deploy from a branch".
echo   3. Pilih Branch: "main" dan folder: "/ (root)", kemudian klik Save.
echo.
pause
