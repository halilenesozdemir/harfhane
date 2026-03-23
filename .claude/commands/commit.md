---
description: Staged değişikliklerden Conventional Commit mesajı üret ve commit yap.
---

Staged git değişikliklerini incele ve Conventional Commits standardına uygun bir commit yap.

Adımlar:
1. `git diff --staged` çalıştır — neyin staged olduğunu gör
2. `git status` çalıştır — genel durumu anla
3. Son 5 commit'e bak: `git log --oneline -5` — projenin commit stilini anla
4. Değişiklikleri analiz et:
   - Tip belirle: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`
   - Scope: en çok etkilenen dosya yolu (kısa, relative)
   - Subject: imperative mood, max 50 karakter, İngilizce, nokta yok
5. Eğer staged yoksa kullanıcıya bildir ve dur.
6. Commit mesajını kullanıcıya göster ve onay iste.
7. Onay gelince: `git commit -m "<mesaj>"` çalıştır.

Format: `type(scope): subject`

Örnekler:
- `feat(routes/words.ts): add word length filter to random endpoint`
- `fix(utils/normalize.ts): handle null input in normalizeWord`
- `refactor(services/word-service.ts): extract date formatting helper`
- `test(repositories/word-repository.ts): add edge case for empty schedule`

Kural: Auto-commit yapma — her zaman kullanıcı onayı al.
