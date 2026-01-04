# Deployment Guide

## GitHub'a Push Etme

### 1. GitHub'da Yeni Repo Oluştur

1. GitHub'a git: https://github.com/new
2. Repository name: `nurdle`
3. Description: "Risale-i Nur külliyatından kelimelerle oynanan günlük kelime tahmin oyunu"
4. Public veya Private seç
5. **Initialize this repository with** kısmını BOŞ bırak (zaten local repo var)
6. Create repository

### 2. Remote Ekle ve Push Et

```bash
# GitHub repo URL'ini ekle (kendi username'inle değiştir)
git remote add origin https://github.com/USERNAME/nurdle.git

# Main branch'i push et
git push -u origin main

# Tag'leri push et
git push --tags
```

### 3. Vercel/Netlify'da Deploy

#### Vercel (Önerilen)

1. https://vercel.com/new adresine git
2. GitHub repo'sunu seç (nurdle)
3. Framework Preset: **Vite** olarak algılanacak
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy butonuna tıkla

#### Netlify

1. https://app.netlify.com/start adresine git
2. GitHub'dan nurdle repo'sunu seç
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy site butonuna tıkla

### 4. Custom Domain (Opsiyonel)

#### Vercel'de:
1. Project Settings → Domains
2. Domain ekle: `nurdle.app` (veya istediğin domain)
3. DNS ayarlarını yap

#### Netlify'de:
1. Domain Settings → Add custom domain
2. DNS kayıtlarını güncelle

## Environment Variables

Şu an environment variable yok ama ileride eklenirse:

```env
# .env.production
VITE_API_URL=https://api.nurdle.app
VITE_ANALYTICS_ID=your-analytics-id
```

## Build Önizleme

```bash
# Production build oluştur
npm run build

# Build'i local'de test et
npm run preview
```

## v1.0.0 Release

```bash
# Current commit'e tag ekle
git tag -a v1.0.0 -m "Release v1.0.0"

# Tag'i push et
git push origin v1.0.0
```

## v2.0 Development Branch

```bash
# v2.0 için branch oluştur
git checkout -b feat/v2.0

# Değişiklikleri commit et
git add .
git commit -m "feat: Add theme switcher for v2.0"

# Branch'i push et
git push -u origin feat/v2.0
```

## Sorun Giderme

### Port zaten kullanımda
```bash
# Process'i kill et
lsof -ti:5173 | xargs kill -9

# Veya farklı port kullan
npm run dev -- --port 3000
```

### Build hatası
```bash
# Cache temizle
rm -rf node_modules dist
npm install
npm run build
```

## Monitoring (v2.0+)

- **Vercel Analytics**: Otomatik aktif
- **Sentry**: Error tracking için
- **Google Analytics**: Traffic analizi için

---

**Not:** Her deployment sonrası manuel test yapılmalı:
- ✅ Ana sayfa yükleniyor mu?
- ✅ Her iki mod çalışıyor mu?
- ✅ Mobil görünüm düzgün mü?
- ✅ Paylaşım çalışıyor mu?

