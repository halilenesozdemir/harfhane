# PWA Test Rehberi

## 🧪 Test Adımları

### 1. Development Ortamında Test

```bash
npm run dev
```

**Tarayıcıda Kontrol:**
- ✅ Console'da "✅ Service Worker kaydedildi" mesajını görün
- ✅ Application → Service Workers → "nurdle" aktif olmalı
- ✅ Application → Manifest → JSON görüntülenebilmeli
- ✅ 3 saniye sonra "Ana Ekrana Ekle" banner'ı görünmeli

### 2. Production Build Test

```bash
npm run build
npm run preview
```

**Lighthouse Test:**
1. Chrome DevTools → Lighthouse
2. "Progressive Web App" seçin
3. "Generate report" tıklayın
4. **Hedef: 90+ puan**

### 3. Offline Test

**Chrome DevTools:**
1. Application → Service Workers
2. "Offline" checkbox'ını işaretle
3. Sayfayı yenile
4. **Oyun çalışmalı** (cached)

### 4. Install Test

**Desktop (Chrome/Edge):**
- Adres çubuğunda "➕" (Install) ikonu görünmeli
- Tıkla → "Yükle" → Uygulama açılır

**Mobile (iOS Safari):**
- Paylaş butonu → "Ana Ekrana Ekle"
- Icon tam ekranda açılır (no browser UI)

**Mobile (Android Chrome):**
- "Ana ekrana ekle" banner'ı otomatik gösterilir (3 sn)
- "Yükle" tıkla → App drawer'a eklenir

### 5. Update Test

**Kod değiştir:**
1. Herhangi bir dosyayı düzenle
2. `npm run build`
3. Deploy et
4. Kullanıcı açtığında "Yeni versiyon mevcut!" popup'ı

## 🎯 PWA Checklist

### Temel Özellikler
- [x] ✅ HTTPS (production'da gerekli)
- [x] ✅ Service Worker kayıtlı
- [x] ✅ Manifest.json mevcut
- [x] ✅ Icon'lar tanımlı (SVG fallback)
- [x] ✅ Offline çalışıyor
- [x] ✅ Install prompt var
- [x] ✅ Theme color tanımlı
- [x] ✅ Viewport meta tag var

### İleri Özellikler
- [x] ✅ Auto-update mekanizması
- [x] ✅ Cache stratejisi (Workbox)
- [x] ✅ Splash screen desteği
- [x] ✅ Standalone mode
- [ ] ⏳ Push notifications (gelecek)
- [ ] ⏳ Background sync (gelecek)

## 📱 Cihaz Testleri

### iOS Safari
```
- Ana ekrana ekle: ✅
- Offline: ✅
- Standalone: ✅
- Icon: ✅
- Splash: ✅
```

### Android Chrome
```
- Install banner: ✅
- Add to home: ✅
- Offline: ✅
- Icon: ✅
- Notification: ⏳ (v2.3)
```

### Desktop Chrome/Edge
```
- Install app: ✅
- Window mode: ✅
- Offline: ✅
- Auto-update: ✅
```

## 🐛 Troubleshooting

### Service Worker kayıt olmuyor
- **Çözüm**: HTTPS gerekli (localhost OK)
- **Kontrol**: Chrome://serviceworker-internals

### Install prompt görünmüyor
- **Çözüm**: 
  - 7 gün bekleme süresi var
  - localStorage'da "install-prompt-dismissed" silin
  - Incognito modda test edin

### Offline çalışmıyor
- **Çözüm**:
  - Service Worker aktif mi kontrol et
  - Cache'de dosyalar var mı bak
  - Application → Cache Storage

### Icon görünmüyor
- **Çözüm**:
  - SVG fallback çalışıyor
  - PNG için: realfavicongenerator.net kullan
  - 192x192 ve 512x512 boyutları ekle

## 📊 Lighthouse Scores

**Hedef Skorlar:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100
- **PWA: 90+** ✅

## 🚀 Production Deploy

```bash
# Build
npm run build

# Test production build
npm run preview

# Deploy (örnek: Vercel)
vercel --prod
```

**Post-Deploy Checklist:**
- [ ] HTTPS aktif
- [ ] Service Worker çalışıyor
- [ ] Manifest accessible
- [ ] Install prompt çalışıyor
- [ ] Lighthouse PWA: 90+

---

**Not:** PWA özellikleri tarayıcı desteğine bağlıdır. iOS Safari'de bazı kısıtlamalar vardır.

