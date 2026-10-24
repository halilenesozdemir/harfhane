# Android yayın (EAS + Google Play)

Plan 004 U9–U10. Komutlar `apps/mobile` içinde çalışır. Profiller `apps/mobile/eas.json`'da.

## Profiller

- `preview`: dahili dağıtım, `.apk`. Emülatöre ya da telefona doğrudan kurulur.
- `production`: `.aab`. `versionCode` EAS sunucusunda tutulur ve her build'de artar (`appVersionSource: remote`).
- `submit.production`: kapalı test kanalına (`alpha`) taslak olarak gönderir. Uygulama Play'de henüz yayında değilken Google yalnız `draft` kabul eder.

## Sahip adımları (sırayla)

1. Expo hesabı aç, sonra `npx eas-cli@latest login`. Yapıldı (hesap `halilenes`).
2. `npx eas-cli@latest init`. Yapıldı: `projectId` ve `owner` `app.json`'da.
3. `npx eas-cli@latest build --platform android --profile preview`: ilk kurulabilir `.apk`. İmza anahtarı EAS sunucusunda.
4. Play Console'da uygulamayı oluştur (`app.harfhane`), mağaza metni: `docs/drafts/play-store-listing.md`.
5. Google service account anahtarı oluştur (https://expo.fyi/creating-google-service-account) ve EAS'a yükle. Anahtar dosyası repoya girmez (`apps/mobile/.gitignore`).
6. `npx eas-cli@latest build --platform android --profile production`, sonra `npx eas-cli@latest submit --platform android --profile production`. İstenirse ilk `.aab` Play Console > Kapalı test kanalına elle de yüklenebilir.
7. Kapalı test (Kasım 2023 sonrası açılan kişisel hesaplar için): en az 12 testçi, 14 gün kesintisiz. Ardından production erişimi başvurusu.
