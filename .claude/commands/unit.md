---
description: Onaylı bir plan birimini izole worktree'de uygula, kapıdan geçir, draft PR aç. Kullanım: /unit <plan-dosyası> <U-no>
---

Plan birimi: $ARGUMENTS

Draft PR'da durursun. Merge, deploy, remote D1 yazma ve ayar dosyası değişikliği kapsam dışı.

1. **Oku.** Plan `status: approved` değilse dur ve sor. Birimin requirement ve KTD'lerini çıkar; belirsizse sor. `git log` ve `docs/backlog.md` ile birimin zaten yapılıp yapılmadığına bak.
2. **İzole et.** `git worktree add -b <type>/<konu> ../harfhane-wt/<type>-<konu> origin/main`, içinde `pnpm install --frozen-lockfile`.
3. **Önce kanıtı.** Değişiklik mevcut davranışı korumalıysa, önce ölçülebilir bir çıktıyı script ile al (build edilmiş CSS, API yanıtı, test çıktısı).
4. **Uygula.** Önce birimin davranışını tanımlayan test, sonra kod. Üretilen dosya varsa kaynakla kaymayı yakalayan test ekle. Bir test, onaylı bir planın acceptance example'ını kanıtlıyorsa adına id ekle: `should <behavior> when <condition> (<plan>-AE<n>)`; `pnpm run check:ac` bunu denetler.
5. **Kapı.** Commit kapısı yeşil olmalı. Aynı hata iki kez → yaklaşımı değiştir ve `diagnosing-bugs` skill'ini uygula; üçüncü deneme yok: dur, sebebi `docs/backlog.md`'ye yaz, raporla. "Sonra" çıktısını "önce" ile karşılaştır, farkı açıkla ya da düzelt.
6. **Teslim.** PR'dan önce `docs/guides/review-checklist.md`'yi geç; geçerli maddeleri PR'da yaz. Push, draft PR (Summary: plan + birim; Ambiguities: çözdüğün her belirsizlik ve nasıl çözdüğün, yoksa "none"; Verification: önce/sonra, kapı, test sayısı, kontrol listesi; Not covered). Yarım kalan her şey `docs/backlog.md`'ye. Rapor: PR linki, kanıt, doğrulanmayanlar.
7. **İnceleme ana döngüde.** Üreten kendi hakemini çağırmaz: ana döngü draft PR'ı `reviewer` agent'ına verir, bulguları doğrular ve düzeltmeyi aynı birime geri gönderir.
