# Kelimelik Türkçe Yardımcısı

XAMPP altında çevrimdışı/yerel çalışan 15x15 Kelimelik yardımcı uygulaması.

## Kurulum

Klasörü:

`C:\xampp\htdocs\kelime_yardimcisi`

altına koyup Apache'yi başlatın. Tarayıcıdan:

`http://localhost/kelime_yardimcisi/`

adresini açın.

## Tahta

Tahta, verilen Kelimelik ekran görüntüsündeki 15x15 bonus düzeni kullanır:

- H²: harf puanı x2
- H³: harf puanı x3
- K²: kelime puanı x2
- K³: kelime puanı x3
- Dinamik ★2 özel karesi
- Dinamik ★★★ özel karesi

★2 ve ★★★ her oyunda farklı yere konumlanıyorsa, ilgili düğmeye basıp tahtadaki kareyi seçerek konumlarını değiştirebilirsiniz. `Yıldızları Sil` ile ikisini kaldırabilirsiniz.

## Birden Fazla Oyun

Üstteki **OYUNLAR** şeridinden aynı anda birden fazla Kelimelik partisini takip edebilirsin:

- **+ Yeni Oyun**: Boş bir tahta ve el ile yeni bir oyun başlatır, ismini sorar (örn. "Ali'ye karşı").
- Bir sekmeye **tıklamak** o oyuna geçer; tahta, el, yıldız konumları ve seçili hücre olduğu gibi geri gelir.
- Bir sekmeye **çift tıklamak** adını değiştirmeni sağlar.
- Sekmedeki **✕** düğmesi o oyunu **kalıcı olarak bitirir** (onay ister). Bitirmediğin sürece oyun, tarayıcıyı/programı kapatıp açsan bile aynen kalır — her hamle otomatik olarak tarayıcının yerel deposuna (localStorage) kaydedilir.

Not: Sözlük tüm oyunlar için ortaktır; oyun bazlı saklanan tek şeyler tahta, el, yıldız konumları ve seçili hücredir.

## Sözlük Kelime Ekle / Sil

Gerçek oyunda kabul görmeyen ama uygulamanın önerdiği kelimeler olabilir
(ya da tam tersi). Sağ alttaki **SÖZLÜK** kartındaki "Kelime Ekle / Sil"
bölümünden:

- Bir kelime yazıp **+ Ekle** dersen, sözlükte olmasa bile artık önerilere
  dahil edilir.
- Bir kelime yazıp **− Sil** dersen, sözlükte olsa bile artık hiç önerilmez.
- Aşağıdaki listede eklediğin (yeşil) ve sildiğin (kırmızı, üstü çizili)
  kelimeleri görürsün; üzerlerindeki **✕** ile geri alabilirsin.

Bu tercihler cihazında/tarayıcında kalıcı olarak saklanır ve sözlüğü hangi
kaynaktan yüklersen yükle (yerel dosya/internet/manuel yükleme) otomatik
uygulanır.

## Kullanım

1. Rakibin ve tahtadaki mevcut harfleri tıklayıp/klavyeden girin.
2. Elinizdeki en fazla 7 harfi girin. `*` joker olarak kabul edilir.
3. `EN İYİ HAMLELERİ BUL` düğmesine basın.
4. Sonuç kartlarından birine tıklayarak hamlenin tahtadaki yerleşimini görün.

Sözlük ilk açılışta internetten alınır. İnternet erişimi yoksa sağdaki `.txt` yükleme alanından yerel Türkçe kelime listenizi seçebilirsiniz.
