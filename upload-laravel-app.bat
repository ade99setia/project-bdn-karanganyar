@echo off
setlocal enabledelayedexpansion

REM === KONFIGURASI ===
set USER=idnq7835
set HOST=juwana.iixcp.rumahweb.net
set PORT=2223
set PASS=Fe1eQTX8Giby49
set PROJECT_PATH=D:\3-ProjectWebsite\laragon\www\project-bdn-karanganyar
set ZIP_FILE=%PROJECT_PATH%\zip-php.zip
set REMOTE_PATH=/home/idnq7835/public_html/bdn.idnsolo.com

echo ============================
echo 🔧 Membuat ZIP file PHP hasil perubahan...
echo ============================
cd /d "%PROJECT_PATH%"
php zip-php.php

if not exist "%ZIP_FILE%" (
    echo ❌ ZIP file tidak ditemukan. Pastikan script PHP berhasil jalan.
    pause
    exit /b
)

echo ============================
echo 📤 Upload ke server...
echo ============================
pscp.exe -batch -P %PORT% -pw %PASS% "%ZIP_FILE%" %USER%@%HOST%:%REMOTE_PATH%/

if errorlevel 1 (
    echo ❌ Gagal upload ZIP ke server!
    pause
    exit /b
)

echo ============================
echo 📦 Extract di server...
echo ============================
plink.exe -batch -P %PORT% -pw %PASS% %USER%@%HOST% ^
    "cd %REMOTE_PATH% && unzip -o zip-php.zip && rm -f zip-php.zip && echo ✅ Extract selesai"

if errorlevel 1 (
    echo ❌ Gagal extract file di server!
    pause
    exit /b
)

@REM echo ============================
@REM echo ⚙️ Menjalankan npm install/update...
@REM echo ============================
@REM plink.exe -batch -P %PORT% -pw %PASS% %USER%@%HOST% ^
@REM     "cd %REMOTE_PATH% && npm install --production && echo ✅ NPM install/update selesai"

echo ============================
echo 🚀 DEPLOY BERHASIL!
echo ============================
pause
