# Nurdle - Product Requirements Document (PRD)

## 📋 Proje Özeti

**Proje Adı:** Nurdle  
**Versiyon:** 1.0.0 (MVP)  
**Tarih:** 4 Ocak 2026  
**Durum:** Geliştirme Aşamasında

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

- **React 18+**: Component-based UI
- **Vite**: Build tool ve dev server
- **TypeScript** (opsiyonel): Type safety

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

## 🚀 Gelecek Versiyonlar (v2.0+)

Bu özellikler MVP'den sonra geliştirilecek:

### v2.0 Planları

- Light/Dark tema değiştirme
- Sert (hard) mod
- Arşiv modu (geçmiş kelimeleri oynama)
- Kelime anlamı ve Risale-i Nur alıntıları
- PWA desteği (offline mode)
- SEO optimizasyonu

### v3.0 ve Sonrası

- Farklı kelime uzunlukları (4, 6 harf)
- Sınırsız mod
- Çoklu dil desteği
- Sosyal özellikler
- Analytics entegrasyonu

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

### Geliştirme Araçları

| Araç                     | Versiyon | Dokümantasyon                                                                      |
| ------------------------ | -------- | ---------------------------------------------------------------------------------- |
| **ESLint**               | ^9.39.1  | [eslint.org/docs](https://eslint.org/docs/latest/)                                 |
| **PostCSS**              | ^8.5.6   | [postcss.org/docs](https://postcss.org/docs/)                                      |
| **Autoprefixer**         | ^10.4.23 | [github.com/postcss/autoprefixer](https://github.com/postcss/autoprefixer)         |
| **@vitejs/plugin-react** | ^5.1.1   | [github.com/vitejs/vite-plugin-react](https://github.com/vitejs/vite-plugin-react) |

### Faydalı Linkler

- **React 19 Yenilikler**: [react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19)
- **Tailwind CSS Cheat Sheet**: [tailwindcomponents.com/cheatsheet](https://tailwindcomponents.com/cheatsheet/)
- **Vite Config Reference**: [vitejs.dev/config](https://vitejs.dev/config/)
- **TanStack Query DevTools**: [tanstack.com/query/latest/docs/framework/react/devtools](https://tanstack.com/query/latest/docs/framework/react/devtools)

### Referans Projeler

- **Wordle** (Orijinal oyun): [nytimes.com/games/wordle](https://www.nytimes.com/games/wordle/index.html)
- **Risale-i Nur Külliyatı**: [risaleinurenstitusu.org](https://www.risaleinurenstitusu.org/)

---

**Not:** Bu döküman MVP (v1.0) için temel özelliklere odaklanmaktadır. Proje ilerledikçe güncellenecektir.
