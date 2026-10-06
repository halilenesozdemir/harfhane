# Mobil uygulamayı çalıştırma

Harfhane Android uygulamasını (`apps/mobile`, Expo SDK 57) denemenin iki yolu var. Kaynak: Expo dokümanı, "Set up your environment" (2026-10-05'te kontrol edildi).

## En kısa yol: kendi telefonun

1. Telefona Play Store'dan **Expo Go** uygulamasını kur.
2. Bilgisayarda:
   ```bash
   cd ~/harfhane
   pnpm install
   cd apps/mobile
   pnpm exec expo start
   ```
3. Terminalde çıkan QR kodu Expo Go ile okut. Telefon ve bilgisayar aynı Wi-Fi ağında olmalı.

## Emülatör (Android Studio)

Bir kez yapılacak kurulum:

1. [Android Studio](https://developer.android.com/studio)'yu indir ve kur. İlk açılışta **Standard** kurulumu seç.
2. **Settings → Languages & Frameworks → Android SDK**:
   - **SDK Platforms**: **Android 16 (Baklava)** altında **Android SDK Platform 36**.
   - **SDK Tools**: **Android SDK Build-Tools** ve **Android Emulator** kurulu olsun.
3. `~/.zshrc` dosyasına ekle, sonra yeni bir terminal aç:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
   `adb version` çalışıyorsa tamam.
4. Android Studio → **Device Manager** → **Create Virtual Device**: bir Pixel telefon, sistem imajı **API 36**.

Her denemede:

1. Device Manager'dan emülatörü başlat.
2. `cd ~/harfhane/apps/mobile && pnpm exec expo start`
3. Terminalde **a** tuşuna bas. Expo CLI, emülatöre Expo Go'yu kurar ve uygulamayı açar.

## Bilmen gerekenler

- Uygulama varsayılan olarak canlı API'ye (`https://api.harfhane.app/api`) bağlanır. Yerel backend için: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8787/api pnpm exec expo start` (emülatörde `10.0.2.2` bilgisayarın kendisidir).
- Kod değişince uygulama kendiliğinden yenilenir. Yenilemek için emülatörde **R R**, menü için **Ctrl+M**.
- Kayıtlı oyun ve tema emülatörün içinde tutulur; sıfırlamak için Expo Go'nun verisini temizle.
- Takılırsa: `pnpm exec expo start --clear` önbelleği temizler; `pnpm exec expo-doctor` bağımlılık sorunlarını gösterir.

## Maestro uçtan uca akışları (Android, yerel)

Plan 009 R5: `apps/mobile/.maestro/` içindeki akışlar emülatörde gerçek Expo Go üzerinden çalışır.
CI'da yok (Android emülatörü CI'da yavaş; Phase 4'te EAS Workflows ile tekrar değerlendirilecek).

Bir kez yapılacak kurulum:

```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

Her denemede:

1. Emülatörü başlat (Device Manager'dan, ör. `harfhane_pixel`).
2. Metro'yu worktree'den başlat (`expo start` zaten çalışıyorsa önce öldür):
   ```bash
   pkill -f "expo start"
   cd apps/mobile && CI=1 pnpm exec expo start --port 8081 --clear
   ```
3. Yeni bir terminalde cihazı Metro'ya bağla:
   ```bash
   $ANDROID_HOME/platform-tools/adb reverse tcp:8081 tcp:8081
   ```
4. Akışları çalıştır:
   ```bash
   maestro test apps/mobile/.maestro
   ```
   (Veya kökten: `pnpm run test:maestro`.)

Akışlar `exp://127.0.0.1:8081` adresini açarak uygulamayı Expo Go içinde başlatır; paylaşılan
`subflows/open-fresh.yaml` Expo Go'nun ilk bağlantıda gösterdiği geliştirici menüsü sayfasını
kapatıp ana ekrana geçer. Günlük oyun akışı, günün gerçek kelimesini canlı API'den alır; akış bu
kelimeyi bilemediği için sözlükte geçerli altı farklı kelimeyle oynar ve kaybetmeyi de oyunun
sonuna ulaşmış sayar — yerel bir backend ve tohum veri kurmaktan daha basit ve güvenilir bir
seçim. Hiçbir akış uzak bir veritabanına yazmaz.
