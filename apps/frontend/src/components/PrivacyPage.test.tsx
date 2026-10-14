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

  it('should render the draft heading and the draft-awaiting-approval notice without an internal plan id (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: /gizlilik politikası \(taslak\)/i })).toBeInTheDocument();
    const text = normalizedBodyText();
    expect(text).toContain(
      "Bu metin bir taslaktır, hukuki görüş değildir ve henüz yayınlanmamıştır. Sahibin onayından önce hiçbir yerden bağlantı verilmez."
    );
    // No internal unit id ("007", "U5", "U6") leaks into user-visible text.
    expect(text).not.toMatch(/\b007\b|\bU5\b|\bU6\b/);
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

  it('should list the daily, random and lengths endpoints, not only "günün kelimesi" (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('/api/words/daily')).toBeInTheDocument();
    expect(screen.getByText('/api/words/random')).toBeInTheDocument();
    expect(screen.getByText('/api/words/lengths')).toBeInTheDocument();
    expect(screen.getByText('/api/words/validate')).toBeInTheDocument();
  });

  it('should disclose legacy pre-scope-cut account data may still exist in the database and must not be claimed deleted (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: 'Önceki Sürümde Hesap Açtıysanız' })).toBeInTheDocument();
    const text = normalizedBodyText();
    expect(text).toContain(
      "2026-10-05'teki kapsam kararından önce Harfhane'de hesap, oturum açma ve sunucu tarafında oyun sonucu kaydı vardı."
    );
    // Every legacy data category the reviewer named, not just account basics.
    for (const legacyField of [
      'Google hesap kimliği (google_id)',
      'e-posta bildirim tercihi',
      'kullanıcıların oluşturduğu kelime listeleri ve yorumlar',
      'düello ve turnuva sonuçları',
      'XP ve rozetler',
    ]) {
      expect(text).toContain(legacyField);
    }
    expect(text).toContain(
      'Bu nedenle, o döneme ait bir hesabınız varsa, verilerinizin halen veritabanında bulunabileceğini varsaymalısınız.'
    );
    expect(text).not.toMatch(/(veriler(iniz)?|hesabınız).{0,40}(silinmiştir|tamamen silin|kalıcı olarak silin)/);
  });

  // Meaning-level: a mutant flipping "kullanılmaz" -> "kullanılır" (claiming
  // the legacy data IS actively used) must fail this.
  it('should state legacy data is not used for any processing purpose until it is deleted (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toContain('Bu veriler silininceye kadar herhangi bir işleme amacıyla kullanılmaz.');
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

  it('should describe the application procedure (Tebliğ methods) and the 30-day KVKK m.13/2 response obligation (007-AE1)', () => {
    render(<PrivacyPage />);
    const text = normalizedBodyText();
    expect(text).toMatch(/Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ/);
    expect(text).toMatch(/Kayıtlı Elektronik Posta \(KEP\)/);
    expect(text).toContain('30 gün');
    expect(text).toMatch(/KVKK m\.13\/2/);
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

  it('should set a noindex meta tag on the page', () => {
    render(<PrivacyPage />);
    expect(getRobotsMetaContent()).toBe('noindex');
  });
});

describe('sitemap generator', () => {
  it('should not list the unapproved privacy draft route', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-sitemap.mjs');
    const source = readFileSync(scriptPath, 'utf-8');
    expect(source).not.toMatch(/gizlilik/i);
  });
});

describe('no navigation/footer link to the unapproved draft', () => {
  it('should not reference /gizlilik from any source file other than its own route and tests', () => {
    const srcRoot = path.resolve(process.cwd(), 'src');
    const allowedBasenames = new Set([
      'App.tsx',
      'App.routes.test.tsx',
      'PrivacyPage.tsx',
      'PrivacyPage.test.tsx',
      'structured-data.test.ts',
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
