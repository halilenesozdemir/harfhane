# Solmaya Mikro Frontend Workspace

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ [Nx workspace](https://nx.dev) kullanarak oluşturulmuş mikro frontend projesi ✨.

## releasable a PR gönderdikten sonra yapılması gerekenler.

Hem çalışılan remote, hem de workspace releasable branch e alınarak remote tekrar ayağa kaldırılmalı ve hata olup olmadığı kontrol edilmelidir. Workspace ve remote uygulamanın releasable branch üzerinde senkron olduğu görülmelidir.

## Repo Url leri

- workspace: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-workspace.git
- shell: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-shell.git
- addressmanagement: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-address-management.git
- freeze: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-freeze.git
- products: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-products.git
- transfer: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-transfer.git
- newsales: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-new-sales.git
- relocation: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-relocation.git
- packagechange: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-package-change.git
- campaignchange: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-campaign-change.git
- corporatenewsales: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-corporate-new-sales.git
- customercommunicationinfo: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-customer-communication-info.git
- customergroupmanagement: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-customer-group-management.git
- customerindividualcreation: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-customer-individual-creation.git
- orders: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-orders.git
- portmanager: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-port-manager.git
- serviceavailability: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-service-availability.git
- socialsupport: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-social-support.git
- termination: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-termination.git
- modemchange: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-modem-change.git
- customerindividualinfo: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-customer-individual-info.git
- portchange: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-port-change.git
- customerprofilelist: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-customer-profile-list.git
- customerbillaccount: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-customer-bill-account.git
- profilemanagement: https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-profile-management.git

## Kod Standartları

Kod standartları ve code review kontrol listesi için aşağıdaki linki inceleyebilirsiniz:

- [FE Code Review Checklist](https://confluence.turkcell.com.tr/pages/viewpage.action?spaceKey=CRMFE&title=FE+Code+Review+Checklist)

## Gereksinimler

Bu proje aşağıdaki sürümlerde geliştirilmiş ve test edilmiştir:

- **Node.js:** v22.14.0 veya üzeri

Farklı sürümler kullanıldığında uyumluluk sorunları yaşanabilir.

## Projeyi Kolanlamak

```sh
git clone --recurse-submodules https://stash.turkcell.com.tr/git/scm/sm284399/solmaya-mfe-workspace.git

git submodule update --remote --checkout --merge --recursive
git submodule foreach 'git checkout integration || :'
git submodule foreach 'git pull origin integration || :'
```

komutu ile tüm submoduller çekilebilir

## Tüm submodule'leri en son duruma güncellemek

```sh
git submodule update --remote
```

## Belirli bir submodule'ü güncellemek

```sh
git submodule update --remote apps/<modül-adı>
```

## Submodule'lerin durumunu kontrol için aşağıdaki komut kullanılabilir

```sh
git submodule status
```

## Kurulum

Projeyi klonladıktan sonra, bağımlılıkları yüklemek için:

```sh
npm install
```

## Uygulamaları Çalıştırma

### Shell Uygulamasını Çalıştırma (Ana Uygulama)

Shell uygulaması, tüm mikro frontend uygulamalarını barındıran ana uygulamadır. Aşağıdaki komutla başlatabilirsiniz:

```sh
nx serve shell
```

### Shel Ugulamasını Remote Uygulamaları Derlemeden Çalıştırmak

Bu komut ile eğer remote uygulamalar zaten derlenmiş ise tekrar derlenmeden shell ayağa kalkar.

```sh
nx serve shell --devRemotes=çalıştığınız-remote-uygulama
nx serve shell --devRemotes=relocation
```

Bu komut, `http://localhost:4200` adresinde shell uygulamasını başlatır.

### Spesifik Bir Mikro Frontend Uygulamasını Çalıştırma

Remote uygulamanın bağımsız olarak (eager:true ile) ayağa kalkmasını istiyorsanız aşağıdaki komutu kullanabilirsiniz:

Macos

```sh
STANDALONE=true nx serve relocation
STANDALONE=true nx serve <remote-adi>
```

Windows

```sh
$env:STANDALONE="true"; npx nx serve relocation
$env:STANDALONE="true"; npx nx serve <remote-adi>
```

Bu şekilde, ilgili remote uygulama shell olmadan kendi başına çalışır ve module federation ayarlarında eager:true olur.

Bu komut, `http://localhost:4201` adresinde relocation uygulamasını başlatır.

## Route Path Tanımları Hakkında Önemli Not

- Route path'lerinde, React Router'ın doğru şekilde çalışabilmesi için path'lerin başında mutlaka '/' olmalıdır.
- Örneğin, relocation-router.tsx dosyasında olduğu gibi:

```typescript
const basePath = globalState.basePathDisabled ? "/" : "/relocation/";
```

Yanlış:

```typescript
<Route path={"service-selection"} element={<Component />} />
```

Doğru:

```typescript
<Route path={"/service-selection"} element={<Component />} />
```

Bu şekilde, route'larınızın path'leri hem shell hem de remote uygulamalarda doğru şekilde eşleşir ve yönlendirme sorunsuz çalışır.

## Önemli: Doğru Import Kuralları

- **apps** altındaki tüm importlar mutlaka `@component-lib` alias'ı ile yapılmalıdır.
- **component-lib** kütüphanesi içindeki dosyalar ise birbirlerine **relative path** ile import edilmelidir.
- aksi durumda farklı instance oluşacağı için hata oluşacaktır

Yanlış (component-lib içinde):

```typescript
import { AppProgressBar } from "@component-lib";
```

Doğru (component-lib içinde):

```typescript
import { AppProgressBar } from "../app-progress-bar/app-progress-bar";
```

Doğru (apps altında):

```typescript
import { AppProgressBar } from "@component-lib";
```

Yanlış (apps altında):

```typescript
import { AppProgressBar } from "../app-progress-bar/app-progress-bar";
import { CONTRACT_DETAIL_STATUS, OFFER_HEAD, PERSUASION_ROLE } from "libs/component-lib/src/lib/constants/constants";
```

## Modül Özel Environment Dosyaları

Her modül için özel environment dosyaları oluşturulmuştur. Bu dosyalar, ortak environment yapısını (`SharedEnvironment`) extend ederek modüle özel ayarları içerir. Örneğin, `apps/addressmanagement/src/environments/environment.ts` dosyasında `AddressManagementEnvironment` interface'i, `SharedEnvironment`'ı extend eder ve modüle özel flag'leri tanımlar:

```typescript
import { SharedEnvironment, environment as defaultEnvironment } from "@environment";

interface AppEnvironment extends SharedEnvironment {
  appSpecificFlags?: {
    enableNewFeatures?: boolean;
  };
}

export const environment: AppEnvironment = {
  ...defaultEnvironment,
  appSpecificFlags: {
    enableNewFeatures: false,
  },
};
```

Bu yapı sayesinde her modül, ortak environment ayarlarını korurken kendi özel ayarlarını da ekleyebilir.

environment.name değeri bulunan ortamı belirtir. "DEVELOPMENT" -> lokal, "STB" -> stable-test, "PROD" -> prp veya production.
Bu değerler ile herhangi bir ekran veya komponent ortama göre gizlenebilir. Daha detaylı kontroller için appSpecificFlags gibi kontroller uygulanabilir.

environment.ts -> Lokal ortamda kullanılır
environment.stb.ts -> Stable yani test ortamında geçerlidir.
environment.prod.ts -> PRP ve prod ortamında kullanılır.

### Port Numaraları

- Shell: 4200
- Relocation: 4201
- Address Management: 4202
- Campaign Change: 4203
- Diğer servisler takip eden portlarda...

## Test Coverage Raporu

Bu komutlar çalıştırıldığında, her projenin coverage dizininde lcov.info dosyası oluşturulacaktır.
Bu raporları CI/CD araçlarınızda (örneğin SonarQube, Codecov vb.) kullanabilirsiniz.

### Tek bir proje için

```
nx test your-app --coverage
```

### Tüm projeler için

```
nx run-many --target=test --all --coverage
```

### Coverage Çıktısını Browserda Görüntüleme

Raporun çıktısını browserda görüntülemek için aşağıdaki komut coverage/apps/uygulama-adi dizininde çalıştırılabilir.

```
npx http-server -o -p ${isteğe-bağlı-port-numarası}
```

## Mikro Frontend (MFE) Uygulama Kurulumu

Yeni bir mikro frontend uygulaması oluşturduğunuzda veya mevcut uygulamaları entegre etmek istediğinizde, `relocation` modülünü örnek alarak aşağıdaki düzenlemeleri yapmanız gerekmektedir:

1- nx g @nx/react:remote apps/myremote --host=shell
2- ilgili repoya git init ve ilk commit push işlemleri yapılır.

git init
git add --all
git commit -m "Initial Commit"
git remote add origin repo-url
git push -u origin HEAD:integration

3- git submodule add repo-url apps/remote
4- Aşağıdaki Yapılması Gereken Değişiklikler başlığı altındaki değişiklikler tamamlanır.
5- shell altında main-router içine route tanımları yapılır.
6- .gitmodules dosyasına submodule doğru eklenmiş mi kontrol edilir.
7- tsconfig.base.json dosyasına submodule doğru eklenmiş mi kontrol edilir.

8- Shell altındaki jenkinsfile içine
stages-environment altına
repo = "stash.turkcell.com.tr/git/scm/${bitbucketProjectName}/repo.git"
stages-steps altına
sh "rm -rf module && git clone -b ${env.BRANCH_NAME} https://$username:$password@${module} module"

### Yapılması Gereken Değişiklikler

1. **Module Federation Yapılandırması**

   - `/apps/relocation/module-federation.config.ts` dosyasını inceleyerek kendi uygulamanız için düzenleyin

2. **Webpack Yapılandırması**

   - `/apps/relocation/webpack.config.ts` dosyasını örnek alarak CSS, font ve SVG ayarlarını yapın

3. **Theme Dosyası Ekleme**

   - `/apps/relocation/theme.ts` dosyasını referans alarak tema ayarlarını yapın (Bu dosya ortaklaştırılacak)

4. **Bootstrap Dosyasını Düzenleme**

   - `/apps/relocation/src/bootstrap.tsx` dosyasını örnek alarak, uygulamanın bağımsız çalışmasını düzenleyin
   - `basePathDisabled: true` parametresi uygulamanın bağımsız çalıştığını belirtir

5. **Remote Entry Dosyasını Düzenleme**

   - `/apps/relocation/src/remote-entry.ts` dosyasını örnek alarak shell ve bağımsız modları ayarlayın

6. **Babel Yapılandırması**

   - `/apps/relocation/.babelrc` dosyasını örnek alarak gerekli dönüşümleri ayarlayın

7. **Project.json Düzenlemesi**

   - `/apps/relocation/project.json` dosyasındaki `styles` bölümünü referans alın
   - e2e klasörü altındaki `project.json` dosyasındaki `"implicitDependencies": [],` olacak şekilde düzenlenmeli

8. **Router Yapılandırması**

   - `/apps/relocation/src/app/relocation-router/relocation-router.tsx` dosyasını referans alarak shell/bağımsız mod için path yönetimini ayarlayın:

   ### Routes Bileşeni Suspense il eSarmalanmalı

   ```typescript
   <React.Suspense fallback={null}>
     <Routes>
       <Route path={"/service-selection"} element={<RelocationServiceSelection />} />
     </Routes>
   </React.Suspense>
   ```

9. **rem mixin**

   - rem mixini artık \_rem olarak kullanıyoruz. sass kendi içerisinde rem isminde bir metod ile geldiğinden çakışmayı önlemek için bu değişiklik yapıldı.

10. **mixin import**

- stil dosyalarına herhangi bir import yapılmaması gerekiyor. gerekli scss bağımlılıkları otomatik olarak yükleniyor.

```typescript
// Path ayarlaması örneği
const { globalState } = useGlobalContext();
const basePath = globalState.basePathDisabled ? "" : "uygulama-adi";

// Tüm route ve linklerde bu değişkeni kullanın
<Route path={`${basePath}/sayfa`} element={<Sayfa />} />;
```

11. **.browserslistrc Dosyası Ekleme**

- `/apps/relocation/.browserslistrc` kopyalanarak yeni module'e eklenmelidir.

12. **polyfills.ts Dosyası Ekleme**

- `/apps/relocation/src/polyfills.ts` kopyalanarak yeni module'e eklenmelidir.

13. **Jenkinsfile Dosyası Ekleme**

- `/apps/relocation/Jenkinsfile` kopyalanarak yeni module'e eklenmelidir.

## Geliştirme Kılavuzu

### Yeni Mikro Frontend Modülü Oluşturma

Yeni bir mikro frontend (remote) uygulaması oluşturmak için NX CLI'ı ve Module Federation'ı kullanmalısınız:

```sh
# Önce host template ile remote uygulama oluşturun
nx g @nx/react:remote apps/myremote --host=shell
```

- Shell uygulamasının `main-router.tsx` dosyasında, yeni uygulamanızı import edin ve route ekleyin

Bu şekilde, zaten çalışan bir yapıyı örnek alarak hızlıca yeni bir MFE ekleyebilirsiniz.

## Sorun Giderme

### Import Hataları

TypeScript `@component-lib` gibi importları tanımıyorsa, uygulamanın `tsconfig.app.json` dosyasına paths ekleyin, örnek: `/apps/relocation/tsconfig.app.json`

## Derleme

Uygulamaları üretim için derlemek istiyorsanız (Tüm remote uygulamarı da beraberinde derler):

```sh
nx build shell
```

### Remote Uygulamaları Dahil Etmeden Tek Daşına Derlemek --excludeTaskDependencies parametresi eklenir

```sh
nx build shell --excludeTaskDependencies
```

Veya spesifik bir modül için:

```sh
nx build relocation
```

---

### Tablet veya ekranlarda oluşan notificationların sayfa üzerinde kalması durumunda şu kullanımı yapabilirsiniz

```typescript
// Yeni kullanım
import { NotificationService } from "@component-lib";

// Başarılı işlem bildirimi
NotificationService.success("İşlem başarıyla tamamlandı.");

// Hata bildirimi
NotificationService.error("Bir hata oluştu, lütfen tekrar deneyin.");

// Bilgi bildirimi
NotificationService.info("Bu bir bilgi mesajıdır.");

// Uyarı bildirimi
NotificationService.warning("Dikkat, bu işlem geri alınamaz!");

// Özel başlıkla bildirim
NotificationService.success("Kayıt işlemi tamamlandı.", "Müşteri Kaydı", 6);

// JSX içerikli bildirim
NotificationService.info(
  <div>
    <p>
      Detaylı bilgi için <a href="#">buraya tıklayın</a>
    </p>
    <ul>
      <li>Madde 1</li>
      <li>Madde 2</li>
    </ul>
  </div>,
  "Önemli Duyuru",
);
```

## Nx Workspace Hakkında

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/react-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created.

### Run tasks

To see all available targets to run for a project, run:

```sh
npx nx show project test
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/react:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/react:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/react-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
