@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Kelimelik Yardimcisi - Android APK Olusturucu

echo ============================================================
echo   KELIMELIK YARDIMCISI - ANDROID APK OLUSTURUCU
echo   (Google'in resmi Bubblewrap CLI araciyla)
echo ============================================================
echo.

REM --- 1) Node.js kontrolu ---------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi.
    echo.
    echo Lutfen once Node.js'i kurun:  https://nodejs.org  ^(LTS surumu^)
    echo Kurduktan sonra bu dosyayi tekrar calistirin.
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js bulundu: %NODE_VER%
echo.

REM --- 2) PWA adresini sor ----------------------------------------------
echo GitHub Pages'te yayindaki adresinizi girin.
echo Ornek: https://kullaniciadin.github.io/kelime-yardimcisi/
echo.
set /p PWA_URL="PWA adresi: "

if "%PWA_URL%"=="" (
    echo [HATA] Adres bos olamaz.
    pause
    exit /b 1
)

REM Sondaki / karakterini kaldir (varsa)
if "%PWA_URL:~-1%"=="/" set PWA_URL=%PWA_URL:~0,-1%
set MANIFEST_URL=%PWA_URL%/manifest.json

echo.
echo Kullanilacak manifest adresi: %MANIFEST_URL%
echo.

REM --- 3) Proje klasoru ---------------------------------------------------
set PROJDIR=%~dp0android-apk-proje
if not exist "%PROJDIR%" mkdir "%PROJDIR%"
cd /d "%PROJDIR%"
echo Proje klasoru: %PROJDIR%
echo.

REM --- 4) Bubblewrap CLI kurulumu ----------------------------------------
where bubblewrap >nul 2>nul
if errorlevel 1 (
    echo Bubblewrap CLI kuruluyor, bu birkac dakika surebilir...
    call npm install -g @bubblewrap/cli
    if errorlevel 1 (
        echo [HATA] Bubblewrap CLI kurulamadi. Internet baglantinizi kontrol edin.
        pause
        exit /b 1
    )
) else (
    echo [OK] Bubblewrap CLI zaten kurulu.
)
echo.

REM --- 5) Proje daha once olusturulmus mu? --------------------------------
if exist "%PROJDIR%\twa-manifest.json" (
    echo Bu klasorde daha once baslatilmis bir proje bulundu.
    echo Doogrudan derlemeye geciliyor...
    goto BUILD
)

echo ============================================================
echo   SIMDI BUBBLEWRAP SORULAR SORACAK - ILK CALISTIRMA
echo ============================================================
echo   1) "Install the JDK?"            -^> Y  (Enter'a basin, varsayilan Y)
echo   2) "Install the Android SDK?"    -^> Y  (Enter'a basin, varsayilan Y)
echo      (Bu ikisi ilk seferde ~1-2 GB indirir, birkac dakika surer)
echo   3) Uygulama adi, paket adi vb.   -^> Onerilen varsayilanlar icin
echo      hep bos birakip Enter'a basmaniz yeterli.
echo   4) "Signing key" (imzalama anahtari) olusturma sorulari gelecek:
echo      -^> Bir sifre belirleyin ve NOTUNUZU ALIN. Uygulamayi ileride
echo         guncellemek icin AYNI anahtara tekrar ihtiyaciniz olacak.
echo ============================================================
echo.
pause

call bubblewrap init --manifest=%MANIFEST_URL%
if errorlevel 1 (
    echo.
    echo [HATA] Proje olusturulamadi. Yukaridaki hata mesajina bakin.
    pause
    exit /b 1
)

:BUILD
echo.
echo ============================================================
echo   APK DERLENIYOR...
echo ============================================================
echo   Derleme sirasinda imzalama anahtarinizin sifresini tekrar
echo   sorabilir - init sirasinda belirledigniz sifreyi girin.
echo ============================================================
echo.

call bubblewrap build
if errorlevel 1 (
    echo.
    echo [HATA] Derleme basarisiz oldu. Yukaridaki hata mesajina bakin.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   BASARILI!
echo ============================================================
echo   APK dosyaniz burada olusturuldu:
echo   %PROJDIR%\app-release-signed.apk
echo.
echo   Bu dosyayi telefonunuza (USB, WhatsApp, Google Drive, e-posta
echo   vb. ile) aktarip acarak kurabilirsiniz. Telefon "bilinmeyen
echo   kaynaklardan yukleme" izni isteyecek, onaylayin.
echo ============================================================
echo.
pause
