import { render, screen } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import PrivacyPage from './PrivacyPage';

function getRobotsMetaContent(): string | null {
  return document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;
}

// Full-sentence/meaning assertions, not single-word regexes: a mutant that
// flips a sentence's meaning (e.g. "gönderilmez" -> "gönderilir", or
// "bulunmaz" -> "bulunur") must fail these, not just a dropped word.
function normalizedBodyText(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function listSourceFiles(rootDir: string, onFile: (filePath: string) => void): void {
  for (const entry of readdirSync(rootDir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const fullPath = path.join(rootDir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) listSourceFiles(fullPath, onFile);
    else if (/\.(tsx?|jsx?)$/.test(entry)) onFile(fullPath);
  }
}

describe('PrivacyPage', () => {
  afterEach(() => {
    document.head.querySelector('meta[name="robots"]')?.remove();
  });

  it('should render the published heading with no draft banner and no internal plan id (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: 'Gizlilik Politikası' })).toBeInTheDocument();
    const text = normalizedBodyText();
    expect(text).not.toMatch(/taslak/i);
    expect(text).toContain('Son güncelleme: 24 Ekim 2026');
    // No internal unit id ("007", "U5", "U6") leaks into user-visible text.
    expect(text).not.toMatch(/\b007\b|\bU5\b|\bU6\b/);
    // No leftover owner-placeholder brackets.
    expect(text).not.toContain('[');
  });

  it('should name the owner as the data controller with the verified contact address (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain('Veri Sorumlusu: Halil Enes Özdemir');
    expect(text).toContain('İletişim e-postası: destek@harfhane.app');
  });

  it('should state there are no accounts, stats stay on-device and data only leaves the device for the listed requests (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      'Bugün itibarıyla Harfhane\'de hesap oluşturma, giriş yapma veya profil yoktur — oyunu oynamak için herhangi bir kişisel bilgi vermeniz gerekmez.'
    );
    expect(text).toContain(
      "Bu veriler, aşağıda açıklanan istekler dışında sunucularımıza gönderilmez."
    );
    expect(text).toContain(
      'Uygulamada reklam ve üçüncü taraf analitik/takip (örn. Google Analytics, Sentry, Mixpanel) bulunmaz; Harfhane kendi tarafında çerez (cookie) kullanmaz.'
    );
  });

  it('should disclose that the Worker processes the request IP in memory for rate limiting, not persistently (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      "Kötüye kullanımı (aşırı istek) önlemek için sunucumuz, bu isteklerdeki IP adresinizi kısa süreli olarak işler: IP adresi ve istek yolu, isteği sınırlamak amacıyla sunucu belleğinde (bir Cloudflare Worker'ın geçici belleğinde) sayım bir dakikalık pencerede yapılır; kayıt veritabanına yazılmaz, Worker'ın geçici belleğinde Worker yeniden başlayana kadar kalabilir."
    );
    // Must not claim the codebase is blind to this (it reads the IP itself).
    expect(text).not.toMatch(/Harfhane kod tabanından görünmez/);
  });

  // Meaning-level: a mutant flipping "yazılmaz" -> "yazılır" (claiming the
  // rate-limit hit is persisted to D1) must fail this, not just drop a word.
  it('should state the in-memory rate-limit record is not written to the database (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      "İstek sınırlama için bellekteki IP kaydı: bir dakikalık sayım penceresi; kayıt veritabanına yazılmaz, Worker'ın geçici belleğinde Worker yeniden başlayana kadar kalabilir."
    );
  });

  it('should state the Cloudflare Worker has no log push or observability configured, without a pending owner-check placeholder (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      "Bu günlüklerin tutulup tutulmadığı ve saklama süresi Cloudflare'in kendi gizlilik politikasına ve hesap ayarlarına bağlıdır; Harfhane'nin kullandığı Worker yapılandırmasında ayrıca bir günlük toplama (log push) veya gözlemlenebilirlik ayarı etkin değildir."
    );
    expect(text).not.toMatch(/SAHİP KONTROL ETMELİ/);
  });

  it('should list the daily, random and lengths endpoints, not only "günün kelimesi" (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('/api/words/daily')).toBeInTheDocument();
    expect(screen.getByText('/api/words/random')).toBeInTheDocument();
    expect(screen.getByText('/api/words/lengths')).toBeInTheDocument();
    expect(screen.getByText('/api/words/validate')).toBeInTheDocument();
  });

  it('should disclose that the legacy pre-scope-cut account tables were permanently deleted on 2026-10-24 and no account data remains (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: 'Önceki Sürümde Hesap Açtıysanız' })).toBeInTheDocument();
    const text = normalizedBodyText();
    expect(text).toContain(
      "2026-10-05'teki kapsam kararından önce Harfhane'de hesap, oturum açma ve sunucu tarafında oyun sonucu kaydı vardı."
    );
    expect(text).toContain('24 Ekim 2026');
    expect(text).toContain('veritabanından kalıcı olarak silindi');
    // Every legacy table name the migration dropped.
    for (const tableName of [
      'users',
      'game_results',
      'badges',
      'user_xp',
      'user_badges',
      'push_subscriptions',
      'streak_freezes',
      'password_reset_tokens',
      'duels',
      'word_lists',
      'word_list_words',
      'list_likes',
      'list_comments',
      'tournament_results',
    ]) {
      expect(text).toContain(tableName);
    }
    expect(text).toContain(
      'bugün veritabanında hesabınıza ait herhangi bir veri bulunmamaktadır.'
    );
  });

  it('should not claim legacy account data may still exist (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).not.toMatch(/henüz silinmemiştir/);
    expect(text).not.toMatch(/verilerinizin halen veritabanında bulunabileceğini varsaymalısınız/);
  });

  it('should not list a legacy-data processing purpose or retention period any more (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).not.toMatch(/Eski hesap verileri/);
  });

  it('should mention Cloudflare Pages/Workers IP processing and Google Play\'s own download/crash data policy (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toMatch(/Cloudflare.{0,60}(Workers ve Pages|Pages ve Workers)/);
    expect(text).toContain(
      "Android uygulamasını Google Play üzerinden indirirseniz, Google; indirme, yükleme, çökme ve performans verilerini kendi gizlilik politikası kapsamında, Harfhane'den bağımsız olarak işler."
    );
  });

  it('should state Harfhane does not knowingly collect extra data from children (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      "Harfhane, çocuklara özel bir hizmet değildir ve yaş doğrulaması yapmaz; yukarıda sayılanların dışında, bilerek ek bir veri toplamaz."
    );
  });

  // Turkish "İ"/"I" do not case-fold the way the regex /i flag assumes
  // (AGENTS.md: never rely on default casing for Turkish text), so these
  // headings are matched against their exact on-page casing instead.
  it('should render the KVKK headings: veri sorumlusu, işlenen veriler, işleme amacı/hukuki sebep, toplama yöntemi, saklama süreleri, aktarım, haklar, başvuru yolu (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: 'Veri Sorumlusu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'İşlenen Veriler' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Önceki Sürümde Hesap Açtıysanız' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'İşleme Amacı ve Hukuki Sebep (KVKK m.5)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Toplama Yöntemi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Saklama Süreleri' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aktarım ve Yurt Dışına Aktarım' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Haklarınız (KVKK Madde 11)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Başvuru Yolu' })).toBeInTheDocument();
  });

  it('should list all KVKK m.11 rights a through ğ, including c, f and g (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain('a) Kişisel veri işlenip işlenmediğini öğrenme,');
    expect(text).toContain('b) Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,');
    expect(text).toContain(
      'c) Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,'
    );
    expect(text).toContain('ç) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,');
    expect(text).toContain(
      'd) Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,'
    );
    expect(text).toContain(
      'e) Kanunda öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,'
    );
    expect(text).toContain(
      "f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,"
    );
    expect(text).toContain(
      'g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,'
    );
    expect(text).toContain(
      'ğ) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme.'
    );
  });

  it('should describe the application procedure (Tebliğ methods), the 30-day KVKK m.13/2 response obligation and the verified contact address (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toMatch(/Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ/);
    expect(text).toMatch(/Kayıtlı Elektronik Posta \(KEP\)/);
    expect(text).toContain('30 gün');
    expect(text).toMatch(/KVKK m\.13\/2/);
    expect(text).toContain('Başvurunuzu destek@harfhane.app adresine iletebilirsiniz');
    // KVKK m.13/2 is an obligation on the controller, not a target we aim
    // for — "sonuçlandırırız", not "yanıtlamayı hedefliyoruz".
    expect(text).toContain('en geç 30 gün içinde sonuçlandırırız.');
  });

  it('should cite a single, specific legal basis for serving the daily/random word (not a vague "contract or legitimate interest") (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      'Günün kelimesini veya rastgele kelimeyi sunma ve tahmininizi doğrulama: KVKK m.5/2-c (istediğiniz oyun hizmetinin sağlanması için gerekli olması).'
    );
    expect(text).not.toMatch(/sözleşmenin ifası \/ meşru menfaat/);
  });

  // Meaning-level: a mutant flipping "satılmaz" -> "satılır" must fail this.
  it('should state data is not sold or shared with third parties for marketing (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain('Verileriniz satılmaz veya pazarlama amacıyla üçüncü taraflarla paylaşılmaz.');
  });

  it('should disclose the cross-border transfer risk through Cloudflare and Google Play without a pending owner-check placeholder (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      'Bu nedenle, altyapı sağlayıcımız Cloudflare ve Google Play, hizmeti sağlamak amacıyla verilerinizi Türkiye dışında da işleyebilir.'
    );
    expect(text).not.toMatch(/SAHİP KONTROL ETMELİ/);
  });

  it('should describe how policy changes are announced without a pending owner-check placeholder (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain(
      'Bu politikayı güncelleyebiliriz; değişiklik yaptığımızda bu sayfayı ve yukarıdaki "Son güncelleme" tarihini güncelleyerek duyururuz.'
    );
    expect(text).not.toMatch(/SAHİP KONTROL ETMELİ/);
  });

  it('should not set a noindex meta tag (published, not a draft) (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(getRobotsMetaContent()).toBeNull();
  });

  it('should leave no owner-placeholder brackets anywhere on the page (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(normalizedBodyText()).not.toMatch(/\[[^\]]*\]/);
  });
});

describe('sitemap generator', () => {
  it('should list the published privacy route (007-AE1)', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-sitemap.mjs');
    const source = readFileSync(scriptPath, 'utf-8');
    expect(source).toMatch(/\/gizlilik/);
  });
});

describe('navigation/footer link to the published privacy page (007-AE1)', () => {
  it('should reference /gizlilik from the web Settings modal', () => {
    const settingsModalPath = path.resolve(process.cwd(), 'src', 'components', 'SettingsModal.tsx');
    expect(readFileSync(settingsModalPath, 'utf-8')).toContain('/gizlilik');
  });

  it('should not disallow /gizlilik in robots.txt any more', () => {
    const robotsPath = path.resolve(process.cwd(), 'public', 'robots.txt');
    expect(readFileSync(robotsPath, 'utf-8')).not.toMatch(/Disallow: \/gizlilik/);
  });

  it('should list every /gizlilik reference only in files that are expected to mention the published route', () => {
    const srcRoot = path.resolve(process.cwd(), 'src');
    const allowedBasenames = new Set([
      'App.tsx',
      'App.routes.test.tsx',
      'PrivacyPage.tsx',
      'PrivacyPage.test.tsx',
      'structured-data.test.ts',
      'SettingsModal.tsx',
      'SettingsModal.test.tsx',
    ]);
    const offenders: string[] = [];
    listSourceFiles(srcRoot, (filePath) => {
      if (allowedBasenames.has(path.basename(filePath))) return;
      const contents = readFileSync(filePath, 'utf-8');
      if (contents.includes('/gizlilik')) offenders.push(filePath);
    });
    expect(offenders).toEqual([]);
  });
});
