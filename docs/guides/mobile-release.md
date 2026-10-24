# Android yayın (EAS + Google Play)

Plan 004 U9–U10. Komutlar `apps/mobile` içinde çalışır. Profiller `apps/mobile/eas.json`'da.

## Profiller

- `preview`: dahili dağıtım, `.apk`. Emülatöre ya da telefona doğrudan kurulur.
- `production`: `.aab`. `versionCode` EAS sunucusunda tutulur ve her build'de artar (`appVersionSource: remote`).
- `submit.production`: kapalı test kanalına (`alpha`) taslak olarak gönderir. Uygulama Play'de henüz yayında değilken Google yalnız `draft` kabul eder.

## Sahip adımları (sırayla)

1. Expo hesabı aç, sonra `npx eas-cli@latest login`.
2. `npx eas-cli@latest init`: `app.json`'a `extra.eas.projectId` ve `owner` ekler; bu değişikliği commit et.
3. `npx eas-cli@latest build --platform android --profile preview`: ilk kurulabilir `.apk`. İmza anahtarını EAS'ın üretmesine izin ver.
4. Play Console'da uygulamayı oluştur (`app.harfhane`), mağaza metni: `docs/drafts/play-store-listing.md`.
5. `npx eas-cli@latest build --platform android --profile production`, çıkan `.aab`'ı ilk sefer Play Console > Kapalı test kanalına elle yükle.
6. Sonraki sürümler için Google service account anahtarı oluştur (https://expo.fyi/creating-google-service-account), EAS'a yükle; sonra `npx eas-cli@latest submit --platform android --profile production`. Anahtar dosyası repoya girmez (`apps/mobile/.gitignore`).
7. Kapalı test: en az 12 testçi, 14 gün kesintisiz. Ardından production erişimi başvurusu.
