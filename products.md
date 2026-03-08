# Nurdle - Product Requirements Document (PRD)

## 📋 Proje Özeti

**Proje Adı:** Nurdle  
**Versiyon:** 2.0.0 (In Development)  
**v1.0.0:** Tamamlandı ve yayında ✅  
**Tarih:** 4 Ocak 2026  
**Durum:** v2.0 Geliştirme Aşamasında

### Proje Açıklaması

Nurdle, popüler Wordle oyunundan esinlenerek Risale-i Nur külliyatındaki kelimelerle oynanan bir kelime tahmin oyunudur. Oyuncular, 6 deneme hakkı ile gizli bir kelimeyi tahmin etmeye çalışırlar. Her tahmin sonrası, harflerin doğru konumda olup olmadığı görsel geri bildirimlerle gösterilir.

**Oyun Modları:**

- **Günlük Mod**: Her gün yeni bir kelime, herkes aynı kelimeyi çözer
- **Sınırsız Mod**: Dilediğin kadar oyna, her seferinde rastgele yeni kelime

### Hedef Kitle

- Risale-i Nur okuyan ve öğrenen kişiler
- Kelime oyunu severler
- Türkçe dil gelişimi için oyun arayanlar
- 12+ yaş grubu kullanıcılar

---

## 📝 Yapılacaklar (MVP - v1.0)

### 1. Proje Kurulumu

- [x] React + Vite projesi oluştur
- [x] Tailwind CSS kurulumu ve konfigürasyonu
- [x] React Query (TanStack Query) kurulumu
- [x] Proje klasör yapısını organize et
  - `/src/components` - React bileşenleri
  - `/src/hooks` - Custom hooks
  - `/src/utils` - Yardımcı fonksiyonlar
  - `/src/data` - Kelime listeleri
  - `/src/styles` - Global stiller
- [x] ESLint ve Prettier konfigürasyonu
- [ ] Git repository oluştur

### 2. Kelime Veritabanı

- [x] Risale-i Nur külliyatından 5 harfli kelimeleri derle
- [x] JSON formatında kelime listesi oluştur (`words.json`)
- [x] Kelime doğrulama listesi hazırla (geçerli kelimeler)
- [x] Günlük kelime listesi oluştur (oynanabilir kelimeler)
- [ ] İlk versiyon için minimum 100 kelime hazırla (şu an ~90 kelime var)

### 3. Temel Oyun Bileşenleri

#### 3.1 Header Component

- [x] Oyun logosu/başlığı
- [x] Bilgi butonu (Nasıl Oynanır)
- [x] İstatistik butonu
- [x] Ayarlar butonu
- [x] Ana sayfaya dönüş (NURDLE yazısına tıklama)
- [x] Mod etiketi gösterimi (Günlük / Sınırsız)

#### 3.0 Ana Sayfa (HomePage)

- [x] Mod seçim ekranı
- [x] Günlük Nurdle butonu
- [x] Sınırsız Mod butonu
- [x] Logo ve başlık
- [x] Modern kart tasarımı

#### 3.2 Game Grid Component

- [x] 6x5 tahmin grid'i oluştur
- [x] Her hücre için Tile component
- [x] Harf girişlerini göster
- [x] Renk kodlama sistemi:
  - 🟩 Yeşil: Doğru pozisyon
  - 🟨 Sarı: Yanlış pozisyon
  - ⬜ Gri: Kelimede yok

#### 3.3 Keyboard Component

- [x] Türkçe Q klavye düzeni
- [x] Özel karakterler: Ö, Ü, Ç, Ş, Ğ, İ
- [x] ENTER ve SİL (Backspace) tuşları
- [x] Klavye tuşlarına renk feedback'i
- [x] Fiziksel klavye desteği

### 4. Oyun Mantığı (Game Logic)

- [x] Oyun state yönetimi (useState/useReducer)
- [x] Harf girişi mantığı
- [x] Tahmin doğrulama sistemi
- [x] Türkçe karakter desteği (ı/i, ö, ü, ç, ş, ğ)
- [x] 6 deneme limiti kontrolü
- [x] Kazanma/kaybetme durumu
- [x] Kelime geçerliliği kontrolü
- [x] Günlük kelime seçim algoritması (tarih bazlı)
- [x] Sınırsız mod: Rastgele kelime seçimi
- [x] Sınırsız mod: Tekrar oyna özelliği
- [x] Mod bazlı istatistik ayrımı (günlük vs sınırsız)

### 5. Animasyonlar ve Efektler

- [x] Harf girişi: Pop-in animasyonu (Tailwind scale)
- [x] Tahmin sonrası: Flip/rotate animasyonu
- [x] Geçersiz kelime: Shake animasyonu
- [x] Kazanma: Bounce/celebrate animasyonu
- [x] Smooth transitions (Tailwind transition utilities)

### 6. Modal Bileşenleri

#### 6.1 Nasıl Oynanır Modal

- [x] Oyun kuralları açıklaması
- [x] Renk kodlama örnekleri
- [x] Kapatma butonu

#### 6.2 İstatistik Modal

- [x] localStorage'dan istatistikleri oku
- [x] Görsel istatistik gösterimi:
  - Oynanan oyun sayısı
  - Kazanma yüzdesi
  - Mevcut seri (streak)
  - En uzun seri
  - Tahmin dağılımı (bar chart)

#### 6.3 Oyun Sonu Modal

- [x] Kazanma/kaybetme mesajı
- [x] İstatistik özeti
- [x] Paylaşım butonu
- [x] Geri sayım (sonraki kelimeye kadar) - Günlük mod
- [x] Tekrar Oyna butonu - Sınırsız mod
- [x] Ana Sayfa butonu

### 7. Veri Yönetimi

- [x] localStorage ile state saklama
  - Günlük oyun durumu
  - Kullanıcı istatistikleri (günlük mod)
  - Kullanıcı istatistikleri (sınırsız mod - ayrı)
  - Son oynanan tarih
- [x] Custom hook: `useLocalStorage`
- [x] Custom hook: `useGameState` (mod desteği ile)
- [x] React Query ile kelime listesi yönetimi (opsiyonel caching)

### 8. Paylaşım Özelliği

- [x] Sonuç formatı oluştur (emoji grid)

  ```
  Nurdle 12 4/6

  ⬜🟨⬜⬜⬜
  🟩⬜⬜🟨⬜
  🟩🟩🟩⬜🟩
  🟩🟩🟩🟩🟩
  ```

- [x] Clipboard API ile kopyalama
- [x] "Kopyalandı!" feedback mesajı

### 9. Tema ve Stil

- [x] Dark theme (varsayılan)
- [x] Tailwind CSS ile responsive tasarım
- [x] Mobile-first approach
- [x] Renk paleti Tailwind config'de tanımla
- [x] Custom Tailwind animasyonları

### 10. Responsive Tasarım

- [x] Mobil görünüm (320px - 768px)
- [x] Tablet görünüm (768px - 1024px)
- [x] Desktop görünüm (1024px+)
- [x] Klavye boyutlandırma
- [x] Grid boyutlandırma

### 11. Deployment

- [ ] Vercel/Netlify deployment konfigürasyonu
- [ ] Build optimizasyonu
- [ ] Environment variables ayarları
- [ ] Custom domain bağlama (opsiyonel)

---

## 🛠️ Teknoloji Stack

### Frontend Framework

- **React 19+**: Component-based UI
- **Vite 7**: Build tool ve dev server
- **TypeScript 5+**: ✅ Type safety (zorunlu) - Strict mode

### State Management & Data Fetching

- **React Hooks**: useState, useEffect, useReducer, useCallback, useMemo
- **TanStack Query (React Query)**: Data fetching, caching, state management
- **Context API**: Global state (opsiyonel, gerekirse)

### Styling

- **Tailwind CSS 3.x**: Utility-first CSS framework (stable)
- **Tailwind CSS Animations**: Custom keyframes in tailwind.config.js
- **PostCSS**: CSS processing

### Storage

- **localStorage**: Oyun durumu ve istatistikleri
- **Clipboard API**: Paylaşım özelliği

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control

### Deployment

- **Vercel** veya **Netlify**: Statik site hosting
- **GitHub**: Code repository

### Package Manager

- **npm** veya **pnpm**: Dependency management

---

## 📦 Proje Yapısı

```
nurdle/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── GameGrid.jsx
│   │   ├── Tile.jsx
│   │   ├── Keyboard.jsx
│   │   ├── Key.jsx
│   │   ├── Modal.jsx
│   │   ├── HowToPlayModal.jsx
│   │   ├── StatsModal.jsx
│   │   └── GameOverModal.jsx
│   ├── hooks/
│   │   ├── useGameState.js
│   │   ├── useLocalStorage.js
│   │   └── useKeyboard.js
│   ├── utils/
│   │   ├── gameLogic.js
│   │   ├── wordValidation.js
│   │   └── dateUtils.js
│   ├── data/
│   │   ├── words.json
│   │   └── validWords.json
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 🎨 Tasarım Gereksinimleri

### Renk Paleti (Tailwind Config)

```javascript
colors: {
  correct: '#6aaa64',    // Doğru pozisyon - Yeşil
  present: '#c9b458',    // Yanlış pozisyon - Sarı
  absent: '#787c7e',     // Kelimede yok - Gri
  bg: {
    primary: '#121213',  // Ana arkaplan
    secondary: '#1a1a1b' // İkincil arkaplan
  },
  tile: {
    empty: '#3a3a3c',    // Boş hücre kenarlığı
    filled: '#565758'    // Dolu hücre arka planı
  }
}
```

### Tipografi

- **Font Family**: System fonts (Tailwind default)
- **Başlık**: `text-3xl md:text-4xl font-bold`
- **Hücreler**: `text-2xl md:text-3xl font-bold`
- **Klavye**: `text-sm font-semibold`

### Animasyonlar (Tailwind)

- Harf girişi: `animate-pop` (custom animation)
- Tahmin sonrası: `animate-flip` (custom animation)
- Geçersiz kelime: `animate-shake` (custom animation)
- Kazanma: `animate-bounce` (Tailwind built-in)

---

## 📱 Kullanıcı Akışı

### İlk Giriş

1. Kullanıcı siteyi açar
2. Boş 6x5 grid ve klavye gösterilir
3. İlk girişte "Nasıl Oynanır?" modalı otomatik açılır (localStorage kontrolü)

### Oyun Oynama

1. Kullanıcı fiziksel klavye veya ekran klavyesinden harf girer
2. 5 harf girildikten sonra ENTER tuşuna basar
3. Kelime geçerliliği kontrol edilir
4. Geçersizse: Shake animasyonu ve uyarı mesajı
5. Geçerliyse: Hücreler flip animasyonuyla renklendirilir
6. Klavye tuşları güncellenir
7. Kazanma/kaybetme kontrolü
8. Oyun bittiyse: Sonuç modalı gösterilir

### Oyun Sonu

1. İstatistikler güncellenir ve gösterilir
2. Paylaşım formatı hazırlanır
3. "Paylaş" butonu aktif olur
4. Yarınki kelime için geri sayım başlar
5. localStorage'a kayıt yapılır

---

## 📊 Başarı Metrikleri (v1.0)

- Günlük aktif kullanıcı sayısı (DAU)
- Tamamlama oranı (oyunu bitirme)
- Ortalama tahmin sayısı
- Paylaşım oranı

---

## 🔒 Güvenlik ve Gizlilik

- Kullanıcı verisi sadece browser'da saklanır (localStorage)
- Sunucu tarafında veri saklanmaz
- Cookie kullanılmaz
- GDPR uyumlu (sadece client-side storage)

---

## 📅 Geliştirme Takvimi

### Sprint 1 (3-4 gün)

- Proje kurulumu
- Temel bileşenler (Header, Grid, Keyboard)
- Kelime listesi hazırlığı

### Sprint 2 (3-4 gün)

- Oyun mantığı implementasyonu
- Animasyonlar
- localStorage entegrasyonu

### Sprint 3 (2-3 gün)

- Modal bileşenleri
- İstatistik sistemi
- Paylaşım özelliği

### Sprint 4 (1-2 gün)

- Responsive tasarım ince ayarları
- Bug fixes
- Testing

### Sprint 5 (1 gün)

- Deployment
- Final testing
- Launch! 🚀

**Toplam Süre:** ~2 hafta (10-14 gün)

---

---

## 📋 v1.0.0 Tamamlandı! ✅

v1.0.0 başarıyla tamamlandı ve yayında. GitHub'a pushlandı.

### v1.0.0 Özellikleri (Tamamlandı)

- ✅ Günlük Mod (her gün aynı kelime)
- ✅ Sınırsız Mod (sınırsız rastgele kelime)
- ✅ Türkçe Q klavye düzeni
- ✅ Tam Türkçe karakter desteği
- ✅ 6x5 oyun grid'i
- ✅ Animasyonlar (pop, flip, shake, bounce)
- ✅ Modal sistemi (HowToPlay, Stats, GameOver)
- ✅ İstatistik takibi (mod bazlı)
- ✅ Paylaşım özelliği
- ✅ Responsive tasarım
- ✅ Dark theme
- ✅ localStorage veri saklama

---

## 📦 Versiyon Geçmişi

### v2.2.0 - PWA Desteği (4 Ocak 2026) ✅

- ✅ **PWA**: Progressive Web App desteği
- ✅ **Service Worker**: Offline çalışma
- ✅ **Install Prompt**: Ana ekrana ekle banner
- ✅ **Auto Update**: Otomatik güncelleme
- ✅ **Manifest**: Web app manifest
- ✅ **Cache Strategy**: Workbox ile akıllı caching

### v2.1.1 - Günlük Kelime Yenilenme (4 Ocak 2026) ✅

- ✅ **Geri Sayım**: Yeni gün tespiti
- ✅ **Otomatik Yenileme**: "Yeni Nurdle'ı Başlat" butonu
- ✅ **UX İyileştirmesi**: Kullanıcı bilgilendirmesi

### v2.1.0 - Kelime Sistemi (4 Ocak 2026) ✅

- ✅ **Kelime Bilgisi Sistemi**: Her kelime için anlam, alıntı, kategori
- ✅ **90+ Risale-i Nur Kelimesi**: Gerçek Türkçe kelimeler
- ✅ **JSON Yapısı**: `WordEntry` interface ile zenginleştirilmiş data
- ✅ **GameOverModal**: Kelime bilgisi kartı
- ✅ **Azerice Temizliği**: Tüm Azerice karakterler düzeltildi
- ✅ **Type Safety**: WordEntry, WordData types

### v2.0.0 - TypeScript Migration (4 Ocak 2026) ✅

- ✅ **TypeScript**: Tüm kod TypeScript'e çevrildi (strict mode)
- ✅ **Tema Sistemi**: Light/Dark/System tema
- ✅ **Settings Modal**: Tema ve ayarlar
- ✅ **30+ Type Definitions**: Merkezi type yönetimi

---

## 🚀 v2.x Roadmap (Sıradaki Özellikler)

### Yüksek Öncelik (P0)

#### 1. Tema Sistemi ✅ (Tamamlandı)

- [x] Light/Dark tema değiştirme toggle
- [x] High contrast mod (CSS hazır, toggle eklenecek)
- [x] Tema tercihi localStorage'da saklanır (`nurdle:theme`)
- [x] Sistem teması algılama (prefers-color-scheme)
- [x] useTheme hook (TypeScript)
- [x] ThemeProvider context (TypeScript)
- [x] SettingsModal bileşeni (TypeScript)
- [x] Tüm component'lar tema uyumlu
- [x] CSS Variables ile dinamik renk sistemi
- [x] Smooth theme transitions

#### 0. TypeScript Migration ✅ (v2.0 için zorunlu)

- [x] TypeScript ve @types paketleri kuruldu
- [x] tsconfig.json (strict mode)
- [x] Type definitions (src/types/index.ts)
- [x] Tüm utils TypeScript'e çevrildi
- [x] Tüm hooks TypeScript'e çevrildi
- [x] Tüm components TypeScript'e çevrildi
- [x] Generic types (useLocalStorage<T>)
- [x] Context type safety
- [x] Linter hatası: 0
- [x] Build başarılı: ✅
- [x] SECURITY.md oluşturuldu

#### 2. Kelime Bilgisi ve Alıntılar ✅ (Tamamlandı - v2.1)

- [x] **JSON Yapısı Güncellendi**: Her kelime için `WordEntry` interface
- [x] **Kelime Anlamı**: Oyun bitince kelime anlamı gösterilir
- [x] **Risale-i Nur Alıntısı**: Her kelime için özgün alıntı
- [x] **Kategori**: İsim, sıfat, fiil bilgisi
- [x] **90+ Kelime**: Risale-i Nur'dan gerçek Türkçe kelimeler
- [x] **Azerice Karakterler Temizlendi**: Tüm kelimeler Türkçe (İ, ı, Ş, ş, Ğ, ğ, Ü, ü, Ö, ö, Ç, ç)
- [x] **GameOverModal Güncellendi**: Kelime bilgisi kartı eklendi
- [x] **Type Safety**: `WordEntry`, `WordData` interfaces
- [ ] "Daha fazla oku" linki (gelecek)
- [ ] Kelime arama özelliği (gelecek)

#### 4. Sert (Hard) Mod

- [ ] Önceki ipuçları sonraki tahminlerde kullanılmalı
- [ ] Yeşil harfler aynı pozisyonda kalmalı
- [ ] Sarı harfler kelimede olmalı
- [ ] Mod seçimi ayarlar menüsünde

### Orta Öncelik (P1)

#### 5. PWA (Progressive Web App) ✅ (Tamamlandı - v2.2)

- [x] **Service Worker**: vite-plugin-pwa ile otomatik kurulum
- [x] **Offline Oyun Desteği**: Workbox cache stratejisi
- [x] **"Ana Ekrana Ekle"**: InstallPrompt component'i (3 sn sonra)
- [x] **App Manifest**: manifest.json ve meta tags
- [x] **Auto Update**: Yeni versiyon algılama ve güncelleme
- [x] **Runtime Caching**: Font ve asset caching
- [x] **Dev Mode**: PWA dev modda da test edilebilir
- [x] **TypeScript**: Tüm PWA kodları type-safe
- [x] **7 Gün Dismiss**: Kullanıcı reddederse 7 gün tekrar gösterilmez
- [ ] Push notification (gelecek - permission gerekli)

#### 6. SEO ve Performans

- [ ] Meta tags optimizasyonu
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Image optimization
- [ ] Code splitting

#### 7. Erişilebilirlik İyileştirmeleri

- [ ] Klavye navigasyonu (Tab, Arrow keys)
- [ ] Screen reader iyileştirmeleri
- [ ] Focus trap modallar için
- [ ] ARIA labels tamamlama
- [ ] Renk körü modu iyileştirme

#### 8. Gelişmiş İstatistikler

- [ ] Grafik gösterimi (charts)
- [ ] En çok tahmin edilen harfler
- [ ] Ortalama tahmin süresi
- [ ] En hızlı çözüm zamanı
- [ ] İstatistik karşılaştırma (günlük vs sınırsız)

### Düşük Öncelik (P2)

#### 9. Sosyal Özellikler

- [ ] Global günlük istatistikler
- [ ] "Bugün X kişi oynadı" göstergesi
- [ ] Başarı rozetleri (achievements)
- [ ] Arkadaş davetiyesi (referral link)

#### 10. Kelime Varyasyonları

- [ ] 4 harfli kelime modu
- [ ] 6 harfli kelime modu
- [ ] Zorluk seviyesi (kolay/orta/zor)
- [ ] Kategori seçimi (isim/fiil/sıfat)

#### 11. Eğitim Modu

- [ ] İpucu sistemi (hint)
- [ ] Pratik modu (öğrenme)
- [ ] Kelime kartları
- [ ] Günlük kelime bilgisi

---

## 🚀 Geliştirme Fazları (Cloudflare Stack)

> v2.x PWA aşaması tamamlandı. Bundan sonraki geliştirme Cloudflare altyapısı üzerinde ilerler.
> Monorepo yapısı: `apps/frontend/` + `apps/backend/` + `packages/shared/`

---

### Faz 1 — Backend & Veritabanı Temeli

**Hedef**: Kelime listesini JSON'dan çıkarıp D1 veritabanında yönetmek; Hono API ile frontend'e servis etmek.

**Stack**: Hono + Cloudflare Workers + D1 (SQLite)

#### Yapılacaklar

- [ ] Monorepo kurulumu (pnpm workspaces)
  - [ ] Mevcut `src/` → `apps/frontend/src/`
  - [ ] `apps/backend/` — Hono + Wrangler kurulumu
  - [ ] `packages/shared/` — `WordEntry`, `ApiError` shared types
- [ ] D1 veritabanı şeması
  - [ ] `words` tablosu (id, word, meaning, context, category, is_active)
  - [ ] `daily_words` tablosu (word_id, date UNIQUE)
  - [ ] Migration dosyaları `apps/backend/migrations/`
- [ ] `words.json` → D1'e aktarım scripti
- [ ] Backend API endpoints
  - [ ] `GET /api/words/daily` — günün kelimesi
  - [ ] `GET /api/words/random` — rastgele kelime (sınırsız mod)
  - [ ] `POST /api/words/validate` — kelime geçerlilik kontrolü
- [ ] Frontend: `words.json` import → API çağrısı (TanStack Query)
- [ ] CI/CD: GitHub Actions — Workers + Pages deploy
- [ ] Cloudflare Pages deploy konfigürasyonu

**Başarı Kriterleri**:
- Kelime listesi D1'den geliyor
- Günlük kelime tarih bazlı API'den alınıyor
- Frontend'de `words.json` referansı kalmıyor

---

### Faz 2 — Custom Kelime Listeleri & Admin Paneli

**Hedef**: Kullanıcıların kendi kelime listelerini yükleyip özel Nurdle oyunları oluşturabilmesi; admin paneli ile kelime yönetimi.

**Stack**: Faz 1 + Cloudflare R2

#### Yapılacaklar

- [x] Admin paneli (route korumalı, secret tabanlı)
  - [x] Kelime listeleme, arama, filtreleme
  - [x] Kelime ekleme / düzenleme / deaktive etme
  - [x] Günlük kelime programlama (takvim view)
  - [x] Toplu kelime import (CSV + JSON)
- [x] Değişken kelime uzunluğu (4-7 harf)
  - [x] DB: `words` tablosuna `length` kolonu ekle (migration 0002)
  - [x] API: uzunluk bazlı kelime filtreleme (`/api/words/daily?length=5`)
  - [x] Frontend: mod seçiminde uzunluk seçeneği (4 / 5 / 6 / 7 harf)
  - [x] GameGrid dinamik grid boyutu
  - [x] Klavye değerlendirme uzunluğa göre çalışsın
  - [ ] Admin: kelime eklerken uzunluk otomatik hesaplansın (admin panelde bakılacak)
- [ ] Custom kelime listesi yükleme
  - [ ] CSV/JSON dosya upload → R2 depolama
  - [ ] R2'den D1'e kelime aktarımı (backend job)
  - [ ] Dosya validasyonu (format, encoding, duplicate check)
- [ ] Slug sistemi
  - [ ] `word_lists` tablosu (slug, name, description, r2_key, is_public)
  - [ ] `GET /api/lists/:slug` — custom liste detayı
  - [ ] `GET /api/lists/:slug/play` — custom oyun başlatma
  - [ ] Frontend: `/play/:slug` route'u
- [ ] Paylaşım: Custom Nurdle linki oluşturma ve kopyalama

**Başarı Kriterleri**:
- Admin panel üzerinden kelime yönetimi yapılabiliyor ✅
- 4/5/6/7 harfli mod seçilebiliyor
- Kullanıcı CSV yükleyip custom Nurdle oluşturabiliyor
- Custom oyun linki paylaşılabiliyor

---

### Faz 3 — Ticari Model & Kullanıcı Sistemi

**Hedef**: Kullanıcı hesapları, global istatistikler, premium özellikler ve monetizasyon altyapısı.

**Stack**: Faz 2 + Cloudflare Analytics Engine + JWT Auth

#### Yapılacaklar

- [ ] Yarışma / Rekabet Modu
  - [ ] Aynı kelimeyi çözen iki kullanıcıyı karşılaştır
  - [ ] Paylaşılabilir sonuç linki ile "challenge" daveti
  - [ ] Kazanan belirleme (daha az deneme / daha hızlı)
  - [ ] Skor tablosu (haftalık/aylık)
- [ ] Kullanıcı hesapları
  - [ ] `users` tablosu (D1) — email, display_name, is_premium, is_admin
  - [ ] JWT tabanlı auth (Cloudflare Workers KV veya D1)
  - [ ] Google OAuth entegrasyonu (opsiyonel)
  - [ ] Anonim → kayıtlı kullanıcı istatistik taşıma
- [ ] Global istatistikler
  - [ ] Günlük oynanan oyun sayısı
  - [ ] Kelime bazlı çözüm dağılımı
  - [ ] "Bugün X kişi oynadı" widget'ı
  - [ ] Cloudflare Analytics Engine entegrasyonu (ücretsiz)
- [ ] Liderboard
  - [ ] Günlük / haftalık / tüm zamanlar sıralaması
  - [ ] Arkadaş davetiyesi (referral sistem)
- [ ] Premium özellikler
  - [ ] Özel domain Nurdle oluşturma
  - [ ] Marka özelleştirme (logo, renk)
  - [ ] Gelişmiş istatistikler
  - [ ] Ödeme entegrasyonu (Stripe veya Paddle)
- [ ] Multi-language
  - [ ] İngilizce arayüz
  - [ ] Arapça kelime desteği (RTL layout)

**Başarı Kriterleri**:
- Kullanıcılar hesap açıp istatistiklerini kaydedebiliyor
- Global leaderboard çalışıyor
- Premium abonelik satın alınabiliyor

---

## 🎯 v3.0 ve Ötesi (Uzun Vadeli)

### Topluluk Özellikleri

- Kullanıcı hesap sistemi (opsiyonel)
- Liderlik tablosu
- Turnuva/yarışma modu
- Kullanıcı oluşturmalı kelime listeleri

### Platform Genişletme

- React Native mobil uygulama
- Telegram/WhatsApp bot
- iOS/Android native app
- Desktop app (Electron)

### Çoklu Dil Desteği

- Arapça kelime desteği
- İngilizce arayüz
- Çoklu dil arayüz seçenekleri

### Analytics ve İyileştirmeler

- Google Analytics entegrasyonu
- A/B testing altyapısı
- Error tracking (Sentry)
- Performance monitoring

---

## 📚 Kaynaklar ve Dokümantasyon

### Ana Teknolojiler

| Teknoloji          | Versiyon | Dokümantasyon                                                                                |
| ------------------ | -------- | -------------------------------------------------------------------------------------------- |
| **React**          | ^19.2.0  | [react.dev](https://react.dev)                                                               |
| **React DOM**      | ^19.2.0  | [react.dev/reference/react-dom](https://react.dev/reference/react-dom)                       |
| **Vite**           | ^7.2.4   | [vitejs.dev](https://vitejs.dev/guide/)                                                      |
| **Tailwind CSS**   | ^3.4.19  | [tailwindcss.com/docs](https://tailwindcss.com/docs)                                         |
| **TanStack Query** | ^5.90.16 | [tanstack.com/query/latest](https://tanstack.com/query/latest/docs/framework/react/overview) |
| **Lucide React**   | ^0.562.0 | [lucide.dev/guide/packages/lucide-react](https://lucide.dev/guide/packages/lucide-react)     |
| **TypeScript**     | ^5.7.3   | [typescriptlang.org/docs](https://www.typescriptlang.org/docs/)                              |

### Geliştirme Araçları

| Araç                     | Versiyon | Dokümantasyon                                                                      |
| ------------------------ | -------- | ---------------------------------------------------------------------------------- |
| **ESLint**               | ^9.39.1  | [eslint.org/docs](https://eslint.org/docs/latest/)                                 |
| **PostCSS**              | ^8.5.6   | [postcss.org/docs](https://postcss.org/docs/)                                      |
| **Autoprefixer**         | ^10.4.23 | [github.com/postcss/autoprefixer](https://github.com/postcss/autoprefixer)         |
| **@vitejs/plugin-react** | ^5.1.1   | [github.com/vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) |

### TypeScript Types

| Paket                | Versiyon | Açıklama                   |
| -------------------- | -------- | -------------------------- |
| **@types/react**     | ^19.0.11 | React type definitions     |
| **@types/react-dom** | ^19.0.4  | React DOM type definitions |
| **@types/node**      | ^22.14.0 | Node.js type definitions   |

### Faydalı Linkler

- **React 19 Yenilikler**: [react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19)
- **Tailwind CSS Cheat Sheet**: [tailwindcomponents.com/cheatsheet](https://tailwindcomponents.com/cheatsheet/)
- **Vite Config Reference**: [vitejs.dev/config](https://vitejs.dev/config/)
- **TanStack Query DevTools**: [tanstack.com/query/latest/docs/framework/react/devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)
- **TypeScript Handbook**: [typescriptlang.org/docs/handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- **TypeScript Deep Dive**: [basarat.gitbook.io/typescript](https://basarat.gitbook.io/typescript/)

### Referans Projeler

- **Wordle** (Orijinal oyun): [nytimes.com/games/wordle](https://www.nytimes.com/games/wordle/index.html)
- **Risale-i Nur Külliyatı**: [risaleinurenstitusu.org](https://www.risaleinurenstitusu.org/)

---

## 🔧 TypeScript Standartları

### Type Safety Kuralları

1. **Strict Mode**: Tüm TypeScript strict flags aktif

   - `strict: true`
   - `noUnusedLocals: true`
   - `noUnusedParameters: true`
   - `noFallthroughCasesInSwitch: true`
   - `noImplicitReturns: true`
   - `noUncheckedIndexedAccess: true`

2. **Type Definitions**

   - Tüm types `src/types/index.ts` içinde merkezi olarak tanımlanır
   - Component props için interface kullanılır
   - Generic types kullanılır (örn: `useLocalStorage<T>`)
   - `any` kullanımı yasaktır

3. **Component Type Safety**

   - Tüm component'lar `.tsx` uzantılı
   - Props için interface tanımı zorunlu
   - Return type `JSX.Element` veya `JSX.Element | null`
   - Event handler'lar için doğru type'lar

4. **Hook Type Safety**

   - Custom hook'lar için return type interface
   - Generic types kullanımı
   - State types açıkça belirtilir

5. **Utility Function Types**
   - Tüm fonksiyonlar için parametre ve return type'ları
   - Pure functions için readonly types
   - Type guards kullanımı

### Naming Conventions

- **Types/Interfaces**: PascalCase (örn: `GameState`, `TileStatus`)
- **Type Files**: `index.ts` (types klasöründe)
- **Component Props**: `ComponentNameProps` (örn: `HeaderProps`)
- **Enums**: PascalCase values (örn: `GameStatus`)

### Import/Export

```typescript
// ✅ İyi
import type { GameState, TileStatus } from "../types";
import { useState } from "react";

// ❌ Kötü
import { GameState } from "../types";
```

---

## 📚 Kelime Kaynakları

### Risale-i Nur Külliyatı

Projedeki tüm kelimeler **Risale-i Nur külliyatı**ndan alınmıştır. Her kelime için:

1. **Anlam**: Kelimenin Türkçe anlamı
2. **Bağlam**: Risale-i Nur'dan özgün alıntı (kısa form)
3. **Kategori**: Dilbilgisi kategorisi (isim, sıfat, fiil)

### Kelime Seçim Kriterleri

- ✅ 5 harfli Türkçe kelimeler
- ✅ Risale-i Nur'da geçen terimler
- ✅ Anlamlı ve öğretici kelimeler
- ✅ Türkçe karakter desteği (İ, ı, Ş, ş, Ğ, ğ, Ü, ü, Ö, ö, Ç, ç)
- ❌ Azerice karakterler kullanılmaz (Ə, ə)

### Kelime Örnekleri

```json
{
  "word": "İMAN",
  "meaning": "İnanç, tasdik",
  "context": "İman, saadet-i ebediyenin anahtarıdır.",
  "category": "isim"
}
```

---

**Not:** Proje v2.1 ile kelime sistemi zenginleştirilmiştir. Her kelime anlam ve alıntı ile birlikte sunulur.
