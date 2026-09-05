# Telefona (Android) Kurulum

Bu klasördeki dosyalar zaten PWA (yüklenebilir web uygulaması) olarak hazır:
`manifest.json`, `sw.js` (offline çalıştıran servis çalışanı) ve `icons/` klasörü.

**Önemli:** Telefonun "gerçek bir uygulama" gibi davranması (tam ekran açılması,
internet olmadan çalışması) için sayfanın **https://** ile ya da bilgisayarda
**http://localhost** üzerinden servis edilmesi gerekiyor. Tarayıcılar güvenlik
gereği, düz `http://192.168.x.x` gibi yerel ağ adreslerini "güvenli" saymıyor;
o adresle açarsan sayfa çalışır ama offline modu (service worker) devreye
girmez. Bu yüzden aşağıda **önerilen** kalıcı yöntem GitHub Pages'tir.

---

## Yöntem 1 (Önerilen, kalıcı): GitHub Pages ile ücretsiz barındırma

Kod yazmana gerek yok, tamamen tarayıcı üzerinden yapılıyor.

1. github.com'da hesabın yoksa ücretsiz bir hesap oluştur.
2. Sağ üstten **+ > New repository** ile yeni bir repo aç.
   - İsim: `kelime-yardimcisi` (istediğin bir isim olabilir)
   - **Public** seçili kalsın (ücretsiz Pages için gerekli)
   - "Create repository" de.
3. Açılan sayfada **"uploading an existing file"** linkine tıkla (ya da
   **Add file > Upload files**).
4. Bu klasördeki **tüm dosya ve klasörleri** (icons klasörü dahil) sürükleyip
   bırak. Güncel tarayıcılarda klasör yapısı (icons/ altındaki dosyalar)
   olduğu gibi korunur.
   - Eğer icons klasörü boş/yapısı bozuk görünürse: önce "Add file > Create
     new file" ile `icons/.gitkeep` adında boş bir dosya oluştur (bu, klasörü
     yaratır), sonra o klasörün içine girip 3 ikon dosyasını ayrıca yükle.
5. Altta **"Commit changes"** düğmesine bas.
6. Üst menüden **Settings > Pages** sekmesine git.
7. **Branch** kısmından `main` ve `/ (root)` seç, **Save** de.
8. 1-2 dakika bekle. Sayfa yenilendiğinde üstte yeşil bir kutuda yayındaki
   adresi göreceksin, örn:
   `https://kullaniciadin.github.io/kelime-yardimcisi/`

### Telefonda kurulum

1. Telefonda **Chrome** ile yukarıdaki adresi aç.
2. Sağ üstteki **⋮** menüsüne dokun.
3. **"Ana ekrana ekle"** ya da **"Uygulamayı yükle"** seçeneğine dokun.
4. Onayla — artık telefonunda gerçek bir uygulama ikonu var, tam ekran açılıyor
   ve internet olmasa da (sözlük hariç, tahta/el/oyunlar) çalışıyor.

> Not: Repo herkese açık (public) olacağı için kodun görülebilir olur —
> uygulamada kişisel bir veri barınmıyor (oyunların hepsi kendi telefonunun/
> tarayıcının localStorage'ında tutuluyor), o yüzden bu bir sorun değil.

---

## Yöntem 2 (Hızlı test, geçici): XAMPP + aynı Wi-Fi

Sadece hızlıca telefonda görünüşünü test etmek istersen, hesap açmadan:

1. Bilgisayarında XAMPP açıkken, Windows'ta **cmd** açıp `ipconfig` yaz,
   "IPv4 Adresi" satırını not al (örn. `192.168.1.24`).
2. Telefon ve bilgisayar **aynı Wi-Fi ağında** olmalı.
3. Telefonda Chrome'dan şu adresi aç: `http://192.168.1.24/kelime_yardimcisi/`
   (kendi IP adresinle).
4. Sayfa açılır, oyun oynanabilir; ama yukarıda anlatılan güvenli bağlam
   kısıtı yüzünden **offline modu (service worker) devreye girmez** ve
   "Ana ekrana ekle" tam bir PWA kurulumu yerine sade bir kısayol oluşturabilir.
5. Bu adres bilgisayarın IP'si değiştiğinde (örn. router yeniden başlarsa)
   değişebilir — kalıcı kullanım için Yöntem 1'i öneririm.

---

## Özet

| | Yöntem 1: GitHub Pages | Yöntem 2: XAMPP + Wi-Fi |
|---|---|---|
| Kurulum süresi | ~10 dk (bir kere) | ~2 dk |
| Offline çalışır mı | ✅ Evet | ❌ Hayır |
| Her yerden erişim | ✅ İnternet olan her yer | ❌ Sadece aynı Wi-Fi |
| Gerçek "Yükle" istemi | ✅ Evet | ⚠️ Sınırlı/tarayıcıya bağlı |
| Hesap gerekir mi | GitHub hesabı | Hayır |

Kalıcı kullanım için **Yöntem 1**'i, hızlı bir önizleme için **Yöntem 2**'yi kullan.
