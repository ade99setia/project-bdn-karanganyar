@echo off
REM === CONFIGURATIONS ===
set USER=idnq7835
set HOST=juwana.iixcp.rumahweb.net
set PORT=2223
set PASS=Fe1eQTX8Giby49

set PROJECT_DIR="D:\3-ProjectWebsite\laragon\www\project-bdn-karanganyar"
set LOCAL_BUILD_DIR=%PROJECT_DIR%\public\build
set LOCAL_ZIP=%PROJECT_DIR%\storage\app\public\build.zip
set REMOTE_PATH=public_html/bdn.idnsolo.com/public/build

echo =======================================================
echo 🚀 DEPLOY SCRIPT - BDN KARANGANYAR
echo =======================================================

REM === STEP 1: BUILD PROJECT ===
echo [1/5] Menjalankan npm run build...
cd %PROJECT_DIR%
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build gagal. Periksa error di atas.
    pause
    exit /b
)

REM === STEP 2: ZIP FOLDER BUILD ===
echo [2/5] Membuat file ZIP dari folder build...
powershell -Command "Compress-Archive -Path %LOCAL_BUILD_DIR%\* -DestinationPath %LOCAL_ZIP% -Force"
1
REM === STEP 3: UPLOAD FILE ZIP KE SERVER ===
echo [3/5] Uploading build.zip ke server...
pscp.exe -P %PORT% -pw %PASS% %LOCAL_ZIP% %USER%@%HOST%:%REMOTE_PATH%/

REM === STEP 4: HAPUS FOLDER ASSETS LAMA DI SERVER ===
echo [4/5] Menghapus folder assets lama di server (membersihkan hash lama)...
REM Menghapus folder assets agar file-file hash lama tidak menumpuk.
REM Jika ingin menghapus semua kecuali build.zip gunakan perintah berbeda.
plink.exe -P %PORT% -pw %PASS% %USER%@%HOST% "cd ~/%REMOTE_PATH% && rm -rf assets && echo 'Folder assets lama dihapus.'"

REM === STEP 5: EXTRACT FILE DI SERVER ===
echo [5/5] Mengekstrak build.zip di server...
plink.exe -P %PORT% -pw %PASS% %USER%@%HOST% "cd ~/%REMOTE_PATH% && unzip -o build.zip"

echo.
echo ✅ Deploy selesai! File berhasil di-build, diupload, dan diekstrak.
pause
