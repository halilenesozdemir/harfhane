> **TASLAK — sahip onayı bekliyor.** Bu doküman Google Play Console'daki "Data safety" (Veri
> güvenliği) formunu doldurmak için hazırlanmıştır; kod tabanının 2026-10-24 tarihli incelemesine
> dayanır. Köşeli parantez `[...]` alanları sahip tarafından doldurulmalı/onaylanmalıdır.
> Kaynak: Google'ın resmi yardım sayfası, https://support.google.com/googleplay/android-developer/answer/10787469
> (2026-10-24'te WebFetch ile okundu).

# Google Play Data Safety — veri envanteri ve taslak cevaplar

## 0. Kapsam ve bağlam

Harfhane'nin MVP'si **hesapsız**: Google sign-in, profil, push bildirim, e-posta hatırlatma, XP/
rozet/seri dondurma, liderlik tablosu, düello, turnuva ve özel kelime listeleri kaldırıldı
(`docs/decisions/2026-10-05-mvp-scope-cut.md`). Satın alma da yok (`docs/decisions/
2026-10-06-free-launch.md`) — RevenueCat/Google Play satın alma veri paylaşımı bu sürümde
**geçerli değil**.

Eski hesap verilerini tutan 14 tablo `apps/backend/db/migrations/0003_drop_removed_features.sql`
ile düşürülmüştü ve bu migration **2026-10-24'te sahip onayıyla uzak `harfhane` D1
veritabanına uygulandı** (Invariant 4; `docs/backlog.md` "Drop migration" bölümü,
`docs/runbooks/apply-0003-drop-removed-features.md`). Uygulama öncesi `users` tablosu 0 satır
içeriyordu; uygulama sonrası tetikleyiciler (4) ve `words` satır sayısı (346) kontrol edildi,
`sqlite_sequence` değişmedi. Yani üretim veritabanında artık **eski hesap verisine ait hiçbir
tablo kalmadı**.

## 1. Veri envanteri tablosu

| Veri türü | Toplanıyor mu? | Paylaşılıyor mu? | Nerede | Kanıt |
| --- | --- | --- | --- | --- |
| Hesap/kimlik bilgisi (ad, e-posta, şifre, Google ID) | **Hayır** (MVP'de hesap yok) | Hayır | — | `docs/decisions/2026-10-05-mvp-scope-cut.md`; `apps/mobile/package.json` (auth/Google SDK'sı yok) |
| Oyun durumu (tahminler, ipucu pozisyonları) | Evet, **sadece cihazda** | Hayır | Cihaz (AsyncStorage) | `apps/mobile/src/game/device-store.ts:1-5`; `apps/mobile/src/game/game-storage.ts:60-86` |
| İstatistikler (seri, kazanma sayısı, dağılım) | Evet, **sadece cihazda** | Hayır | Cihaz (AsyncStorage) | `apps/mobile/src/stats/stats.ts:123-141` (anahtar `harfhane:stats:*`, `harfhane:unlimited:stats:*`) |
| Titreşim (haptics) tercihi | Evet, **sadece cihazda** | Hayır | Cihaz (AsyncStorage) | `apps/mobile/src/lib/useHapticsSettings.ts:6-7,30-36` (anahtar `harfhane:haptics`) |
| Günün kelimesi / rastgele kelime isteği (`GET /words/daily`, `/words/random`, `/words/lengths`) | Evet, istek anında | Hayır (3. tarafa değil) | Sunucu (Cloudflare Worker, anlık) | `apps/mobile/src/lib/api.ts:63-67` |
| Tahmin edilen kelime metni (`POST /words/validate`) | Evet, istek anında | Hayır | Sunucu (Cloudflare Worker, anlık) | `apps/mobile/src/lib/api.ts:65` — gönderilen gövde `{ word }`; sunucu tarafında D1'e **yazılmaz**, sadece sözlükte arama yapılır (`apps/backend` route→service→repository, kalıcı günlük tutmaz — bkz. aşağıdaki backend kanıtları) |
| IP adresi (istek sınırlama / rate limiting amaçlı) | Evet, **geçici, bellekte** | Hayır | Sunucu (Worker'ın geçici belleği, 60 sn pencere) | `apps/backend/src/middleware/rate-limiter.ts:9-18` (`CF-Connecting-IP` / `X-Forwarded-For` okunur, `Map` içinde sayılır, D1'e yazılmaz); uygulandığı yollar: `apps/backend/src/index.ts:38` (`/api/words/*`), `apps/backend/src/routes/words.ts:50` (`/validate`) |
| Cloudflare platform erişim günlükleri (IP, User-Agent) | Cloudflare platformu, uygulama kodu değil | Belirsiz — Cloudflare hesap ayarına bağlı | Cloudflare (kod tabanından görünmez) | `apps/backend/wrangler.toml` — `[observability]`/`logpush`/`analytics_engine` **yok**; yani uygulama bunu açıkça etkinleştirmiyor, ama Cloudflare hesap düzeyinde varsayılan günlükler kod dışı bir ayar |
| Analitik/çökme raporlama (crash/analytics SDK) | **Hayır** | — | — | `apps/mobile/package.json` — `expo`, `expo-constants`, `expo-font`, `expo-haptics`, `expo-splash-screen`, `expo-status-bar`, `@react-native-async-storage/async-storage`, `lucide-react-native`, `react-native-safe-area-context`, `react-native-svg` dışında bağımlılık yok; Sentry/Crashlytics/Google Analytics/Mixpanel yok |
| Paylaşım metni (`Share.share`) | Hayır (uygulama tarafında) | Kullanıcının kendi seçtiği hedefe, OS üzerinden | Cihaz → OS paylaşım sayfası | `apps/mobile/src/components/GameOverCard.tsx:2,105` — React Native'in yerel `Share.share()` API'si çağrılıyor; Harfhane bu paylaşımın hedefini görmez/kaydetmez |
| Geri bildirim mesajı ve isteğe bağlı iletişim bilgisi (`POST /api/feedback`, 2026-10-24'te eklendi) | Evet, **kalıcı** (D1'de saklanır) | Hayır — yalnızca işleyen (processor): Resend, e-postayı sahibin kutusuna iletmek için | Sunucu (Cloudflare D1 `feedback` tablosu) + e-posta (Resend üzerinden destek@harfhane.app) | `apps/backend/db/migrations/0004_feedback.sql` (tablo tanımı, IP/cihaz kimliği kolonu yok); `apps/backend/src/services/feedback-service.ts` (depola-sonra-e-posta-dene akışı); `apps/backend/src/utils/feedback-email.ts` (Resend çağrısı); `apps/backend/src/schemas/feedback-schemas.ts` (mesaj ≤1000, iletişim ≤200 karakter) |
| Android izinleri (manifest, `expo config --type introspect`) | — | — | Cihaz | **PR #173'e bağlı** (şu an `main`'e merge edilmemiş açık PR, `fix/block-storage-permissions`): `apps/mobile/app.json`'da `android.blockedPermissions` artık `VIBRATE`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` ve `SYSTEM_ALERT_WINDOW`'u engelliyor. EAS build üzerinde `aapt2 dump permissions` ile doğrulama: düzeltmeden önce manifestte `INTERNET`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` ve `SYSTEM_ALERT_WINDOW` vardı; düzeltmeden sonra `npx expo config --type introspect` çıktısında sadece `INTERNET` kalıyor (`VIBRATE`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` artık `blockedPermissions` listesinde). Kanıt: `apps/mobile/app.json` (PR #173 diff'i). |
| Eski hesap verileri (e-posta, kullanıcı adı, şifre özeti, Google ID, oyun sonuçları, XP/rozet, push aboneliği, kelime listeleri, yorumlar, düello/turnuva sonuçları) | **Hayır — tablolar kaldırıldı** | Hayır | — (artık yok) | `apps/backend/db/migrations/0003_drop_removed_features.sql` (14 tabloyu düşüren migration) **2026-10-24'te uzak `harfhane` D1'e sahip onayıyla uygulandı**; ön kontrol `users=0`, son kontrol 4 tetikleyici + `words=346`, `sqlite_sequence` değişmedi; `docs/backlog.md` "Drop migration" bölümü |

## 2. Play "Data safety" formu — taslak cevaplar

### 2.1 "Does your app collect or share any of the required user data types?"

**Taslak cevap: Evet** — uygulama, kelime doğrulama isteği sırasında kullanıcının yazdığı
tahmin metnini ve istek sınırlama için IP adresini işlemeye devam ediyor; Google'ın tanımına göre
bu "collection" sayılır (cihaz dışına veri gidiyor), "ephemeral/geçici işleme" istisnası sadece
**paylaşım (sharing)** tarafı için rahatlık sağlıyor, toplama beyanını kaldırmıyor. "Hayır, hiç
veri toplanmıyor" seçeneği **yanlış** olur.

Google'ın kategorileştirmesine göre eşleme:

| Google kategorisi | Alt tür | Harfhane'de karşılığı | Toplanıyor mu | Paylaşılıyor mu | Zorunlu mu / amaç |
| --- | --- | --- | --- | --- | --- |
| App activity | Other user-generated content / Other actions | Tahmin edilen kelime metni (`/words/validate` gövdesi) | Evet | Hayır | Uygulama işlevselliği (App functionality); ambalaj: isteğe bağlı değil, oyunun temel işlevi |
| App activity | Other user-generated content | Geri bildirim/kelime bildirimi mesajı (`feedback.message`, `POST /api/feedback`) | Evet | Hayır — Resend yalnızca bir işleyen (processor); Google'ın tanımına göre (https://support.google.com/googleplay/android-developer/answer/10787469) bir hizmet sağlayıcıya iletim "sharing" sayılmaz | İsteğe bağlı (kullanıcı kendi seçimiyle gönderir); amaç: App functionality + Developer communications |
| Personal info | Email address / other info | İsteğe bağlı iletişim bilgisi (`feedback.contact`), kullanıcı yazarsa (serbest metin, bir e-posta olabilir ama zorunlu değil) | Evet, yalnızca kullanıcı doldurursa | Hayır (yalnızca Resend, processor) | İsteğe bağlı; amaç: App functionality + Developer communications (kullanıcıya geri dönüş yapabilmek için) |
| Device or other IDs | Device or other IDs | **Yok** — kalıcı cihaz/reklam kimliği (Advertising ID, Android ID) hiç okunmuyor/gönderilmiyor | Hayır | Hayır | — |
| Personal info | Name, email, user IDs, vb. | **Yok** — hesap yok | Hayır | Hayır | — |
| Financial info | Purchase history, payment info | **Yok** — satın alma yok (free launch, Plan 005 ertelendi) | Hayır | Hayır | — |
| Location | Approximate/precise location | **Yok** — konum izni istenmiyor, konum API'si kullanılmıyor | Hayır | Hayır | — |
| App info and performance | Crash logs, diagnostics | **Yok** — crash/analytics SDK'sı yok | Hayır | Hayır | — |
| Web browsing | — | **Yok** | Hayır | Hayır | — |

IP adresi için not: Google'ın resmi formunda IP adresi genellikle "Device or other IDs" ya da
"App activity" altında ayrı bir satır olarak değil, **anlık/geçici (ephemeral) kötüye kullanım
önleme** istisnası kapsamında değerlendirilebilir (işlenme amacı sadece rate limiting, bellekte
60 saniye, D1'e yazılmıyor). [SAHİP KONTROL ETMELİ: Play Console formunda bu tam olarak hangi
kutucuğa denk geldiğini form doldururken teyit edin — bu doküman eşlemeyi öneriyor, formun kendi
arayüzü nihai karardır.]

### 2.2 "Is all of the user data collected by your app encrypted in transit?"

**Taslak cevap: Evet.** `apps/mobile/src/lib/api.ts:9` — `DEFAULT_API_URL =
'https://api.harfhane.app/api'` (HTTPS); `apps/backend/wrangler.toml` route'u
`api.harfhane.app` üzerinden Cloudflare Workers'a bağlanıyor, Cloudflare zorunlu olarak TLS
sağlıyor. Kod tabanında `http://` ile sabit kodlanmış bir üretim adresi yok (yalnızca
`apps/mobile/src/lib/api.test.ts` test dosyasında sahte adresler olabilir — üretim davranışını
etkilemez).

### 2.3 "Do you provide a way for users to request that their data is deleted?"

**Taslak cevap: Evet — ama mevcut mekanizma belirsiz, netleştirilmeli.**
- Cihazdaki veriler (oyun durumu, istatistikler, titreşim tercihi): kullanıcı uygulamayı kaldırarak
  veya Android'in "Uygulama verilerini temizle" (Clear storage) özelliğiyle kendi başına siler;
  Harfhane'nin sunucusunda bu veriye dair bir kopya yok, silinecek bir şey de yok.
- Sunucu tarafında **anlık işlenen** tahmin metni ve IP zaten kalıcı değil (D1'e yazılmıyor,
  bellekte 60 sn), "silme talebi" kavramı buraya pratikte uygulanamıyor.
- Geri bildirim/kelime bildirimi (`feedback` tablosu, 2026-10-24'te eklendi) **kalıcıdır** ve
  silme kendiliğinden otomatik değildir: sahip, değerlendirildikten sonra satırı (ve e-posta
  kutusundaki kopyayı) elle siler; kullanıcı destek@harfhane.app'e yazarak silme talep edebilir
  (`apps/backend/src/services/feedback-service.ts`, `docs/plans/
  2026-10-24-013-feat-in-app-feedback-plan.md` "Data safety impact" — bu plan hesap olmadığından
  kimlik doğrulanacak bir self-service silme uç noktası tanımlamıyor).
- Eski hesap verileri için PrivacyPage.tsx halihazırda bir e-posta kontak noktası taslağı içeriyor
  ("Önceki Sürümde Hesap Açtıysanız" bölümü) ama **gerçek bir e-posta adresi veya form linki henüz
  yok** ([İLETİŞİM E-POSTASI] placeholder).
- Google Play, uygulama hesapsız olsa da **"veri silme" sorusuna cevap vermeyi** ve bir web
  bağlantısı sağlamayı zorunlu kılabilir (hesabı olmayan kullanıcı için de bir "talep" yolu
  istenebilir). [SAHİP KONTROL ETMELİ: en az bir çalışan iletişim e-postası veya form linki
  yayına girmeden önce eklenmeli; Play Console'un "deletion request" alanı bu linki ister.]

## 3. Gizlilik sayfası doğruluk kontrolü (`apps/frontend/src/components/PrivacyPage.tsx`)

Bu dosya **henüz yayınlanmamış bir taslak** (`noIndex`, Settings/footer'a bağlı değil — Plan 007
U5/U6). Kod ile karşılaştırma:

| Satır / iddia | Durum | Not |
| --- | --- | --- |
| `PrivacyPage.tsx:48-50` — "hesap, giriş, profil yoktur" | **Doğru** | `docs/decisions/2026-10-05-mvp-scope-cut.md` ile uyumlu |
| `PrivacyPage.tsx:53-57` — oyun durumu/istatistik cihazda (AsyncStorage/localStorage) | **Doğru** | `apps/mobile/src/game/device-store.ts`, `apps/mobile/src/stats/stats.ts` ile birebir eşleşiyor |
| `PrivacyPage.tsx:65-69` — `/words/daily`, `/words/random`, `/words/lengths`, `/words/validate` istekleri, isim/e-posta/hesap gönderilmiyor | **Doğru** | `apps/mobile/src/lib/api.ts:63-67` ile eşleşiyor |
| `PrivacyPage.tsx:71-76` — IP, rate limiting için bellekte 1 dakika, D1'e yazılmıyor | **Doğru, kanıtlanmış** | `apps/backend/src/middleware/rate-limiter.ts:9-18` ile birebir (pencere 60 sn = `GAME_WINDOW_MS`, maks. 30 istek = `GAME_MAX_HITS`) |
| `PrivacyPage.tsx:86-89` — Google Play üzerinden indirme/çökme verisini Google kendi başına işler | **Muhtemelen doğru ama eksik kanıt** | Uygulamanın kendi crash SDK'sı yok (doğrulandı), ama Play Store'un platform-düzeyi ANR/crash raporlaması her Android uygulaması için varsayılan olarak işler — bu, kod tabanından doğrulanamaz, Google'ın kendi politikasına dayanır. Metin bunu doğru şekilde "Harfhane'den bağımsız" olarak çerçeveliyor. |
| `PrivacyPage.tsx:92-93` — reklam yok, 3. taraf analitik/takip yok, cookie yok | **Doğru** | `apps/mobile/package.json`'da analitik/reklam SDK'sı yok; `apps/backend` grep sonucu: analytics/sentry/logpush/telemetry için sıfır eşleşme |
| `PrivacyPage.tsx:102-118` — eski hesap verileri kaldırılmadı, silme hazır ama sahip onayı bekliyor | **Artık güncel değil — veriler zaten silindi** | `apps/backend/db/migrations/0003_drop_removed_features.sql` 2026-10-24'te sahip onayıyla uzak D1'e uygulandı (Invariant 4); bu paragraf artık "silme bekleniyor" demek yerine "eski hesap verisi kalmadı" demeli — PrivacyPage.tsx'e dokunulmadı (sahip onayı gerekiyor, Plan 007 U6), ama metin güncellenmeli |
| `PrivacyPage.tsx:78-84`, `150-157` — Cloudflare'in kendi erişim günlükleri kod tabanından belirlenemez | **Doğru** | `apps/backend/wrangler.toml`'da `observability`/`logpush` bloğu yok; bu hesap-düzeyi bir ayar, repo'dan görünmüyor |
| **Eksik: Android izinleri** | **Eksik, PR #173'e bağlı** | PR #173 (`fix/block-storage-permissions`, henüz `main`'e merge edilmedi) `apps/mobile/app.json`'da `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` ve `SYSTEM_ALERT_WINDOW`'u da engelliyor; #173 merge olduktan sonra uygulama yalnızca `INTERNET` istiyor olacak (EAS build + `aapt2 dump permissions` ile düzeltmeden önceki 4 izin doğrulandı; düzeltmeden sonra `npx expo config --type introspect` çıktısında sadece `INTERNET` kalıyor). Sayfa şu an hiçbirinden bahsetmiyor — #173 merge olduktan sonra aşağıdaki önerilen paragraf eklenmeli. |
| **Eksik: `Share.share()` davranışı** | **Eksik** | Sayfa paylaş özelliğinden hiç bahsetmiyor; kullanıcıya "paylaştığınız metin Harfhane'nin kendi sunucusuna gitmez, OS'un paylaşım sayfasına gider" netliği eklenebilir. |
| **Çözüldü: in-app geri bildirim (Plan 013)** | **Artık güncel** | PrivacyPage.tsx, 2026-10-24'te `docs/plans/2026-10-24-013-feat-in-app-feedback-plan.md`'nin eklediği `POST /api/feedback`'i (mesaj, isteğe bağlı iletişim, kind/platform/sürüm, kelime bildirimi alanları), D1 + Resend ile saklama/iletimi, KVKK m.5/1 (açık rıza) hukuki sebebini, silme-talep-üzerine saklama süresini ve Resend'in yurt dışı aktarımını içerecek şekilde güncellendi (`apps/frontend/src/components/PrivacyPage.tsx`, `apps/frontend/src/components/PrivacyPage.test.tsx`). |
| **Çözüldü: eski `docs/drafts/gizlilik-politikasi.md` taslağı** | **Arşivlendi** | Bu dosya 2026-10-05 tarihli, MVP kapsam kesintisinden **önceki** mimariyi anlatıyordu: hesap, Google sign-in, Resend e-posta, push, XP/rozet, Google Fonts 3. taraf yüklemesi vb. — hepsi artık yanlış/kaldırıldı. Yanlışlıkla "gerçek" metin olarak kullanılma riskini kaldırmak için `docs/archive/gizlilik-politikasi-2026-10-24.md`'ye taşındı, başına bir arşiv notu eklendi; PrivacyPage.tsx'in kendisine dokunulmadı. |

### Önerilen değişiklik metinleri (owner onayına kadar PrivacyPage.tsx'e UYGULANMADI)

Aşağıdakiler yalnızca **öneri**; dosyaya hiçbir değişiklik yapılmadı (Plan 007 U6, sahip onayı
gerekiyor):

1. **Android izinleri için önerilen ek paragraf** (İşlenen Veriler bölümüne, IP maddesinden
   sonra; **PR #173'ün `main`'e merge edilmesine bağlı**):
   > Android uygulaması, cihazınızdan yalnızca internet erişimi (`INTERNET`, sunucu
   > isteklerini yapmak için) izni ister. Harici depolama (`READ_EXTERNAL_STORAGE`,
   > `WRITE_EXTERNAL_STORAGE`), titreşim (`VIBRATE`) ve diğer pencerelerin üzerine çizim
   > (`SYSTEM_ALERT_WINDOW`) izinleri — Android/Expo altyapısının varsayılan olarak eklediği
   > ama Harfhane'nin hiç kullanmadığı izinler — uygulama tarafından açıkça engellenmiştir.

2. **`Share.share()` için önerilen ek paragraf:**
   > Sonucunuzu paylaş düğmesine bastığınızda, metin Android'in kendi paylaşım menüsüne
   > (`Share.share()`) iletilir; hangi uygulamayı veya kişiyi seçtiğiniz Harfhane'ye bildirilmez
   > ve sunucularımıza kaydedilmez.

## 4. Sahibe açık sorular

1. ~~**Eski hesap verilerinin silinmesi**~~ — çözüldü: `0003_drop_removed_features.sql`
   2026-10-24'te sahip onayıyla uzak `harfhane` D1'e uygulandı; "eski hesap verisi"
   paragrafı yukarıda kaldırıldı/sadeleştirildi.
2. **İletişim e-postası:** PrivacyPage.tsx ve bu formdaki `[İLETİŞİM E-POSTASI]` yerine geçecek
   gerçek bir adres/form linki lazım — Play Console'un veri silme talebi alanı bunu isteyecek.
3. ~~**`docs/drafts/gizlilik-politikasi.md`**~~ — çözüldü: `docs/archive/
   gizlilik-politikasi-2026-10-24.md`'ye taşındı (bir arşiv notuyla); PrivacyPage.tsx tek
   kaynak olarak kalıyor.
4. **Veri Sorumlusu kimliği:** PrivacyPage.tsx'te `[SAHİP ADI/UNVANI VE ADRESİ]` boş; KVKK ve
   Play Console'un geliştirici bilgisi tutarlı olmalı.
5. **READ/WRITE_EXTERNAL_STORAGE ve SYSTEM_ALERT_WINDOW:** Kaynak modül netleştirilmedi (izni
   ekleyen spesifik modül — örn. `react-native-svg`, `sharp` devDependency'si, ya da React
   Native'in kendi şablonu — `npx expo prebuild` sonrası `AndroidManifest.xml`'e bakmadan
   kesin değil), ama kaynağı ne olursa olsun PR #173 (`fix/block-storage-permissions`, henüz
   `main`'e merge edilmedi) bu üç izni ve `VIBRATE`'i `blockedPermissions`'a ekleyerek
   engelliyor — EAS build + `aapt2 dump permissions` ile düzeltmeden önce bu 4 iznin
   manifestte olduğu, düzeltmeden sonra `npx expo config --type introspect` çıktısında
   sadece `INTERNET` kaldığı doğrulandı. Açık soru artık sadece "#173 ne zaman merge
   edilecek" — bu veri envanteri ve önerilen paragraf, #173 merge olduktan sonraki
   duruma göre yazıldı.
6. **Cloudflare hesap ayarları:** Access log / Logpush / Bot Fight Mode açık mı, ne kadar süreyle
   tutuluyor? Bu, kod tabanından görünmüyor; sadece Cloudflare dashboard'undan teyit edilebilir
   (PrivacyPage.tsx'teki `[SAHİP KONTROL ETMELİ]` notuyla aynı açık soru).
7. **Google Play'in "ephemeral processing" istisnası:** Tahmin metni ve IP'nin "anlık işleme"
   istisnasına girip girmediği, formun kendi arayüzündeki soru metnine göre teyit edilmeli —
   bu doküman bir öneri sunuyor, nihai kayıt Play Console'un kendisidir.

## 5. Doğrulanamayanlar / kapsam dışı bırakılanlar

- Cloudflare hesap düzeyi log/analytics ayarları (dashboard'a erişim gerekir, bu görev local-only).
- `expo prebuild` sonrası tam `AndroidManifest.xml` (yalnızca `npx expo config --type introspect
  --json` çalıştırıldı — bu, dosya sistemine `android/` klasörü oluşturmadan birleşik config'i
  gösteren ucuz bir komut; çıktı: `permissions: [INTERNET, READ_EXTERNAL_STORAGE,
  WRITE_EXTERNAL_STORAGE]`, `blockedPermissions: [VIBRATE]`).
- Google Play Console'un kendi form arayüzündeki soru metinleri (bu doküman Google'ın yardım
  sayfasına dayanıyor, Console'un kendisine erişim yok).
- ~~Uzak D1'in o eski 14 tabloda bugün gerçekten satır olup olmadığı~~ — çözüldü: migration
  2026-10-24'te uygulandı, bu tablolar artık yok.
