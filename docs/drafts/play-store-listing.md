> **TASLAK — yayınlanmadan önce sahibi tarafından gözden geçirilmeli ve onaylanmalıdır.**
> Bu metin, Plan 004 ("feat-android-mvp") biriminin U8 kapsamında hazırlanmıştır. Köşeli parantez
> içindeki `[SAHİP: ...]` alanları sahip tarafından doldurulmalı veya kontrol edilmelidir. Metinler
> `AGENTS.md` Invariants'a uygundur: ürün adı her yerde **Harfhane**'dir, "Wordle" kelimesi hiçbir
> yerde geçmez, reklam bahsi geçmez (Invariant 8 — lansmanda reklam yok).

# Google Play Mağaza Listesi — Harfhane

## Uygulama Adı (≤ 30 karakter)

```
Harfhane - Kelime Oyunu
```

(23 karakter.) Alternatif: `Harfhane: Türkçe Kelime` (23 karakter) — [SAHİP: ikisinden birini
seçin; ilki marka adını net tutar, ikincisi "Türkçe" kelimesini listeleme adında erken gösterir.]

## Kısa Açıklama (≤ 80 karakter)

```
Her gün yeni bir Türkçe kelime bulmacası. Günlük ve sınırsız mod, reklamsız.
```

(76 karakter.)

## Tam Açıklama (≤ 4000 karakter)

```
Harfhane, Türkçe kelime dağarcığınızı eğlenceli bir bulmacayla test eden, ailece
oynanabilen bir kelime oyunudur.

GÜNLÜK BULMACA
Her gün herkese aynı anda açılan tek bir bulmaca. Belirlenen deneme hakkınız
içinde gizli kelimeyi bulmaya çalışın; her tahmininiz size doğru, yanlış yerde
ve yanlış harfler hakkında ipucu verir. Sonucunuzu arkadaşlarınızla
karşılaştırın.

SINIRSIZ MOD
Günlük bulmacayı tamamladınız mı? Sınırsız modda istediğiniz kadar oynayın,
kelime dağarcığınızı geliştirin.

4, 5 VEYA 6 HARF
Kelime uzunluğunu kendiniz seçin: 4 harften başlayıp 6 harfe kadar farklı
zorluk seviyelerinde oynayın.

HERKES İÇİN TASARLANDI
Yüksek kontrast teması dahil birden fazla görünüm seçeneğiyle, görme
farklılığı olan oyuncular da dahil herkes rahatça oynayabilir. Açık ve koyu
tema arasında otomatik veya elle geçiş yapabilirsiniz.

AİLE DOSTU VE REKLAMSIZ
Harfhane'de rahatsız edici reklam yoktur. Kelime havuzu, aile ortamına uygun
olacak şekilde gözden geçirilir.

TÜRKÇE'YE ÖZEL
Oyun, Türkçe'nin kendine özgü harf kurallarını (ı/İ, ş, ğ, ü, ö, ç gibi) tam
olarak destekler — İngilizce kelime oyunlarının Türkçe'ye uymayan
kısıtlamaları burada yoktur.

[SAHİP: isteğe bağlı eklenebilir — hesap/giriş gerekiyorsa bir cümle; XP/rozet
sistemi lansmanda aktifse bir cümle. Bu taslak, Plan 004 MVP kapsamını (günlük
+ sınırsız mod, 4/5/6 harf, tema) yansıtır; lansman kapsamı genişlerse açıklama
güncellenmelidir.]

Harfhane hakkında daha fazla bilgi ve web sürümü: harfhane.app
```

(≈1550 karakter; 4000 sınırına göre genişletme payı var — [SAHİP: ekran görüntüsü başlıkları,
özellik listesi genişletmesi gibi ek içerik eklenebilir.])

## Kategori Önerisi

**Birincil kategori:** Oyunlar (Games) → **Kelime (Word)**
**İkincil/alternatif:** Eğitim (Education) — [SAHİP: Play Console tek birincil kategori ister;
"Kelime" alt kategorisi varsa onu seçin, yoksa "Bulmaca" (Puzzle) kullanılabilir.]

## İçerik Derecelendirmesi Notları

- Oyun; şiddet, cinsel içerik, kumar veya kullanıcı tarafından oluşturulan açık içerik barındırmaz.
- Kelime listesi TDK tabanlı ve `family_safe` bayrağıyla filtrelenir (bkz. `AGENTS.md` Invariant 1,
  3) — aile/genel izleyici derecelendirmesi bekleniyor (örn. IARC "Everyone" / PEGI 3 dengi).
- Reklam yok (Invariant 8) → "reklam içerir" kutusu işaretlenmemeli.
- [SAHİP: IARC anketini Play Console üzerinden doldurup gerçek derecelendirmeyi burada
  güncelleyin; bu bölüm bir öneri/kontrol listesidir, resmi derecelendirme değildir.]

## Veri Güvenliği (Data Safety) Formu İçin Not

Taslak gizlilik politikasına bakınız: `docs/drafts/gizlilik-politikasi.md` (Bölüm 9, Google Play
Veri Güvenliği özeti). Mobil uygulamanın lansman kapsamına göre bu bölüm teyit edilmelidir —
[SAHİP: mobil app hesap/giriş kullanıyorsa veya sunucuya bağlanıyorsa gizlilik taslağındaki
"mobil uygulama ileride sunucuya bağlanırsa güncellenmelidir" notu çözülmeli.]

## Gerekli Ekran Görüntüleri

Play Console minimum 2, önerilen 4-8 telefon ekran görüntüsü ister. Önerilen kadraj listesi:

1. Günlük bulmaca — oyun ekranı, birkaç tahmin yapılmış, renkli (doğru/yanlış/yanlış-yerde)
   geri bildirim görünür halde.
2. Kazanma ekranı / günlük sonuç özeti (seri, istatistik).
3. Kelime uzunluğu seçim ekranı (4/5/6 harf).
4. Sınırsız mod — oyun içi ekran.
5. Tema seçimi — açık/koyu/yüksek kontrast karşılaştırması (tek görselde ikiye bölünmüş veya
   galeri halinde ayrı ayrı).
6. [SAHİP: lansmanda aktifse] Profil/XP/rozet ekranı.

Ayrıca gerekli:
- **Uygulama simgesi** (512x512 PNG, yüksek çözünürlük) — bu birimde üretilen
  `apps/mobile/assets/icon.png` kaynağından ölçeklenebilir.
- **Öne çıkan grafik (feature graphic)** 1024x500 PNG — [SAHİP: bu birimde üretilmedi, pazarlama
  görseli olarak ayrıca hazırlanmalı; `apps/frontend/public/og-image.svg` referans alınabilir
  ancak marka renkleri `packages/ui-tokens/tokens.json` ile hizalanmalı.]
- [SAHİP: Tablet ekran görüntüleri isteğe bağlıdır; mobil uygulama şu an yalnızca telefon/portrait
  için optimize, bu nedenle lansımda atlanabilir.]

## Diğer Liste Alanları — Kontrol Listesi

- **İletişim e-postası:** [SAHİP]
- **Gizlilik politikası URL'si:** [SAHİP: `docs/drafts/gizlilik-politikasi.md` yayınlanıp genel bir
  URL'ye (örn. harfhane.app/gizlilik) taşınmalı; Play Console mutlak bir URL ister.]
- **Web sitesi:** harfhane.app
- **Uygulama kategorisi için etiketler/anahtar kelimeler:** kelime oyunu, Türkçe, günlük bulmaca,
  kelime bulmaca — [SAHİP: Play Console başlık/açıklama dışında ayrı bir anahtar kelime alanı
  sunmaz; bu liste yalnızca açıklama metnini optimize etmek için referanstır.]
