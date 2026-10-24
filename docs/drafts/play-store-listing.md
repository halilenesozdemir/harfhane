> **TASLAK — yayınlanmadan önce sahibi tarafından gözden geçirilmeli ve onaylanmalıdır.**
> Bu metin, Plan 004 ("feat-android-mvp") biriminin U8 kapsamında hazırlanmıştır. Köşeli parantez
> içindeki `[SAHİP: ...]` alanları sahip tarafından doldurulmalı veya kontrol edilmelidir. Metinler
> `AGENTS.md` Invariants'a uygundur: ürün adı her yerde **Harfhane**'dir, "Wordle" kelimesi hiçbir
> yerde geçmez, reklam bahsi geçmez (Invariant 8 — lansmanda reklam yok). İlk sürüm ücretsizdir,
> reklamsızdır, hesap/giriş gerektirmez ve satın alma içermez
> (`docs/decisions/2026-10-06-free-launch.md`, `docs/decisions/2026-10-05-mvp-scope-cut.md`).
> Hedef kitle 13+ olarak belirlenmiştir; uygulama çocuklara yönelik tasarlanmamıştır (Google Play
> Families politikasını tetiklememek için).

# Google Play Mağaza Listesi — Harfhane

## Uygulama Adı (≤ 30 karakter)

```
Harfhane - Kelime Oyunu
```

(23 karakter — owner kararı: bu ad kullanılacak.)

## Kısa Açıklama (≤ 80 karakter)

```
Her gün yeni bir Türkçe kelime bulmacası. Günlük ve sınırsız mod, reklamsız.
```

(76 karakter.)

## Tam Açıklama (≤ 4000 karakter)

```
Harfhane, Türkçe kelime dağarcığınızı eğlenceli bir bulmacayla test eden bir kelime
oyunudur. Her yaştan kelime meraklısına uygundur.

GÜNLÜK BULMACA
Her gün herkese aynı anda açılan tek bir bulmaca. Belirlenen deneme hakkınız
içinde gizli kelimeyi bulmaya çalışın; her tahmininiz size doğru, yanlış yerde
ve yanlış harfler hakkında ipucu verir. Sonucunuzu arkadaşlarınızla paylaşın.

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

REKLAMSIZ, HESAPSIZ
Harfhane'de reklam yoktur, hesap veya giriş gerekmez. İstatistikleriniz ve
seriniz yalnızca cihazınızda tutulur.

TÜRKÇE'YE ÖZEL
Oyun, Türkçe'nin kendine özgü harf kurallarını (ı/İ, ş, ğ, ü, ö, ç gibi) tam
olarak destekler — İngilizce kelime oyunlarının Türkçe'ye uymayan
kısıtlamaları burada yoktur.

Harfhane hakkında daha fazla bilgi ve web sürümü: harfhane.app
```

(≈1240 karakter; 4000 sınırına göre genişletme payı var — [SAHİP: ekran görüntüsü başlıkları,
özellik listesi genişletmesi gibi ek içerik eklenebilir.])

## Kategori Önerisi

**Birincil kategori:** Oyunlar (Games) → **Kelime (Word)**
**İkincil/alternatif:** Eğitim (Education) — [SAHİP: Play Console tek birincil kategori ister;
"Kelime" alt kategorisi varsa onu seçin, yoksa "Bulmaca" (Puzzle) kullanılabilir.]

## İçerik Derecelendirmesi Notları

- Oyun; şiddet, cinsel içerik, kumar veya kullanıcı tarafından oluşturulan açık içerik barındırmaz.
- Kelime listesi TDK tabanlı değildir (Invariant 3) ve `family_safe` bayrağıyla filtrelenir (bkz.
  `AGENTS.md` Invariant 1) — düşük risk / genel izleyici derecelendirmesi bekleniyor (örn. IARC
  "Everyone" / PEGI 3 dengi). Bu, hedef kitlenin çocuklar olduğu anlamına gelmez: içerik uygundur
  ama uygulama çocuklara yönelik pazarlanmaz (aşağıdaki "Hedef kitle" cevabına bakın).
- Reklam yok (Invariant 8) → "reklam içerir" kutusu işaretlenmemeli.
- [SAHİP: IARC anketini Play Console üzerinden doldurup gerçek derecelendirmeyi burada
  güncelleyin; bu bölüm bir öneri/kontrol listesidir, resmi derecelendirme değildir.]

## Veri Güvenliği (Data Safety) Formu İçin Not

Taslak gizlilik politikasına bakınız: `docs/drafts/gizlilik-politikasi.md`. Mobil uygulama hesap
veya giriş kullanmaz (`docs/decisions/2026-10-05-mvp-scope-cut.md`,
`docs/decisions/2026-10-06-free-launch.md`); istatistikler ve seri yalnızca cihazda tutulur,
sunucuya kişisel veri gönderilmez. [SAHİP: `docs/drafts/gizlilik-politikasi.md` hâlâ eski
(hesap/XP döneminden kalma) metin içeriyor — bu dosya ayrı bir birimde no-accounts modeline göre
güncellenmeli; Play Console Veri Güvenliği formu o güncel metne göre doldurulmalı.]

## Gerekli Ekran Görüntüleri

Play Console minimum 2, önerilen 4-8 telefon ekran görüntüsü ister. Önerilen kadraj listesi:

1. Günlük bulmaca — oyun ekranı, birkaç tahmin yapılmış, renkli (doğru/yanlış/yanlış-yerde)
   geri bildirim görünür halde.
2. Kazanma ekranı / günlük sonuç özeti (seri, istatistik, paylaş butonu).
3. Kelime uzunluğu seçim ekranı (4/5/6 harf).
4. Sınırsız mod — oyun içi ekran.
5. Tema seçimi — açık/koyu/yüksek kontrast karşılaştırması (tek görselde ikiye bölünmüş veya
   galeri halinde ayrı ayrı).
6. İstatistikler ekranı (seri, tahmin dağılımı).

Ayrıca gerekli:
- **Uygulama simgesi** (512x512 PNG, yüksek çözünürlük) — bu birimde üretilen
  `apps/mobile/assets/icon.png` kaynağından ölçeklenebilir.
- **Öne çıkan grafik (feature graphic)** 1024x500 PNG — [SAHİP: bu birimde üretilmedi, pazarlama
  görseli olarak ayrıca hazırlanmalı; `apps/frontend/public/og-image.svg` referans alınabilir
  ancak marka renkleri `packages/ui-tokens/tokens.json` ile hizalanmalı.]
- [SAHİP: Ekran görüntülerinin gerçek cihaz/emülatör çekimleri bu birimde üretilmedi — Phase 3
  (emülatör testi, `docs/guides/mobile-run.md`) sırasında alınabilir.]
- [SAHİP: Tablet ekran görüntüleri isteğe bağlıdır; mobil uygulama şu an yalnızca telefon/portrait
  için optimize, bu nedenle lansmanda atlanabilir.]

## Diğer Liste Alanları — Kontrol Listesi

- **Geliştirici adı:** Halil Enes Özdemir
- **İletişim e-postası:** destek@harfhane.app
- **Gizlilik politikası URL'si:** https://harfhane.app/gizlilik — [SAHİP: web uygulamasının
  `/gizlilik` rotası (`apps/frontend/src/components/PrivacyPage.tsx`) henüz
  `docs/drafts/gizlilik-politikasi.md`'deki güncel metni yansıtmıyor olabilir; yayından önce
  sayfa içeriğinin güncel taslakla eşleştiğini doğrulayın.]
- **Web sitesi:** https://harfhane.app
- **Uygulama kategorisi için etiketler/anahtar kelimeler:** kelime oyunu, Türkçe, günlük bulmaca,
  kelime bulmaca — [SAHİP: Play Console başlık/açıklama dışında ayrı bir anahtar kelime alanı
  sunmaz; bu liste yalnızca açıklama metnini optimize etmek için referanstır.]

## Uygulama ayarları cevapları

Play Console'daki "Uygulama içeriği" (App content) formlarının taslak cevapları. Bunlar nihai
gönderim değildir; Play Console üzerinde owner tarafından teyit edilip gönderilmelidir.

- **Uygulama erişimi (App access):** Tüm işlevler girişsiz kullanılabilir — "Tüm işlevler
  kısıtlama olmadan kullanılabilir" (kayıt/giriş gerekmiyor; `docs/decisions/2026-10-05-mvp-scope-cut.md`).
- **Reklamlar (Ads):** Hayır, uygulama reklam içermiyor (Invariant 8).
- **İçerik derecelendirmesi anketi (IARC):** Oyun kategorisi; şiddet yok, cinsel içerik yok,
  kaba dil/çıplaklık yok, kumar simülasyonu yok, kullanıcı tarafından oluşturulan içerik yok,
  kullanıcılar arası etkileşim yok (hesap olmadığı için sohbet/paylaşım uygulama içi değil, yalnızca
  cihazın kendi paylaşım menüsü üzerinden metin paylaşımı), konum paylaşımı yok, satın alma yok.
  Beklenen sonuç: IARC "Everyone" / PEGI 3 dengi — [SAHİP: anketi Play Console'da bizzat doldurup
  teyit edin, bu sadece öneridir].
- **Hedef kitle (Target audience):** 13-15, 16-17 ve 18+ yaş grupları işaretlenmeli; 13 yaş altı
  gruplar işaretlenmemeli. Uygulama çocuklara yönelik tasarlanmamıştır, bu nedenle Google Play
  Families politikası kapsamına girmemelidir.
- **Haber uygulaması (News app):** Hayır.
- **Kategori:** Oyunlar (Games) → Kelime (Word).
- **Etiket önerileri:** kelime oyunu, Türkçe kelime oyunu, günlük bulmaca, kelime bulmaca,
  zihin oyunu.
