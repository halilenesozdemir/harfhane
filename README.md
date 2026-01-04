# Nurdle 🎮

Risale-i Nur külliyatından kelimelerle oynanan günlük kelime tahmin oyunu.

![Nurdle](./public/nurdle-icon.svg)

## 🎯 Özellikler

- 🗓️ **Günlük Mod**: Her gün yeni bir kelime, herkes aynı kelimeyi çözer
- ♾️ **Sınırsız Mod**: Dilediğin kadar oyna, her seferinde rastgele kelime
- 📊 İstatistik takibi (mod bazlı)
- 🎨 Modern ve responsive tasarım
- 🌙 Dark theme
- 📱 Mobil uyumlu
- ⌨️ Türkçe Q klavye düzeni
- 🔤 Tam Türkçe karakter desteği (İ, ı, ş, ğ, ü, ö, ç)
- 📤 Sonuçları paylaşma

## 🚀 Teknolojiler

- **React 19** - UI framework
- **Vite 7** - Build tool
- **TailwindCSS 3** - Styling
- **TanStack Query 5** - State management
- **Lucide React** - Icons
- **localStorage** - Data persistence

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build'i önizle
npm run preview
```

## 🎮 Nasıl Oynanır?

1. Ana sayfadan mod seçin (Günlük veya Sınırsız)
2. 5 harfli Risale-i Nur kelimesini tahmin edin
3. Her tahminden sonra kutucukların rengi değişir:
   - 🟩 **Yeşil**: Harf doğru pozisyonda
   - 🟨 **Sarı**: Harf kelimede var ama yanlış pozisyonda
   - ⬜ **Gri**: Harf kelimede yok
4. 6 denemede kelimeyi bulun!

## 📂 Proje Yapısı

```
nurdle/
├── src/
│   ├── components/     # React bileşenleri
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Yardımcı fonksiyonlar
│   └── data/           # Kelime listeleri
├── public/             # Statik dosyalar
└── products.md         # PRD dokümantasyonu
```

## 🎨 Özelleştirme

Renkler ve tema ayarları `tailwind.config.js` dosyasında tanımlıdır.

## 📝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feat/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feat/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- Wordle oyunundan ilham alınmıştır
- Risale-i Nur külliyatından kelimeler kullanılmıştır

## 📱 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

---

**Versiyon:** v1.0.0  
**Tarih:** 4 Ocak 2026
