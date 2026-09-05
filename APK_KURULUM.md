# Gerçek Android APK Oluşturma

`build_apk.bat` dosyası, Google'ın resmi **Bubblewrap CLI** aracını kullanarak
PWA'nızı gerçek, imzalı bir `.apk` dosyasına çevirir. Android Studio kurmanıza
gerek yok — sadece Node.js ve internet bağlantısı yeterli.

Bu APK, uygulamanızı bir "Trusted Web Activity" (TWA) içinde açar: yani
telefonda gerçek bir uygulama ikonu, tam ekran, splash screen ile çalışır ama
içerik hâlâ GitHub Pages'teki canlı adresinizden gelir. **Bu iyi bir şey** —
web dosyalarınızı (app.js, index.html vb.) güncelleyip GitHub'a
gönderdiğinizde, APK'yı yeniden derlemenize gerek kalmadan uygulama otomatik
güncellenir. APK'yı yeniden derlemeniz sadece uygulama **ikonunu veya adını**
değiştirmek istediğinizde gerekir.

## Ön koşullar

- **Node.js** kurulu olmalı: https://nodejs.org (LTS sürümü, "Kur" demeniz yeterli)
- PWA'nızın GitHub Pages'te **yayında** olması gerekiyor (daha önce kurduğunuz adres, örn. `https://kullaniciadin.github.io/kelime-yardimcisi/`)
- İlk çalıştırmada ~1-2 GB indirme olacak (JDK + Android SDK), birkaç dakika sürebilir
- İyi bir internet bağlantısı

## Nasıl çalıştırılır

1. `build_apk.bat` dosyasına **çift tıklayın**.
2. GitHub Pages adresinizi girin (sonunda `/` olsa da olmasa da fark etmez).
3. İlk çalıştırmada Bubblewrap size birkaç soru soracak:

   | Soru | Ne yapmalısınız |
   |---|---|
   | "Install the JDK?" | Enter'a basın (varsayılan: Evet) |
   | "Install the Android SDK?" | Enter'a basın (varsayılan: Evet) |
   | Uygulama adı, paket adı, renkler | Manifest dosyanızdan otomatik doldurulur — çoğunda sadece Enter'a basmanız yeterli |
   | "Signing key" (imzalama anahtarı) bilgileri | Bir **şifre belirleyin ve not alın**. Uygulamayı ileride güncellemek için aynı anahtara ihtiyacınız olacak |

4. Derleme tamamlanınca APK şurada olacak:
   `android-apk-proje\app-release-signed.apk`

5. Bu dosyayı telefonunuza aktarın (USB kablosu, Google Drive, WhatsApp
   "kendine gönder", e-posta — hangisi kolayınıza geliyorsa) ve telefonda
   dosyaya dokunup kurun. Telefon "bilinmeyen kaynaklardan yükleme" izni
   isteyecek — bu normal, onaylayın (bu sadece kendi kurduğunuz dosyalar için
   geçerli, güvenlik riski yaratmaz).

## Tam ekran deneyim için: assetlinks.json (önerilir)

Bu adım olmadan da APK çalışır, ama üstte ince bir tarayıcı adres çubuğu
görünür (Chrome'un "doğrulanmamış" TWA davranışı). Gerçek bir uygulama gibi
tam ekran açılması için:

1. `android-apk-proje` klasöründe oluşan **`assetlinks.json`** dosyasını bulun.
2. GitHub reponuzda `.well-known` adında yeni bir klasör açın (Add file >
   Create new file > dosya adı kutusuna `.well-known/assetlinks.json` yazarsanız
   klasör otomatik oluşur).
3. `assetlinks.json` dosyasının içeriğini oraya yapıştırıp commit edin.
4. 1-2 dakika bekleyin, sonra telefonda uygulamayı kapatıp tekrar açın —
   artık adres çubuğu görünmeyecek.

## Güncelleme

- **Web içeriği değişti** (app.js, index.html, style.css, yeni özellik vb.) →
  Sadece GitHub Pages'e yükleyin, APK'ya dokunmanıza gerek yok. Uygulamayı
  telefonda kapatıp açtığınızda güncel içerik gelir (service worker sayesinde
  offline'da bile en son önbelleklenen sürüm çalışır).
- **İkon/uygulama adı değişti** → `build_apk.bat`'ı tekrar çalıştırın. Aynı
  `android-apk-proje` klasöründe olduğu için önceki imzalama anahtarınızı
  otomatik kullanır (o yüzden anahtar şifrenizi kaybetmeyin).

## Bir şeyler ters giderse: PWABuilder alternatifi

Bubblewrap kurumsal bir ağda/güvenlik duvarı arkasında Android SDK'yı
indiremiyorsa ya da bir hata ile takılırsanız, kod yazmadan aynı sonucu veren
bir web aracı var:

1. https://www.pwabuilder.com adresine gidin.
2. GitHub Pages adresinizi kutuya yapıştırıp Enter'a basın.
3. "Package for stores" > **Android** seçin.
4. İndirilen paketin içinde imzalı bir `.apk` dosyası olacak.

Bu yöntem hiçbir şey kurmadan, tarayıcı üzerinden aynı işi yapar — tek
dezavantajı imzalama anahtarını PWABuilder üretir, siz saklarsınız (Bubblewrap
ile aynı prensip).
