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
mod, Wordle benzeri ama Türkçe harflere uygun). Google Play'de "kapalı test" aşamasındayım
ve denemek isteyen birkaç kişiye ihtiyacım var.

Katılmak için gereken tek şey bir Gmail hesabı (Play Store için gerekli). Aşağıdaki Google
Grup'a katıl: [GRUP LİNKİ] (veya bana Gmail adresini yaz, listeye ekleyeyim).

Gruba eklendikten sonra sana bir Play Store linki geleceğinde, o linkten uygulamayı normal
bir uygulama gibi indirip kurabilirsin.

Ricam: Önümüzdeki 14 gün içinde en az 10 gün uygulamayı aç ve bir bulmaca çöz (günde 2-3
dakika yeterli). Google'ın test süresini "aktif" sayması için düzenli açılması gerekiyor.

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

**Hedef: 15-20 tester** (Play Console'un asgari şartı 12'dir, ama pay bırakılmalı).

Gerekçe: bir testerin günlük açma serisi kesilirse (14 günlük pencerede düzenli
açmazsa), bazı anlatımlara göre o testerin "aktif gün" sayacı sıfırlanabilir veya o tester
asgari 12 sayısına dahil edilmeyebilir — **bu, doğrulanmamış, üçüncü taraf bir iddiadır**
(resmi Google Play dokümantasyonunda bu "sıfırlama" davranışı bu ayrıntı düzeyinde teyit
edilmemiştir); temkinli davranmak için 12'nin üzerinde pay bırakmak düşük maliyetli bir
önlemdir. [SAHİP: lansmandan önce Play Console'un güncel "kapalı test" kurallarını resmi
yardım sayfasından teyit edin.]

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
