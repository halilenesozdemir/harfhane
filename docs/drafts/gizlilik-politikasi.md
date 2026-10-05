> **TASLAK — hukuki görüş değildir, yayınlanmadan önce sahibi ve gerekirse bir hukukçu onaylamalıdır.**
> Bu metin, Harfhane kod tabanının 2026-10-05 tarihli incelemesine dayanır
> (bkz. `docs/research/2026-10-05-privacy-data-inventory.md`). Köşeli parantez içindeki
> `[...]` alanlar sahip tarafından doldurulmalı veya kontrol edilmelidir.

# Harfhane Gizlilik Politikası

Son güncelleme: [TARİH]

Harfhane ("biz", "Uygulama"), harfhane.app adresinde ve ilgili mobil uygulamada sunulan bir Türkçe
kelime oyunudur. Bu politika, Harfhane'i kullanırken hangi verilerin toplandığını, nasıl işlendiğini
ve haklarınızın ne olduğunu açıklar. Amacımız açık ve anlaşılır olmak; teknik ayrıntıların kaynağı
yukarıda belirtilen veri envanteri dokümanıdır.

## 1. Veri Sorumlusu

**Veri Sorumlusu:** [VERİ SORUMLUSU ADI]
**İletişim e-postası:** [İLETİŞİM E-POSTASI]
**Adres:** [SAHİP KONTROL ETMELİ: tüzel/gerçek kişi adresi, varsa]

[SAHİP KONTROL ETMELİ: Harfhane bir şahıs işletmesi mi, şirket mi? KVKK'da "veri sorumlusu" sıfatı
buna göre değişir.]

## 2. Hangi Verileri Topluyoruz?

Aşağıdaki tablo, kod tabanında doğrulanmış veri kategorilerini listeler.

### 2.1 Hesap oluştururken verdiğiniz veriler
- E-posta adresi, kullanıcı adı, şifre (şifre düz metin olarak hiçbir zaman saklanmaz; yalnızca
  PBKDF2-SHA256 ile, kullanıcıya özel tuzla (salt) üretilmiş bir özet saklanır).
- Google ile giriş yaparsanız: Google'ın bize ilettiği Google kimliği (`google_id`), e-posta ve ad/
  kullanıcı adı. Google'dan aldığımız erişim jetonlarını (access/id token) kendimiz saklamayız.

### 2.2 Oyun verileriniz
- Oynadığınız gün, kelime uzunluğu, tahmin sayısı, kazandınız mı kaybettiniz mi, oyun modu (günlük/
  sınırsız).
- XP, seviye, rozetler, seri dondurma hakları (freeze tokens).
- [SAHİP KONTROL ETMELİ: `/api/duels` ucu kod tabanında halen aktif ve hesabınıza bağlı düello
  kayıtları yazabiliyor; bu uç kapatılana/kaldırılana kadar bu veri kategorisi de geçerlidir ve
  politikaya eklenmelidir. Daha önceki sürümlerde oluşturulmuş düello, turnuva ve liste kayıtları,
  ilgili tablolar kaldırılana kadar veritabanında durur; hesabınızı sildiğinizde bunlar da silinir
  (bkz. Bölüm 7).]

### 2.3 Bildirim tercihleri ve push bildirimleri
- E-posta bildirim tercihiniz (açık/kapalı).
- Tarayıcı push bildirimi için abone olduğunuzda: tarayıcınızın/cihazınızın push uç noktası
  (endpoint) ve şifreleme anahtarları. Bu bilgi, size günlük hatırlatma bildirimi göndermek için
  kullanılır ve o gün oyunu oynamadıysanız tetiklenir.

### 2.4 Cihazda (tarayıcıda) tutulan veriler
Tarayıcınızın `localStorage`'ında, sunucuya gönderilmeyen şu bilgiler tutulur: oturum jetonunuz
(JWT), devam eden/tamamlanan günlük oyun durumu, "nasıl oynanır" ipucunu görüp görmediğiniz,
uygulamayı ana ekrana ekleme isteğini kapatıp kapatmadığınız gibi arayüz tercihleri. Oturum
jetonu, giriş gerektiren isteklerde kimliğinizi doğrulamak için sunucumuza gönderilir; diğer
veriler cihazınızda kalır.

Mobil uygulamada (geliştirme aşamasında) oyun durumu cihaz üzerindeki yerel depolamada
(AsyncStorage) tutulur. Uygulama, günün kelimesini almak ve tahmininizin geçerli bir kelime olup
olmadığını kontrol etmek için sunucumuza istek gönderir; bu isteklerde hesap bilgisi gönderilmez. [SAHİP KONTROL ETMELİ: mobil uygulama ileride sunucuya bağlanırsa bu
bölüm güncellenmelidir.]

### 2.5 Teknik/güvenlik amaçlı veriler
Giriş, kayıt ve şifre sıfırlama isteklerinde kötüye kullanımı önlemek için IP adresiniz kısa süreli
olarak (dakikalar içinde sıfırlanan bir sayaç için) sunucu belleğinde tutulur; bu bilgi veritabanına
yazılmaz. [SAHİP KONTROL ETMELİ: Cloudflare hesap düzeyinde erişim/trafik günlüğü (access log)
tutuyor mu, ne kadar süreyle? Bu, kodda görünmeyen bir hesap ayarıdır.]

### 2.6 Toplamadığımız veriler
Bu incelemede uygulamada şu an **reklam, üçüncü taraf analitik (Google Analytics, Sentry,
Mixpanel vb.) veya takip kodu bulunmamıştır.** Çerez (cookie) kullanılmamaktadır — oturum
doğrulaması tarayıcı yerel deposundaki jeton ile yapılır.

## 3. Verilerinizi Hangi Amaçlarla İşliyoruz?

| Amaç | İşlenen veri | Hukuki sebep (KVKK m.5) |
| --- | --- | --- |
| Hesap oluşturma ve oturum açma | E-posta, kullanıcı adı, şifre özeti, Google kimliği | Sözleşmenin kurulması/ifası |
| Oyun deneyimini sunma, skor ve ilerleme takibi | Oyun sonuçları, XP, rozet, seri | Sözleşmenin ifası |
| Şifre sıfırlama | E-posta, tek kullanımlık sıfırlama bağlantısı | Sözleşmenin ifası / meşru menfaat |
| Günlük hatırlatma bildirimi (e-posta ve/veya push) | E-posta veya push uç noktası, kullanıcı adı | Açık rıza / tercihe bağlı opt-in-opt-out (ayarlardan kapatılabilir) |
| Kötüye kullanımın önlenmesi (rate limiting) | IP adresi (geçici, bellekte) | Meşru menfaat |
| [SAHİP KONTROL ETMELİ: başka amaç varsa eklenmeli] | | |

## 4. Verilerin Aktarımı ve Yurt Dışına Aktarım

Harfhane, aşağıdaki hizmet sağlayıcıları kullanır; bu sağlayıcılar verilerinizi bizim adımıza işler:

- **Cloudflare** (Workers, D1 veritabanı, Pages): uygulamanın barınma ve veritabanı altyapısı.
  Verilerin fiziksel olarak hangi Cloudflare veri merkezinde/bölgesinde tutulduğu, kod üzerinden
  belirlenemez; bu, Cloudflare hesap/proje yapılandırmasına bağlıdır.
  [SAHİP KONTROL ETMELİ: Cloudflare hesap ayarlarından veri işleme bölgesini teyit edin.]
- **Resend** (e-posta gönderim hizmeti): şifre sıfırlama ve günlük hatırlatma e-postaları bu
  hizmet üzerinden gönderilir; e-posta adresiniz bu amaçla Resend'e iletilir.
  [SAHİP KONTROL ETMELİ: Resend'in sunucu/veri işleme konumu ve veri saklama süresi.]
- **Google** (Google ile giriş özelliğini kullanırsanız): Google OAuth akışı sırasında Google,
  kimlik, e-posta ve ad bilgilerinizi bize iletir; bu etkileşim Google'ın kendi gizlilik
  politikasına tabidir.
- **Google Fonts** (fonts.googleapis.com): Uygulama arayüzündeki yazı tiplerini doğrudan Google'ın
  sunucularından yükler. Bu nedenle tarayıcınız bu isteği yaparken IP adresiniz ve standart tarayıcı
  bilgileriniz (user agent gibi) Google'a ulaşır. [SAHİP KONTROL ETMELİ: Fontları kendi
  sunucularımızdan sunmayı (self-host) değerlendirmek isterseniz bu, bu üçüncü taraf aktarımını
  tamamen kaldırır.]

Bu hizmet sağlayıcıların sunucuları Türkiye dışında olabilir; bu durumda KVKK kapsamında yurt dışına
veri aktarımı söz konusu olur. [SAHİP KONTROL ETMELİ: KVKK m.9 kapsamında gerekli aktarım
mekanizması (açık rıza, Kurul kararı, standart sözleşme vb.) belirlenmeli ve burada belirtilmelidir.]

Verileriniz reklam amacıyla satılmaz veya üçüncü taraflarla pazarlama amacıyla paylaşılmaz.

## 5. Saklama Süreleri

- Hesap verileri: hesabınızı silene kadar saklanır (bkz. Bölüm 7).
- Şifre sıfırlama bağlantıları: 1 saat içinde geçerliliğini kaybeder, kullanılsın veya kullanılmasın
  yeni bir talepte öncekiler silinir.
- Push bildirim aboneliği: abonelikten çıkana veya hesabınızı silene kadar saklanır.
- Oyun/skor geçmişi: hesabınızla birlikte saklanır, hesap silindiğinde silinir (bkz. Bölüm 7
  istisnaları).
- [SAHİP KONTROL ETMELİ: Belirli bir azami saklama süresi (örn. "hesap X yıl pasif kalırsa silinir")
  uygulamak istiyorsanız burada belirtilmelidir — şu an kodda böyle bir otomatik silme mekanizması
  yoktur.]

## 6. Veri Güvenliği

Şifreleriniz asla düz metin olarak saklanmaz; yalnızca tek yönlü bir özet (hash) saklanır. Oturum
doğrulaması imzalı bir jeton (JWT) ile yapılır. Push bildirimleri, tarayıcınıza iletilmeden önce
uçtan uca şifrelenir. [SAHİP KONTROL ETMELİ: Ek güvenlik önlemleri (örn. düzenli yedekleme,
erişim kısıtları) varsa eklenmeli.]

## 7. Hesabınızı Silme

Ayarlar bölümünden hesabınızı sildiğinizde, hesabınızla ve oluşturduğunuz her şeyle ilişkili
veriler **kalıcı olarak silinir**: oyun sonuçlarınız, push bildirim abonelikleriniz, şifre
sıfırlama kayıtlarınız, seri dondurma kayıtlarınız, XP/seviye bilgisi ve rozetleriniz.

Hesap silme talebini uygulama içindeki [SAHİP KONTROL ETMELİ: ayarlar menüsü adı/yolu] üzerinden ya
da [İLETİŞİM E-POSTASI] adresine yazarak iletebilirsiniz.

## 8. Haklarınız (KVKK Madde 11)

KVKK'nın 11. maddesi uyarınca şu haklara sahipsiniz:

- Kişisel verinizin işlenip işlenmediğini öğrenme,
- İşlenmişse buna ilişkin bilgi talep etme,
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
- Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,
- Eksik/yanlış işlenmişse düzeltilmesini isteme,
- KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme,
- Düzeltme/silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,
- İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhinize bir
  sonucun ortaya çıkmasına itiraz etme,
- Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.

### Başvuru Yolu

Bu haklarınızı kullanmak için [İLETİŞİM E-POSTASI] adresine yazılı olarak başvurabilirsiniz.
Başvurunuzu [SAHİP KONTROL ETMELİ: azami yanıt süresi — KVKK uyarınca genel kural 30 gündür]
içinde yanıtlamayı hedefliyoruz.

## 9. Google Play Veri Güvenliği Bölümü İçin Özet

[SAHİP KONTROL ETMELİ: Bu bölüm Google Play Console'daki "Data safety" formuna girilecek
bilgilerle birebir eşleşmelidir.]

- **Toplanan veri türleri:** E-posta adresi, kullanıcı adı, oyun içi etkinlik verisi (skor, seri,
  XP), cihaz push bildirim kimliği.
- **Amaç:** Hesap yönetimi, uygulama işlevselliği, bildirimler. Reklam/profilleme amacıyla
  kullanılmaz (bu inceleme tarihinde uygulamada reklam veya profilleme kodu bulunmamıştır).
- **Paylaşım:** Yalnızca hizmet sağlayıcılarla (Cloudflare, Resend, Google OAuth) işlevsellik için
  paylaşılır; satış veya üçüncü taraf pazarlama amacıyla paylaşım yapılmaz.
- **Şifreleme:** Aktarım sırasında şifreleme (HTTPS) kullanılır. [SAHİP KONTROL ETMELİ: "veri
  silinmesi talep edilebilir" kutusunu işaretlemek için bu politikanın Bölüm 7'deki hesap silme
  akışına bir bağlantı eklenmelidir — Google Play, uygulama içinden ayrıca bir "hesap silme" web
  formu da talep edebilir.]

## 10. Çocukların Gizliliği

[SAHİP KONTROL ETMELİ: Harfhane belirli bir yaş grubunu hedefliyor mu? Kod, yaş doğrulaması veya
ebeveyn izni mekanizması içermemektedir; bu nedenle bu bölüm tamamen sahibin ürün/işletme kararına
bağlıdır.]

## 11. Politika Değişiklikleri

Bu politikayı güncelleyebiliriz. Önemli değişikliklerde [SAHİP KONTROL ETMELİ: bildirim yöntemi —
e-posta, uygulama içi duyuru vb.] ile sizi bilgilendireceğiz.

## 12. İletişim

Sorularınız için: [İLETİŞİM E-POSTASI]
