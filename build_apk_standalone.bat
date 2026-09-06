@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Kelimelik Yardimcisi - Bagimsiz Android APK (Capacitor)

set PROJDIR=%~dp0android-standalone-proje
set SDKDIR=%~dp0android-sdk

echo ============================================================
echo   KELIMELIK YARDIMCISI - BAGIMSIZ ANDROID APK
echo   (Capacitor ile - internet/siteye ihtiyac duymadan calisir)
echo ============================================================
echo.

REM --- 1) Node.js kontrolu -------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi. https://nodejs.org adresinden LTS surumu kurun.
    pause
    exit /b 1
)
echo [OK] Node.js bulundu.

REM --- 2) Java (JDK) kontrolu ------------------------------------------------
where java >nul 2>nul
if errorlevel 1 (
    echo [HATA] Java ^(JDK^) bulunamadi.
    echo Lutfen JDK 17 veya uzerini kurun:  https://adoptium.net
    echo Kurduktan sonra bu dosyayi tekrar calistirin.
    pause
    exit /b 1
)
where keytool >nul 2>nul
if errorlevel 1 (
    echo [HATA] keytool bulunamadi ^(JDK kurulumunun bir parcasi olmali^).
    echo JDK kurulumunuzu kontrol edin.
    pause
    exit /b 1
)
echo [OK] Java/keytool bulundu.
echo.

REM --- 3) Android SDK kontrolu / otomatik kurulum ----------------------------
set SDK_READY=0
if defined ANDROID_HOME (
    if exist "%ANDROID_HOME%\cmdline-tools" set SDK_READY=1
)
if "%SDK_READY%"=="0" (
    if exist "%SDKDIR%\cmdline-tools\latest\bin\sdkmanager.bat" (
        set ANDROID_HOME=%SDKDIR%
        set SDK_READY=1
    )
)

if "%SDK_READY%"=="0" (
    echo Android SDK bulunamadi, otomatik kuruluyor ^(~150 MB, birkac dakika surebilir^)...
    if not exist "%SDKDIR%" mkdir "%SDKDIR%"

    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0download_android_sdk.ps1" -SdkDir "%SDKDIR%"

    if not exist "%SDKDIR%\cmdline-tools\latest\bin\sdkmanager.bat" (
        echo.
        echo [HATA] Android SDK otomatik kurulamadi.
        echo Elle kurmak icin APK_STANDALONE_KURULUM.md dosyasindaki
        echo "Otomatik SDK kurulumu basarisiz olursa" bolumune bakin.
        pause
        exit /b 1
    )

    set ANDROID_HOME=%SDKDIR%
    echo Lisanslar onaylaniyor ve gerekli paketler kuruluyor...
    powershell -NoProfile -Command "1..25 | ForEach-Object {'y'} | Out-File -Encoding ascii '%SDKDIR%\yes.txt'"
    "%SDKDIR%\cmdline-tools\latest\bin\sdkmanager.bat" --licenses < "%SDKDIR%\yes.txt" >nul 2>nul
    del "%SDKDIR%\yes.txt" >nul 2>nul
    call "%SDKDIR%\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
)

echo [OK] Android SDK hazir: %ANDROID_HOME%
echo.

REM --- 4) Capacitor projesi kurulumu ----------------------------------------
if not exist "%PROJDIR%" mkdir "%PROJDIR%"
cd /d "%PROJDIR%"

if not exist "package.json" (
    call npm init -y >nul
)

echo Capacitor paketleri kontrol ediliyor/kuruluyor...
call npm install @capacitor/core @capacitor/cli @capacitor/android --silent
if errorlevel 1 (
    echo [HATA] Capacitor paketleri kurulamadi. Internet baglantinizi kontrol edin.
    pause
    exit /b 1
)
echo.

REM --- 5) Web dosyalarini kopyala --------------------------------------------
if not exist "www" mkdir "www"
if not exist "www\icons" mkdir "www\icons"
copy /Y "%~dp0index.html" "www\" >nul
copy /Y "%~dp0app.js" "www\" >nul
copy /Y "%~dp0style.css" "www\" >nul
copy /Y "%~dp0manifest.json" "www\" >nul
copy /Y "%~dp0dictionary.txt" "www\" >nul
copy /Y "%~dp0icons\*.png" "www\icons\" >nul
echo [OK] Web dosyalari kopyalandi.
echo.

REM --- 6) Capacitor init / android proje ekleme -----------------------------
if not exist "capacitor.config.ts" (
    if not exist "capacitor.config.json" (
        echo Uygulama adi ve paket kimligi soruluyor - bos birakip Enter'a basabilirsiniz.
        set /p APPNAME="Uygulama adi [Kelimelik Yardimcisi]: "
        if "!APPNAME!"=="" set APPNAME=Kelimelik Yardimcisi
        set /p APPID="Paket kimligi [com.kelimelik.yardimci]: "
        if "!APPID!"=="" set APPID=com.kelimelik.yardimci
        call npx cap init "!APPNAME!" "!APPID!" --web-dir=www
    )
)

if not exist "android" (
    call npx cap add android
) else (
    call npx cap copy android
)
if errorlevel 1 (
    echo [HATA] Android projesi olusturulamadi/guncellenemedi.
    pause
    exit /b 1
)
echo [OK] Android projesi hazir: %PROJDIR%\android
echo.

REM --- 7) Imzalama anahtari (ilk seferde olusturulur, sonra tekrar kullanilir) ---
set KEYSTORE=%PROJDIR%\release.keystore
set PASSFILE=%PROJDIR%\keystore_pass.txt

if not exist "%KEYSTORE%" (
    echo ============================================================
    echo   IMZALAMA ANAHTARI OLUSTURULUYOR
    echo   Belirleyeceginiz sifreyi NOT ALIN - uygulamayi ileride
    echo   guncellemek icin AYNI anahtara ihtiyaciniz olacak.
    echo ============================================================
    set /p KSPASS="Anahtar sifresi - en az 6 karakter: "
    keytool -genkeypair -v -keystore "%KEYSTORE%" -alias release -keyalg RSA -keysize 2048 -validity 10000 -storepass "!KSPASS!" -keypass "!KSPASS!" -dname "CN=Kelimelik, OU=Kisisel, O=Kisisel, L=Sehir, S=Sehir, C=TR"
    if errorlevel 1 (
        echo [HATA] Anahtar olusturulamadi.
        pause
        exit /b 1
    )
    > "%PASSFILE%" echo !KSPASS!
    echo [ONEMLI] Sifreniz ayrica %PASSFILE% dosyasina yazildi.
    echo Bu dosyayi ve %KEYSTORE% dosyasini guvenli bir yere yedekleyin.
) else (
    set /p KSPASS=<"%PASSFILE%"
)
echo.

REM --- 8) APK derle -----------------------------------------------------------
echo ============================================================
echo   APK DERLENIYOR - ilk seferde birkac dakika surebilir
echo ============================================================
call npx cap build android --androidreleasetype APK --keystorepath "%KEYSTORE%" --keystorepass "%KSPASS%" --keystorealias release --keystorealiaspass "%KSPASS%" --signing-type apksigner

set APKPATH=%PROJDIR%\android\app\build\outputs\apk\release\app-release-signed.apk

echo.
if exist "%APKPATH%" (
    echo ============================================================
    echo   BASARILI!
    echo   APK dosyaniz: %APKPATH%
    echo.
    echo   Bu, sadece cihazinizda calisan, internete/siteye ihtiyac
    echo   duymayan TAMAMEN BAGIMSIZ bir uygulamadir.
    echo ============================================================
) else (
    echo [UYARI] Beklenen dosya bulunamadi:
    echo   %APKPATH%
    echo.
    echo   android\app\build\outputs\apk\release\ klasorune bakin - farkli
    echo   bir isimle olusmus olabilir ^(orn. app-release-unsigned.apk^).
    echo   Sorun giderme adimlari icin APK_STANDALONE_KURULUM.md dosyasina bakin.
)
echo.
pause
