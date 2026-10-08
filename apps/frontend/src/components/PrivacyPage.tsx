import { AlertTriangle } from 'lucide-react';
import { PageMeta } from './page-meta';

// Draft (plan 007 U5): accurate for the no-accounts product as of 2026-10,
// but not yet reviewed by the owner. Not linked from any navigation,
// footer, sitemap or store listing until approved — see PageMeta's noIndex
// (search engines are not guaranteed to honor it without a server-level
// X-Robots-Tag header, which is a separate, pending change).

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
              onayından önce hiçbir yerden bağlantı verilmez.
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
              <strong>Veri Sorumlusu:</strong> [SAHİP ADI/UNVANI VE ADRESİ]
              <br />
              <strong>İletişim e-postası:</strong> [İLETİŞİM E-POSTASI — PLACEHOLDER]
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">İşlenen Veriler</h2>
            <p>
              Bugün itibarıyla Harfhane&apos;de hesap oluşturma, giriş yapma veya profil yoktur — oyunu oynamak
              için herhangi bir kişisel bilgi vermeniz gerekmez.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Oyun durumunuz ve istatistikleriniz (seri, geçmiş sonuçlar, tercihler) <strong>cihazınızda</strong>{' '}
                tutulur: web sürümünde tarayıcınızın yerel deposunda (localStorage), Android uygulamasında cihaz
                üzerindeki yerel depoda (AsyncStorage). Web sürümü ayrıca oturum deposunda (sessionStorage) bir
                sayfa yenileme zaman damgası tutar. Bu veriler, aşağıda açıklanan istekler dışında sunucularımıza
                gönderilmez.
              </li>
              <li>
                Android&apos;in varsayılan Otomatik Yedekleme (Auto Backup) özelliği açıksa, bu yerel veriler
                cihazınızın Google hesabı yedeğine dahil olabilir; bu, Android&apos;in işletim sistemi
                düzeyindeki bir davranışıdır, Harfhane&apos;nin kendi sunucularına veri göndermesi değildir.
              </li>
              <li>
                Uygulama, günün kelimesini veya sınırsız moddaki rastgele kelimeyi almak (
                <code>/api/words/daily</code>, <code>/api/words/random</code>), oynanabilir kelime
                uzunluklarını almak (<code>/api/words/lengths</code>) ve girdiğiniz tahminin geçerli bir
                Türkçe kelime olup olmadığını kontrol etmek (<code>/api/words/validate</code>) için sunucumuza
                istek gönderir. Bu isteklerde ad, e-posta veya hesap bilgisi gönderilmez.
              </li>
              <li>
                Kötüye kullanımı (aşırı istek) önlemek için sunucumuz, bu isteklerdeki IP adresinizi kısa süreli
                olarak işler: IP adresi ve istek yolu, isteği sınırlamak amacıyla sunucu belleğinde (bir
                Cloudflare Worker&apos;ın geçici belleğinde) sayım bir dakikalık pencerede yapılır; kayıt
                veritabanına yazılmaz, Worker&apos;ın geçici belleğinde Worker yeniden başlayana kadar kalabilir.
              </li>
              <li>
                Bu istekler ve web sayfasının statik dosyaları, barınma sağlayıcımız Cloudflare&apos;in altyapısından
                (Workers ve Pages) geçer; Cloudflare da bu sırada IP adresinizi kendi standart sunucu
                günlüklerinde işleyebilir. Bu günlüklerin tutulup tutulmadığı ve saklama süresi, Cloudflare&apos;in
                kendi gizlilik politikasına ve hesap ayarlarına bağlıdır, Harfhane kod tabanından belirlenemez.
                [SAHİP KONTROL ETMELİ: Cloudflare erişim günlüğü ve Bot Fight Mode gibi ayarlar tutuluyor mu, ne
                kadar süreyle?]
              </li>
              <li>
                Android uygulamasını Google Play üzerinden indirirseniz, Google; indirme, yükleme, çökme ve
                performans verilerini kendi gizlilik politikası kapsamında, Harfhane&apos;den bağımsız olarak
                işler.
              </li>
            </ul>
            <p>
              Uygulamada <strong>reklam</strong> ve üçüncü taraf <strong>analitik/takip</strong> (örn. Google
              Analytics, Sentry, Mixpanel) bulunmaz; Harfhane kendi tarafında çerez (cookie) kullanmaz.
            </p>
            <p>
              Harfhane, çocuklara özel bir hizmet değildir ve yaş doğrulaması yapmaz; yukarıda sayılanların
              dışında, bilerek ek bir veri toplamaz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Önceki Sürümde Hesap Açtıysanız</h2>
            <p>
              2026-10-05&apos;teki kapsam kararından önce Harfhane&apos;de hesap, oturum açma ve sunucu tarafında
              oyun sonucu kaydı vardı. Bu özelliklerin kodu kaldırılmıştır, ancak o dönemde oluşturulmuş olabilecek
              veriler (e-posta, kullanıcı adı, şifre özeti, Google hesap kimliği (google_id), e-posta bildirim
              tercihi, oyun sonuçları, kullanıcıların oluşturduğu kelime listeleri ve yorumlar, düello ve turnuva
              sonuçları, XP ve rozetler, push bildirim aboneliği, şifre sıfırlama kayıtları gibi) veritabanı
              şemasından henüz silinmemiştir; bu tabloları kalıcı olarak silecek işlem hazırlanmış ama sahibin
              onayı beklenmektedir ve bu onay/uygulama henüz gerçekleşmemiştir. Bu veriler silininceye kadar
              herhangi bir işleme amacıyla kullanılmaz. Bu nedenle, o döneme ait bir hesabınız varsa,
              verilerinizin halen veritabanında bulunabileceğini varsaymalısınız.
            </p>
            <p>
              Eski hesabınızla ilgili verilerin önceden silinmesini talep etmek için [İLETİŞİM E-POSTASI]
              adresine yazabilirsiniz; talebiniz aşağıdaki &quot;Başvuru Yolu&quot; bölümünde açıklanan süre
              içinde sonuçlandırılır.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">İşleme Amacı ve Hukuki Sebep (KVKK m.5)</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Günün kelimesini veya rastgele kelimeyi sunma ve tahmininizi doğrulama: KVKK m.5/2-c (istediğiniz
                oyun hizmetinin sağlanması için gerekli olması).
              </li>
              <li>İstek sınırlama (rate limiting) için IP adresinin geçici işlenmesi: meşru menfaat (KVKK m.5/2-f).</li>
              <li>
                Eski hesap verileri (yukarıdaki bölüm): o dönemde KVKK m.5/2-c kapsamında toplanmıştı; bu veriler
                silinmek üzere planlanmıştır, silininceye kadar herhangi bir işleme amacıyla kullanılmaz, Başvuru
                Yolu üzerinden daha önce silinmesini talep edebilirsiniz.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Toplama Yöntemi</h2>
            <p>
              Yukarıda sayılan veriler, uygulamayı kullanırken otomatik yöntemlerle ve elektronik ortamda (tarayıcı
              veya mobil uygulama üzerinden sunucumuza yapılan isteklerle) toplanır; manuel veya kâğıt üzerinden
              bir veri toplama yoktur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Saklama Süreleri</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cihazınızdaki oyun verileri: siz silene veya uygulamayı kaldırana kadar.</li>
              <li>
                İstek sınırlama için bellekteki IP kaydı: bir dakikalık sayım penceresi; kayıt veritabanına
                yazılmaz, Worker&apos;ın geçici belleğinde Worker yeniden başlayana kadar kalabilir.
              </li>
              <li>
                Cloudflare&apos;in kendi erişim günlükleri: Cloudflare&apos;in kendi politikasına/hesap ayarına
                bağlı. [SAHİP KONTROL ETMELİ.]
              </li>
              <li>
                Eski hesap verileri: silme işleminin sahip onayıyla uygulanmasına kadar veritabanında kalır; bu
                süre içinde herhangi bir işleme amacıyla kullanılmaz ve henüz kesin bir tarih belirlenmemiştir.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Aktarım ve Yurt Dışına Aktarım</h2>
            <p>
              Uygulamanın barınma ve API altyapısı <strong>Cloudflare</strong> (Workers, D1 veritabanı, Pages)
              üzerindedir; istekleriniz bu altyapı üzerinden işlenir. D1&apos;in verileri fiziksel olarak hangi
              Cloudflare bölgesinde tuttuğu kod üzerinden belirlenemez. Android uygulamasını Google Play&apos;den
              indirirseniz Google, indirme/çökme verilerini kendi politikası kapsamında işler. [SAHİP KONTROL
              ETMELİ: KVKK m.9 kapsamında gerekli aktarım mekanizması belirlenmeli.]
            </p>
            <p>Verileriniz satılmaz veya pazarlama amacıyla üçüncü taraflarla paylaşılmaz.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Haklarınız (KVKK Madde 11)</h2>
            <p>KVKK&apos;nın 11. maddesi uyarınca, veri sorumlusuna başvurarak şu haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>a) Kişisel veri işlenip işlenmediğini öğrenme,</li>
              <li>b) Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,</li>
              <li>
                c) Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını
                öğrenme,
              </li>
              <li>ç) Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,</li>
              <li>d) Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
              <li>e) Kanunda öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,</li>
              <li>
                f) (d) ve (e) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere
                bildirilmesini isteme,
              </li>
              <li>
                g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin
                kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme,
              </li>
              <li>
                ğ) Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın
                giderilmesini talep etme.
              </li>
            </ul>
            <p>
              Hesap sistemi olmadığından Harfhane&apos;nin kendi sunucularında aktif olarak işlediği, kimliğinizle
              eşleşen bir veri bugün bulunmaz; cihazınızdaki oyun verileri tamamen sizin kontrolünüzdedir. Eski bir
              hesabınız varsa yukarıdaki &quot;Önceki Sürümde Hesap Açtıysanız&quot; bölümü geçerlidir.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Başvuru Yolu</h2>
            <p>
              Bu haklarınızı, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ&apos;e uygun şekilde;
              yazılı olarak, Kayıtlı Elektronik Posta (KEP) adresi, güvenli elektronik imza, mobil imza ya da
              Harfhane&apos;ye önceden bildirip sistemde kayıtlı bulunan bir e-posta adresi üzerinden
              kullanabilirsiniz. Başvurunuzu [İLETİŞİM E-POSTASI] adresine iletebilirsiniz; talebinizi, KVKK m.13/2
              uyarınca en geç <strong>30 gün</strong> içinde sonuçlandırırız.
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
