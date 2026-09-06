# Tamamen Bağımsız Android APK (Capacitor)

Bu yöntem, önceki `build_apk.bat` (Bubblewrap) yönteminden **temelden farklı**:
web dosyalarınızın (app.js, index.html, style.css, dictionary.txt, ikonlar)
**tamamının bir kopyasını APK'nın içine gömer**. Kurulumdan sonra:

- İnternete ihtiyaç yok.
- GitHub Pages'e / hiçbir siteye ihtiyaç yok — hatta siteyi tamamen
  kaldırabilirsiniz, uygulama etkilenmez.
- Sözlük de dahil her şey telefonun kendi belleğinde.

**Bedeli:** Web dosyalarında bir değişiklik yaptığınızda (yeni özellik, hata
düzeltmesi vb.) otomatik güncelleme olmaz — `build_apk_standalone.bat`'ı
tekrar çalıştırıp yeni bir APK üretip telefona yeniden kurmanız gerekir.

## Ön koşullar

- **Node.js**: https://nodejs.org (LTS sürümü)
- **Java JDK 17+**: https://adoptium.net (Temurin sürümü önerilir)
  - Kurulumda "Add to PATH" seçeneğini işaretlemeyi unutmayın.
- İyi bir internet bağlantısı (ilk çalıştırmada Android SDK için ~150 MB
  indirilir)
- `build_apk_standalone.bat` ile **aynı klasörde** şu dosyalar bulunmalı:
  `index.html`, `app.js`, `style.css`, `manifest.json`, `dictionary.txt`,
  `icons\` klasörü, ve `download_android_sdk.ps1`.

## Nasıl çalıştırılır

1. `build_apk_standalone.bat` dosyasına çift tıklayın.
2. Node.js ve Java kontrolünden geçtikten sonra, Android SDK yoksa otomatik
   indirilir (birkaç dakika sürebilir, ilerleme ekranda görünür).
3. Uygulama adı ve paket kimliği sorulur — bomboş bırakıp Enter'a basmanız
   yeterli (varsayılanlar kullanılır).
4. İmzalama anahtarı için bir **şifre belirleyin ve not alın** — bu şifre
   otomatik olarak `android-standalone-proje\keystore_pass.txt` dosyasına da
   yazılır, ama yine de yedekleyin. Uygulamayı güncellemek için hep AYNI
   anahtar gerekir.
5. Derleme bitince APK şurada olur:
   `android-standalone-proje\android\app\build\outputs\apk\release\app-release-signed.apk`
6. Bu dosyayı telefona aktarıp kurun (bilinmeyen kaynak izni gerekebilir).

## Güncelleme

Web dosyalarında değişiklik yaptıktan sonra `build_apk_standalone.bat`'ı
**tekrar çalıştırın**. Script daha önce oluşturduğu proje, anahtar ve
ayarları hatırlar (`android-standalone-proje` klasöründe durur), sadece web
dosyalarını yeniden kopyalayıp APK'yı yeniden derler — soruları tekrar
sormaz.

## Otomatik SDK kurulumu başarısız olursa

Bazı kurumsal ağlarda / güvenlik duvarlarında `developer.android.com` veya
`dl.google.com` engelli olabilir. Bu durumda elle kurun:

1. https://developer.android.com/studio adresine gidin, en altta
   "Command line tools only" bölümünden Windows zip'ini indirin.
2. İçindeki `cmdline-tools` klasörünü `kelime_yardimcisi\android-sdk\cmdline-tools\latest`
   olacak şekilde yerleştirin (yani `latest` klasörünün içinde doğrudan
   `bin`, `lib` vb. klasörler olmalı).
3. `build_apk_standalone.bat`'ı tekrar çalıştırın — SDK'yı bulup kaldığı
   yerden devam edecektir.

## Bilinen sorun: imzalama hatası

Capacitor'ın bazı sürümlerinde `--signing-type apksigner` ile imzalama
başarısız olabiliyor (bilinen bir araç hatası). Eğer derleme bittiğinde
`app-release-signed.apk` yerine sadece `app-release-unsigned.apk` görürseniz:

1. `android-standalone-proje` klasöründe bir komut istemi açın.
2. Şunu deneyin (imzalama tipini belirtmeden, varsayılan yöntemle):
   ```
   npx cap build android --androidreleasetype APK --keystorepath release.keystore --keystorepass SIFRENIZ --keystorealias release --keystorealiaspass SIFRENIZ
   ```
3. Bu da olmazsa, en güvenilir yedek plan **Android Studio** kurup
   (https://developer.android.com/studio) `android-standalone-proje\android`
   klasörünü onunla açmak ve Build > Generate Signed Bundle/APK menüsünü
   kullanmaktır — bu, Google'ın kendi GUI aracı olduğu için imzalama
   sorunlarını yaşamaz.

## Eski (Bubblewrap) yöntemle farkı

| | `build_apk.bat` (Bubblewrap) | `build_apk_standalone.bat` (Capacitor) |
|---|---|---|
| Siteye ihtiyaç | Evet, sürekli açık kalmalı | Hayır |
| Web güncellemesi | Anında (siteyi güncelle yeter) | APK'yı yeniden derlemek gerekir |
| Kurulum karmaşıklığı | Düşük (JDK/SDK otomatik) | Orta (SDK indirme elle tetiklenir, imzalama bazen sorunlu) |
| Dosya boyutu | Küçük (~1-2 MB) | Biraz daha büyük (~4-6 MB, sözlük dahil) |
