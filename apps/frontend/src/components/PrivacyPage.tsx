import { AlertTriangle } from 'lucide-react';
import { PageMeta } from './page-meta';

// Draft (007 U5): accurate for the no-accounts product as of 2026-10, but
// not yet reviewed by the owner (007 U6). Not linked from any navigation,
// footer, sitemap or store listing until approved — see PageMeta's noIndex.

const PrivacyPage = (): React.JSX.Element => {
  return (
    <>
      <PageMeta
        title="Gizlilik Politikası (Taslak) | Harfhane"
        description="Harfhane gizlilik politikası taslağı — sahip onayı bekliyor."
        canonicalPath="/gizlilik"
        noIndex
      />
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-start gap-3 rounded-lg border-2 border-present bg-present/10 p-4" role="note">
            <AlertTriangle size={20} className="text-present shrink-0 mt-0.5" />
            <p className="text-sm">
              Bu metin bir <strong>taslaktır</strong>, hukuki görüş değildir ve henüz yayınlanmamıştır. Sahibin
              onayından (007 U6) önce hiçbir yerden bağlantı verilmez; arama motorları bu sayfayı dizine
              eklemez.
            </p>
          </div>

          <h1 className="text-2xl font-bold">Gizlilik Politikası (Taslak)</h1>
          <p className="text-sm text-text-secondary">Son güncelleme: [TARİH — sahip tarafından doldurulacak]</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Veri Sorumlusu</h2>
            <p>
              Harfhane (&quot;biz&quot;, &quot;Uygulama&quot;), harfhane.app adresinde ve ilgili Android
              uygulamasında sunulan ücretsiz bir Türkçe kelime oyunudur.
            </p>
            <p>
              <strong>Veri Sorumlusu:</strong> [SAHİP ADI/UNVANI]
              <br />
              <strong>İletişim e-postası:</strong> [İLETİŞİM E-POSTASI — PLACEHOLDER]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">İşlenen Veriler</h2>
            <p>
              Harfhane&apos;de hesap oluşturma, giriş yapma veya profil yoktur — <strong>hesap yoktur</strong>.
              Oyunu oynamak için herhangi bir kişisel bilgi vermeniz gerekmez.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Oyun durumunuz ve istatistikleriniz (seri, geçmiş sonuçlar, tercihler) yalnızca{' '}
                <strong>cihazınızda</strong> tutulur: web sürümünde tarayıcınızın yerel deposunda
                (localStorage), Android uygulamasında cihaz üzerindeki yerel depoda (AsyncStorage). Bu veriler
                sunucularımıza hiçbir zaman gönderilmez.
              </li>
              <li>
                Android&apos;in varsayılan Otomatik Yedekleme (Auto Backup) özelliği açıksa, bu yerel veriler
                cihazınızın Google hesabı yedeğine dahil olabilir; bu, Android&apos;in işletim sistemi
                düzeyindeki bir davranışıdır, Harfhane&apos;in kendi sunucularına veri göndermesi değildir.
              </li>
              <li>
                Uygulama, günün kelimesini almak (<code>/api/words/daily</code>,{' '}
                <code>/api/words/random</code>) ve girdiğiniz tahminin geçerli bir Türkçe kelime olup
                olmadığını kontrol etmek (<code>/api/words/validate</code>) için sunucumuza istek gönderir. Bu
                isteklerde kimliğinizi belirleyen hiçbir bilgi (ad, e-posta, cihaz kimliği vb.) bulunmaz.
              </li>
              <li>
                Bu istekler, barınma sağlayıcımız Cloudflare&apos;in altyapısından geçer; Cloudflare, standart
                sunucu günlüklerinde IP adresinizi işleyebilir. Bu, Cloudflare&apos;in hesap düzeyinde bir
                ayarıdır ve Harfhane kod tabanından görünmez. [SAHİP KONTROL ETMELİ: Cloudflare erişim günlüğü
                tutuluyor mu, ne kadar süreyle?]
              </li>
            </ul>
            <p>
              Uygulamada <strong>reklam</strong> ve üçüncü taraf <strong>analitik/takip</strong> (örn. Google
              Analytics, Sentry, Mixpanel) bulunmaz; çerez (cookie) kullanılmaz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">İşleme Amacı</h2>
            <p>
              Sunucuya giden tek talepler, günlük/sınırsız oyunun çalışması için gereken günün kelimesini
              getirme ve tahmininizin geçerliliğini kontrol etmedir. Başka bir işleme amacı (profil oluşturma,
              reklam hedefleme, pazarlama) yoktur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Aktarım ve Yurt Dışına Aktarım</h2>
            <p>
              Uygulamanın barınma ve API altyapısı <strong>Cloudflare</strong> (Workers, D1 veritabanı, Pages)
              üzerindedir; istekleriniz bu altyapı üzerinden işlenir. D1&apos;in verileri fiziksel olarak hangi
              Cloudflare bölgesinde tuttuğu kod üzerinden belirlenemez. [SAHİP KONTROL ETMELİ: KVKK m.9
              kapsamında gerekli aktarım mekanizması belirlenmeli.]
            </p>
            <p>Verileriniz satılmaz veya pazarlama amacıyla üçüncü taraflarla paylaşılmaz.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Haklarınız (KVKK Madde 11)</h2>
            <p>
              Hesap sistemi olmadığından Harfhane&apos;in kendi sunucularında size ait kişisel bir veri
              bulunmaz; cihazınızdaki oyun verileri tamamen sizin kontrolünüzdedir ve tarayıcı/uygulama
              ayarlarından silinebilir. Buna rağmen KVKK madde 11 kapsamındaki haklarınız (öğrenme, bilgi
              talep etme, düzeltme, silme, aktarıldığı üçüncü kişileri bilme, itiraz etme, zararın
              giderilmesini talep etme) geçerlidir; sorularınız için [İLETİŞİM E-POSTASI] adresine
              yazabilirsiniz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Değişiklikler</h2>
            <p>
              Bu politikayı güncelleyebiliriz; önemli değişikliklerde bu sayfadan duyuracağız. [SAHİP
              KONTROL ETMELİ: bildirim yöntemi.]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">İletişim</h2>
            <p>Sorularınız için: [İLETİŞİM E-POSTASI]</p>
          </section>
        </main>
      </div>
    </>
  );
};

export default PrivacyPage;
