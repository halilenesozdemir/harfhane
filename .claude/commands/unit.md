---
description: Onaylı bir plan birimini izole worktree'de uygula, kapıdan geçir, draft PR aç. Kullanım: /unit <plan-dosyası> <U-no>
---

Plan birimini uçtan uca uygula: $ARGUMENTS

Sınır: draft PR'da durursun. Merge, deploy, remote D1 yazma ve ayar dosyası değişikliği bu komutun kapsamı dışında — sahibine bırak.

## 1. Birimi oku

1. `docs/plans/` altındaki planı oku. `status: approved` değilse dur ve sor.
2. Birimin requirement ve KTD'lerini çıkar. Belirsizlik varsa varsayım yapma, sor.
3. `git log --oneline -15` ve `docs/backlog.md` — birim zaten yapılmış ya da yarım mı?

## 2. İzole et

1. Taban: `origin/main`. Commit kapısı (`.githooks/pre-commit`) tabanda yoksa onu içeren branch'i taban al ve PR'ı o branch'e karşı aç.
2. `git worktree add -b <type>/<konu> ../harfhane-wt/<type>-<konu> <taban>` ve worktree içinde `pnpm install --frozen-lockfile`.
3. Tüm iş bu worktree'de; ana checkout'a dokunma.

## 3. Önce kanıt tabanı

Değişiklik mevcut davranışı korumalıysa, önce ölçülebilir bir "önce" çıktısı al (örnek: build edilmiş CSS'teki token bildirimleri, API yanıtı, test çıktısı). Kaynağı elle kopyalama — script ile çıkar.

## 4. Uygula

1. Test önce: birimin davranışını tanımlayan testi yaz.
2. Implement et. Üretilen dosya varsa, kaynakla kaymayı yakalayan bir test ekle.
3. Commit'e dosyaları tek tek ekle; `git add -A` kullanma. Frontend build `apps/frontend/public/sitemap.xml`'i yeniden üretir — bu dosya birime ait değilse commit'e girmez.

## 5. Kapı

1. Commit kapıdan geçer (typecheck + lint + test). Kırmızıysa kodu düzelt; `--no-verify` yasak.
2. Aynı hata iki kez → yaklaşımı değiştir. Üçüncü deneme yok: dur, sebebi `docs/backlog.md`'ye yaz, raporla.
3. "Sonra" çıktısını al ve 3. adımdaki "önce" ile karşılaştır. Fark varsa açıkla ya da düzelt.

## 6. Bağımsız inceleme

Diff'i, uygulamayı görmemiş taze bir subagent'a (`model: sonnet`) incelet: `git diff <taban>...HEAD`, plan birimi ve `AGENTS.md` Invariants'ı ver; "bu nerede patlar?" diye sor. Bulguyu doğrula, gerçekse düzelt ve kapıdan tekrar geç.

## 7. Teslim

1. Push et, draft PR aç. Gövde: **Summary** (plan + birim referansı), **Verification** (önce/sonra kanıtı, kapı sonucu, test sayısı), **Not covered**.
2. Yarım kalan ya da kapsam dışı bırakılan her şey `docs/backlog.md`'ye.
3. Rapor: PR linki, kanıt, açık kalanlar. Doğrulamadığın şeyi doğrulanmış gibi yazma.
