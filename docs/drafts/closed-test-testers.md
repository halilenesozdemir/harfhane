> **TASLAK — sahibi tarafından gözden geçirilmeli ve onaylanmalıdır.**
> Bu metin, Play Console kapalı test (closed test) aşaması için davet mesajı ve sahip
> kontrol listesidir (Plan 004 U10, `docs/roadmap.md` Phase 4). İlk sürüm ücretsizdir, reklamsızdır,
> hesap gerektirmez (`docs/decisions/2026-10-06-free-launch.md`,
> `docs/decisions/2026-10-05-mvp-scope-cut.md`). "12 testers × 14 days" gereksinimi
> `docs/roadmap.md`'de kayıtlıdır; aşağıdaki test süresi doğrulama detayları (örn. inaktivite
> sayacı sıfırlar mı) doğrulanmamış üçüncü taraf iddialarıdır ve ayrıca işaretlenmiştir.

# Kapalı Test — Davet Mesajı ve Kontrol Listesi

## Davet mesajı (WhatsApp / LinkedIn için — düz metin, emoji yok)

```
Selam,

Harfhane adında bir Türkçe kelime oyunu üzerinde çalışıyorum (günlük bulmaca + sınırsız
mod, Türkçe harflere uygun). Google Play'de "kapalı test" aşamasındayım
ve denemek isteyen birkaç kişiye ihtiyacım var.

Katılmak için gereken tek şey bir Gmail hesabı (Play Store için gerekli). Aşağıdaki Google
Grup'a katıl: [GRUP LİNKİ] (veya bana Gmail adresini yaz, listeye ekleyeyim).

Gruba eklendikten sonra sana bir Play Store linki geleceğinde, o linkten uygulamayı normal
bir uygulama gibi indirip kurabilirsin.

Ricam: Google Grup'tan/testten 14 gün boyunca çıkmadan (opt-out etmeden) devam et — asıl şart bu.
Ayrıca, gerçek geri bildirim için önümüzdeki 14 gün içinde ara sıra (günde 2-3 dakika yeterli)
uygulamayı açıp bir bulmaca çözersen çok iyi olur.

Bir şey bozuksa, kafan karışırsa veya önerin olursa bana doğrudan yaz — ekran görüntüsü
atman çok yardımcı olur. Teşekkürler.
```

[SAHİP: `[GRUP LİNKİ]` alanını Google Grup oluşturulduktan sonra doldurun; mesajı
WhatsApp/LinkedIn'e kopyalarken kişiye göre küçük uyarlamalar yapılabilir.]

## Geri bildirim nasıl gönderilir (teste katılanlara ayrıca iletilecek)

```
Geri bildirim için en kolay yol: bana doğrudan mesaj (WhatsApp/LinkedIn) veya
destek@harfhane.app adresine e-posta. Şunları belirtmen yeterli:
- Ne yapmaya çalışıyordun, ne oldu, ne beklerdin.
- Telefon modeli (varsa).
- Mümkünse ekran görüntüsü.
```

## Sahip için kontrol listesi

### Google Grup mu, e-posta listesi mi?

**Öneri: Google Grup** (örn. `harfhane-test@googlegroups.com`, grup adı `harfhane-test`).

Nedenler:
- Play Console'un kapalı test "e-posta listesi" alanı bir Google Grup veya tek tek Gmail
  adresleri kabul eder; Google Grup, test listesini uygulama dışında (Play Console dışında)
  tek bir yerden yönetmeyi sağlar — yeni tester eklemek/çıkarmak için her seferinde Play
  Console'a girmek gerekmez.
- Grup üyeliği, testerin kendi isteğiyle katılmasını kolaylaştırır (davet linkiyle); e-posta
  listesi ise her adresi owner'ın tek tek Play Console'a girmesini gerektirir.
- Grup linki paylaşılabilir davet mesajına (yukarıdaki metin) doğrudan eklenebilir.

### Tester sayısı hedefi

**Hedef: 18-20 tester** (Play Console'un asgari şartı 12'dir, pay bırakılmalı).

Gerekçe — resmi kural (Google Play Console yardım sayfası, kontrol edildi 2026-10-24,
https://support.google.com/googleplay/android-developer/answer/14151465): production erişimi
için başvuru anında en az 12 tester kapalı teste kayıtlı olmalı ve bu testerler **önceki 14 gün
boyunca sürekli** kayıtlı kalmış olmalı. 14 günden az süreyle test edip teste ara veren testerler
asgari şarta sayılmaz; bir tester teste ara verip sonra yeniden katılırsa, sayılabilmesi için
14 günün **kesintisiz (ardışık)** olması gerekir — yani ara veren bir tester sayaç sıfırlanmış
gibi yeniden 14 gün boyunca kesintisiz kalmalıdır. 18-20 hedefi bu kesintisizlik riskine karşı
(birkaç testerin pencere içinde ara vermesi ihtimaline) pay bırakır.

Not: testerin pencere boyunca uygulamayı **gerçekten açıp oynaması** resmi "aktif sayılma"
şartı değildir (şart sadece opt-in'in kesintisiz kalmasıdır), ama geri bildirim kalitesi için
hâlâ önerilir — bkz. aşağıdaki hatırlatma planı ve geri bildirim formu.

### Gün gün hatırlatma planı (14 günlük pencere)

- **Gün 0:** Davet mesajı gönderilir, Google Grup linki paylaşılır, Play Store linki
  gruba eklenen herkese Play Console üzerinden otomatik ulaşır.
- **Gün 1-2:** Gruba katılan ama henüz indirmeyen kişilere kısa bir hatırlatma ("link
  çalışıyor mu, bir sorun var mı?").
- **Gün 5:** Ara kontrol — kaç kişi aktif oynuyor, Play Console'da "aktif tester" sayısı
  12'nin üzerinde mi diye bakılır. Düşükse ek davet gönderilir.
- **Gün 7 (yarı yol):** Herkese kısa bir hatırlatma: "yarı yoldayız, bugün bir bulmaca
  çöz" + geri bildirim hatırlatması.
- **Gün 10-12:** Son hatırlatma — henüz 10 günü doldurmayanlara öncelikli mesaj
  ("14 günün bitmesine az kaldı, bugün aç").
- **Gün 14:** Pencere kapanır; Play Console'da aktif tester/gün sayıları kontrol edilip
  production erişimi başvurusu için yeterli olup olmadığına bakılır (gerekirse pencere
  owner tarafından uzatılır veya yeni tester eklenir).

[SAHİP: Play Console'da gerçek "aktif tester" ve "gün" sayaçlarının nasıl göründüğünü
kapalı test başladıktan sonra teyit edin; bu plan varsayımsaldır.]

### Kapalı test geri bildirim formu

14 günlük pencere boyunca üç kez (gün 3, 7 ve 12) testerlere gönderilecek kısa bir Google
Form, aşağıdaki 4 soruyu içerir:

1. Bu hafta hangi özellikleri kullandın? (günlük bulmaca, sınırsız mod, tema değiştirme, paylaşım)
2. Karşılaştığın bir hata veya bozukluk var mı? Varsa açıklar mısın?
3. Garip veya tanımadığın bir kelimeyle karşılaştın mı? Hangi kelime(ler)?
4. Uygulamayı yarın da açar mısın? (Evet / Hayır / Belki — neden?)

Bu dört soru, production erişimi anketinin ("About your closed test" bölümü) istediği bilgiyi
besler (Google Play Console yardım sayfası, kontrol edildi 2026-10-24,
https://support.google.com/googleplay/android-developer/answer/14151465):

- **Bölüm 1 — Kapalı test hakkında:** tester toplamanın ne kadar kolay/zor olduğu, tester
  katılımı (hangi özellikler kullanıldı, davranış üretim kullanıcısına ne kadar benziyor) ve
  alınan geri bildirimin özeti ile nasıl toplandığı. → form soruları 1 ve 4 bu bölümü besler.
- **Bölüm 2 — Uygulama/oyun hakkında:** hedef kitle, uygulamanın değer önerisi/benzersizliği,
  ilk yıl tahmini kurulum aralığı. → bu doküman dışında owner tarafından doldurulur.
- **Bölüm 3 — Production hazırlığı hakkında:** kapalı testten öğrenilenlere göre yapılan
  değişiklikler, production'a hazır olunduğuna nasıl karar verildiği. → form soruları 2 ve 3,
  aşağıdaki "değişiklik günlüğü" ile birlikte bu bölümü besler.

### Değişiklik günlüğü şablonu

Her form turundan sonra (gün 3, 7, 12) owner tarafından doldurulacak, production erişimi
anketinin 3. bölümüne kaynak olacak kısa günlük:

```
## [Tarih] — Gün [3/7/12] geri bildirim turu

- Alınan geri bildirim özeti:
- Yapılan değişiklik(ler) (varsa commit/PR linki):
- Değişiklik yapılmadıysa neden (örn. düşük öncelik, tek kişilik rapor):
```
