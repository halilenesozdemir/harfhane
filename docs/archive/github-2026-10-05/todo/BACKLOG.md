# Harfhane — Backlog

> Öncelik sırası: P0 (kritik) → P1 (yüksek) → P2 (orta) → P3 (düşük / nice-to-have)

---

## Kullanıcı Deneyimi

| # | Başlık | Öncelik | Notlar |
|---|--------|---------|--------|
| U1 | Onboarding: İlk kez gelen kullanıcıya tutorial overlay | P1 | HowToPlayModal var ama otomatik gösterilmiyor. Sadece bir kez göster. |
| U2 | Kelime sonucunda "Tanımı kaydet" — kişisel sözlük | P2 | Kullanıcı beğendiği kelimeleri profiline kaydedebilsin |
| U3 | Profil sayfası — rozet vitrini + istatistik grafiği | P2 | ProfileModal var ama minimal. Win/loss chart eklenebilir. |
| U4 | İpucu sistemi: Kelime kategorisini göster (harf hakkı karşılığında) | P2 | Mevcut category alanı kullanılabilir |
| U5 | Animasyon: Harf girişinde hafif bounce, yanlış tahminde shake | P2 | CSS animation ile, Tailwind config'e eklenecek |
| U6 | Keyboard haptic feedback (mobile vibration API) | P3 | `navigator.vibrate()` — kısa titreşim |

---

## Retention & Engagement

| # | Başlık | Öncelik | Notlar |
|---|--------|---------|--------|
| R1 | Push notification: Günlük kelime hatırlatıcısı | P1 | Push altyapısı var (`/push/subscribe`). Backend'de cron var. İçerik eklenecek. |
| R2 | Email digest: Haftalık istatistik özeti | P2 | Resend entegrasyonu var. Şablon + cron gerekiyor. |
| R3 | Streak freeze token kazan: Her 5. gün oyna | P2 | Şu an nasıl kazanılıyor belirsiz. Gamification logic'e eklenecek. |
| R4 | "Haftanın kelimesi" özel etkinliği | P3 | Özel badge + paylaşım kartı |
| R5 | Oyun bittikten sonra "Kelimeyi arkadaşına meydan oku" — challenge linki daha belirgin | P2 | Challenge link mevcut ama bulmak zor |

---

## Sosyal & Sıralama

| # | Başlık | Öncelik | Notlar |
|---|--------|---------|--------|
| S1 | Haftalık / aylık liderboard (şu an sadece all-time) | P1 | Farklı `period` filtresi yeterli |
| S2 | Arkadaş ekleme / takip sistemi | P3 | `social-repository.ts` var ama frontend'de kullanılmıyor |
| S3 | Günlük kelime yorumları sayfası | P2 | `CommentSection.tsx` mevcut, route yok |

---

## Admin & İçerik

| # | Başlık | Öncelik | Notlar |
|---|--------|---------|--------|
| A1 | Admin: Otomatik program — N gün için rastgele kelime seç | P1 | Tek tıkla boş günleri doldursun |
| A2 | Admin: Kelime istatistiği — en çok denenen, en çok kazandıran | P2 | `game_results` tablosundan JOIN query |
| A3 | Admin: Kullanıcı listesi — son giriş, oyun sayısı | P2 | Moderasyon için gerekli |
| A4 | Admin: Push notification gönder (broadcast) | P3 | Özel duyuru için |

---

## Teknik Borç

| # | Başlık | Öncelik | Notlar |
|---|--------|---------|--------|
| T1 | Şifre sıfırlama akışı (forgot password) | P1 | Resend + token tablosu gerekiyor. Email-only kullanıcılar için kritik. |
| T2 | Hesap silme (GDPR) | P1 | `/auth/delete` endpoint + cascade delete |
| T3 | Token yenileme (refresh token) | P2 | Şu an 30 günlük JWT. Expiry'den önce sessiz yenileme. |
| T4 | Backend test coverage artırma | P2 | Routes ve services için test eksik. Min %80 hedef. |
| T5 | Rate limiting — auth ve game endpoints | P2 | Hono middleware ile IP-based |
| T6 | `GamePage.tsx` parçalara bölünmesi (248 satır, limitte) | P2 | Okunabilirlik ve test için |
| T7 | CSP headers (Content Security Policy) | P3 | Wrangler Worker'dan header inject |

---

## SEO & Büyüme

| # | Başlık | Öncelik | Notlar |
|---|--------|---------|--------|
| E1 | Blog / kelime sayfaları — her günlük kelime için kalıcı URL | P2 | `/kelime/SABIR` → SEO + organik trafik |
| E2 | Open Graph image dinamik üretim (Cloudflare Workers + Satori) | P3 | Her kelime için özel OG image |
| E3 | Google Search Console kaydı + sitemap submit | P1 | Sitemap zaten var, sadece submit gerekiyor |

---

## Önerilen Sıradaki Sprint

**Sprint 1 (Retention odaklı):**
1. R1 — Push notification içerik (backend cron zaten var)
2. A1 — Admin otomatik program
3. S1 — Haftalık liderboard

**Sprint 2 (Teknik borç + güvenlik):**
1. T1 — Şifre sıfırlama
2. T2 — Hesap silme
3. T5 — Rate limiting

**Sprint 3 (Büyüme):**
1. E3 — Search Console
2. U1 — Onboarding tutorial
3. E1 — Kelime sayfaları (SEO)
