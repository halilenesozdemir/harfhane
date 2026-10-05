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
