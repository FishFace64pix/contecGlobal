# ContecPark — Detaylı Proje İncelemesi ve Öneriler

Tarih: 14 Nisan 2026
Kapsam: `index.html`, `app.js` (~1527 satır), `animations.js`, `styles.css` (~2649 satır), varlık klasörleri (`img/`, `video/`, `bilgiler ve gorseller/`, `yeni bilgiler/`), `vercel.json`, SEO dosyaları, yardımcı scriptler.

---

## 1. Genel Mimari Değerlendirmesi

Site **tek sayfa uygulama (SPA)** mantığıyla çalışıyor:

- `index.html` iskelet (header + footer + modal + intro + `<main id="app">`).
- `app.js` içinde `route()` fonksiyonu `location.pathname`’a göre `renderHome()`, `renderProducts()`, `renderProductDetail(slug)`, `renderAbout()` çıktılarını `#app` içine yazıyor.
- Vercel'de `rewrites` ile tüm istekler `index.html`’e yönleniyor (client-side routing çalışsın diye).
- `animations.js` ayrı dosyada, `#app` üzerinde MutationObserver ile yeniden animasyon init’i yapıyor.
- Çoklu dil (`T` objesi içinde `ro` ve `en`), `localStorage`’da saklanıyor.

### Güçlü yönler
- Premium bir estetik var: intro zoom-out, aurora blob, parallax water, 360 viewer, ürün modal’ı, özel kursör, Tritan renk simülasyonu (grayscale + mask + tint).
- i18n temiz bir nesne üzerinden yürüyor; SEO title/description dinamik güncelleniyor.
- JSON-LD schema.org hem `Organization` hem `Product` hem `FAQPage` üretiyor, bu SEO için iyi.
- Routing için `history.pushState` + `popstate` kullanımı doğru.

### Temel problemler (kritik)
1. **app.js 81KB / 1527 satır**: render + router + validasyon + modal + cursor + 360 viewer + cookies hepsi tek dosyada.
2. **Static asset boyutları felaket:**
   - `video/hero-bg.mp4` **222 MB**
   - `bilgiler ve gorseller/Clip Contec v4.mp4` **222 MB** (aynı video iki yerde!)
   - `img/products/bottle-classic.png` **5 MB**, `bottle-handle-left.png` **5.2 MB**, `bottle-handle-right.png` **4.7 MB**
   - Sadece product folder **14.7 MB** statik PNG.
3. **Slug / route tutarsızlığı**: Footer ve bazı linkler `/products/bidon-19l-clasic`, `/products/bidon-19l-maner`, `/products/capac-bidon` kullanıyor. Ama `renderProductDetail` sadece `bottle-tritan`, `bottle-polycarbonate`, `capac-bidon` slug’larını tanıyor. Yani **footer linkleri tıklanınca ürün sayfası AÇILMAZ, anasayfaya düşer**. Bu büyük bir bug.
4. **Gereksiz ürün kalıntıları**: Kod içinde `prod_rack_desc`, `rack_uses`, `rack_faqs`, `img-rack.png` hâlâ duruyor. Senin notun (`gunvel` dosyası) diyor ki: *“sitede bunlardan disinda hicbir urun olmayacak”* (Tritan şişe / Polikarbonat şişe / kapak). Rack tamamen temizlenmeli.
5. **Kurumsal sır sızıntısı**: `web3forms` access key (`dd03729a-50ce-4e4c-95e8-1a780f183400`) HTML’de açık. Kötü niyetli biri buna spam yağdırabilir → rate-limit / hCaptcha ekle.
6. **`cursor: none` body seviyesinde**: erişilebilirlik açısından problemli. Klavye kullananları, engelli kullanıcıları ve mobil kullanıcıları düşünerek sadece `@media (hover: hover) and (pointer: fine)` içinde uygulanmalı.
7. **Intro her ziyarette oynuyor**: Geri dönen kullanıcılar için sinir bozucu. `sessionStorage` ya da `localStorage` ile “gösterildi mi?” kontrolü gerekli (ya da sadece bir kereliğine).
8. **Scroll listener leak (animations.js)**: `initAll()` her DOM değişiminde (her route’da) tekrar çağrılıyor. `_seqScrollHandler` referansı tutuluyor ama `tick` fonksiyonu her seferinde **yeni bir referans** olarak atanıyor → `_seqScrollHandler` sadece kendisinden sonra geleni iptal ediyor. Sonuç: 3-4 sayfa gezdikten sonra **aynı scroll event'inde 4-5 tick() birden koşuyor**. Performans düşüşü.
9. **Çift language `<link rel="alternate" hreflang>`**: İkisi de `/`’ye yönlendiriyor (ro ve en aynı URL). Google için anlamsız. Ya gerçek dil URL’leri kurulmalı (`/ro/`, `/en/`) ya da query param mantığı.
10. **Mobil menü kapalı iken de hamburger ikonu tüm genişliklerde görünüyor**: `#main-nav` gizleme kuralları CSS’de var mı, kontrol edilmeli. (CSS dosyası 2649 satır, bu incelemenin kapsamında tam detay çıkarılmadı — manuel test şart.)

---

## 2. HTML / Meta / SEO

### Sorunlar
- `<meta property="og:image" content="og-image.jpg">` ama site kökünde `og-image.jpg` **yok**. Sosyal medyada paylaşınca kırık önizleme.
- `schema.org Organization` başlangıçta `url: "#"` ve `logo: "#"` ile donmuş. `updateSEO()` sonra düzeltiyor ama ilk render’da crawler hatalı veri çekebilir.
- `<link rel="icon">` / favicon yok. Tarayıcı sekmesinde generic icon çıkıyor.
- `<meta name="robots">`, `<meta name="author">`, `<meta name="theme-color">` yok.
- `<meta name="viewport">` doğru, ama `maximum-scale` eklenmemiş (a11y açısından iyi — dokunma).
- `preconnect` var, ama `preload` yok (kritik font/css/hero bottle image için `rel="preload"` önerilir).
- `sitemap.xml` 970 byte — ürün sayfaları dahil mi diye teyit etmek lazım; slug’lar tutarsız olduğu için muhtemelen bozuk.
- `robots.txt` sadece 67 byte — `Sitemap:` satırı var mı kontrol et.

### Öneriler
1. Her dil için ayrı kanonik URL şeması:
   - `/` (RO default) + `/en/` (EN prefiksli).
   - `hreflang="ro"` → `https://contecpark.com/`
   - `hreflang="en"` → `https://contecpark.com/en/`
   - `hreflang="x-default"` → `https://contecpark.com/`
2. `og-image.jpg` dosyasını oluştur (1200×630, marka logosu + damacana fotoğrafı).
3. Favicon seti ekle: `favicon.ico`, `apple-touch-icon.png`, `favicon-32.png`, `favicon-16.png`, `site.webmanifest`.
4. `<meta name="theme-color" content="#0071E3">` ekle (mobil adres çubuğu rengi).
5. Ürün sayfaları için Breadcrumb schema (`BreadcrumbList`) ekle.
6. `LocalBusiness` schema ekle (adres, telefon, çalışma saatleri) — B2B üreticiler için Google arama panelinde çok etkili.

---

## 3. JavaScript Mimarisi (app.js)

### Kritik refactor önerileri
1. **Modüller halinde böl** (native ES modules — Vercel rahat destekler):
   - `i18n.js` — `T` objesi ve `setLang`/`t`.
   - `router.js` — `route`, history bağlama, link capture.
   - `pages/home.js`, `pages/products.js`, `pages/product-detail.js`, `pages/about.js` — render fonksiyonları.
   - `components/cursor.js`, `components/modal.js`, `components/form.js`, `components/cookies.js`, `components/intro.js`.
   - `components/viewer360.js`, `components/color-tint.js`.
   - `utils/seo.js`.
2. **Ürün verisini tek bir yerde topla**: `renderProductDetail` içinde `products = { … }` objesi var; aynı veri `initProductModal()` içinde **tekrar** tanımlanıyor. Bu Single Source of Truth ihlali. `data/products.js` dosyası oluştur, ikisi de onu import etsin.
3. **`renderHome` / `renderProducts` içinde tekrarlanan 3 ürün kartı bloğu var**: DRY ihlali. `ProductCard({slug, badge, img, name, desc})` fonksiyonu çıkar.
4. **Inline style spam**: Özellikle `Industrial Journey` bölümünde, events listesinde, Tritan highlight’ta HTML içinde `style="..."` ile CSS gömülü. Bunları `styles.css`’e taşı, component-class yapısı oluştur (`.journey-item`, `.event-item`, `.tritan-card`). Stil ile HTML ayrılınca bakım süresi yarıya iniyor.
5. **`window.updateActiveImg` boş bırakılmış** (yorum: “Kept for backward compatibility if needed”) — sil, ölü kod.
6. **`add-cookies.js`, `fix-cookies.js`, `fix-email.js`, `fix-form.js`, `remove-maintenance.js`, `apply-changes.js`, `migrate.js`** — bunların hepsi geçmiş tek seferlik migration script’leri. **Kökü kirletiyor, production build’e dahil edilirse yanlışlıkla çalışabilir**. `scripts/` klasörüne taşı ya da sil.
7. **`.vercelignore` ve `.gitignore`** küçük; `node_modules`, `.DS_Store`, `video/*.mp4` (eğer CDN kullanılacaksa) gibi maddeler eklenmeli.

### Ufak ama önemli hatalar
- `products.bottle-polycarbonate.col = 'bottle_color'` ama `bottle_color` i18n sözlüğünde **tanımlı değil**. Fallback `T.ro[key] || key` olduğundan tablo hücresine ham `bottle_color` string’i düşüyor. Ekle ya da sabit değere çevir.
- `handleFormSubmit` içinde `btn.innerHTML = '⏳ Se trimite...'` hard-coded Romence. EN modda da böyle gözükür. i18n key kullan (`form_sending`).
- Hata mesajları (`'❌ A apărut o eroare…'`) da sabit Romence — aynı şekilde çevir.
- `initParticles` içinde `prefers-reduced-motion` kontrolü **döngünün içinde** yapılıyor, her frame’de hesaplanıyor. Döngü başlamadan kontrol et ve statik frame çiz.
- `initCustomCursor`: `a, button, .product-card` seçicisi sadece ilk yüklemede çalışıyor; router sonrası yeni render edilen linkler hover efektini almıyor. Event delegation kullan (document’e hover listener).
- `initFAQs()` çift binding riski var — SPA yeniden render’da önceki listener’lar temizlenmiyor; fakat `#app` içeriği tümüyle değiştiği için DOM elementleri zaten gidiyor. Yine de `initMagneticElements` ve `init3DTilt` dataset flag kullanıyor (iyi), onlara benzet.
- `scrollToContact`: contact form `about` sayfasında. Home veya products’tayken tıklanırsa hiçbir şey olmaz. Önce `/about` navigasyonu yap, sonra scroll.
- `document.title = pageTitle;` set edildikten sonra `document.querySelector('meta[name="description"]')?.setAttribute('content', t(descKey));` — ürün sayfalarında description hâlâ generic products description kalıyor; ürüne özel description üret.

---

## 4. Tasarım / Kullanıcı Deneyimi

### Çok iyi olanlar
- Apple-style minimalist paleti (`#FBFBFD` bg, `#0071E3` mavi, `Manrope` font).
- Clamp’li responsive typography.
- Pin/scroll sekansı (6 frame damacana animasyonu) gerçekten etkileyici.
- Gölge ve border-radius tutarlı (`--radius-lg: 24px`).

### İyileştirmeler
1. **Intro**:
   - Her ziyarette 2.5s bekletiyor. En azından `sessionStorage.contecpark_intro_seen` ile aynı oturumda tekrar atma.
   - Skip butonu görünür ama sağ üstte küçük — daha belirgin yap.
   - Prefers-reduced-motion tercihi olan kullanıcılar için intro’yu tamamen atla.
2. **Hero**:
   - Hero hem partikül canvas hem aurora blob hem su-SVG hem wave SVG hem video (gizli 222MB) hem 3D pin-section içeriyor → **mobil cihazlarda jank**. En az birini elemeli. Önerim: hero-bg.mp4’ü at, video’yu ayrı bir “tanıtım” bölümüne koy.
   - Pin-section’daki bottle sequence frame’leri `.webp` (iyi) ama `Pozitie 1.webp` dosya adında boşluk var → URL-encode gerekiyor. Boşluksuz isimlerle yeniden adlandır (`pos-1.webp`).
3. **Ürün sayfası (renderProductDetail)**:
   - Tritan için 7 frame var ama Polycarbonate için sadece tek görsel → kullanıcı farkı görüyor mu? Polycarbonate için de 6 frame paketi hazırla, veya 360 viewer’ı yalnız Tritan’da göster (şu an zaten `imgs.length > 1` kontrolü var, OK).
   - Renk seçici güzel ama **seçilen renk adının yazı olarak görünmesi** yok. Swatch altında aktif rengin adı gösterilsin.
   - “Cantitate minimă: 100 bucăți” gibi kritik bilgiler — tabloda değil CTA yanında daha belirgin olmalı.
   - Ürün görselleri 5MB — `srcset` ile 400/800/1600 türevleri verilmeli. Veya en az `cwebp -q 80` ile küçültülmeli.
4. **Contact Form**:
   - Honeypot field yok → bot spam gelir.
   - Phone regex sadece `+[0-9]{8,15}` — Romanya için `^\+40[0-9]{9}$`, diğer ülkeler için daha esnek kural. libphonenumber-js (1.4 KB gzipped mini versiyonu var) kullanılabilir.
   - Email kontrolü için MX lookup veya en azından disposable domain kara-listesi (`@yopmail.com` vs.) B2B siteler için önemli.
   - “Şirket adı” ve “Ülke” field’ı yok — B2B için **kritik** (sen müşterinin şirketini görmeden teklif veremezsin).
   - Başarı mesajı sonrası Google Analytics / Meta Pixel conversion event fire etmek lazım.
5. **Erişilebilirlik (a11y)**:
   - `cursor: none` tüm siteye uygulanmış → klavye kullanıcıları imleci göremez, erişilebilirlik aracı tahmin edemez.
   - Skip-to-content link yok (`<a href="#app" class="sr-only-focusable">`).
   - Birkaç `role` ve `aria-label` eksik (hamburger’da var, iyi).
   - Modal açıldığında focus trap yok, Esc tuşu kapatmıyor. `role="dialog"` + `aria-modal="true"` ekle.
   - Intro overlay ekran okuyucuya `aria-hidden="true"` verilmiyor → içerik karmaşıklaşıyor.
   - Color swatch’lar `<div>` — butona çevir (`<button type="button">`), klavyeden seçilebilsin.
6. **Mobil**:
   - `hero-pin-section` 250vh büyüklüğünde scroll pin + frame crossfade → mobilde **scroll’u kilitler gibi hissettirir**. Mobilde daha kısa (~120vh) veya statik fallback yap.
   - Damacana görselleri mobilde de 5MB yüklüyor → mobil için `<picture>` ile daha küçük versiyon.
   - `floating-call` butonu Safari alt bar ile çakışabilir — `bottom: calc(env(safe-area-inset-bottom) + 20px)`.

---

## 5. Performans

### Ölçülebilecek muhtemel sorunlar
| Metrik | Beklenen | Neden |
|---|---|---|
| LCP | 3.5-5s | Hero PNG/webp + intro geciktirme |
| CLS | >0.1 | Dinamik sequence img’leri ve font-swap |
| TBT | Yüksek | Büyük app.js + animations.js defer değil |
| Transfer size | 15-20MB+ | PNG’ler, (video dahilse) felaket |

### Aksiyon listesi
1. **Tüm PNG → WebP/AVIF**: `cwebp -q 78 -m 6` ile %60-80 tasarruf.
2. **`srcset` + `sizes`**: ana ürün kartı görselleri için 3-4 boyut üret.
3. **Video stratejisi**: `hero-bg.mp4` ya tamamen çıkar, ya da `<video preload="none" poster="...">` + “Play video” butonu arkasına koy. Ayrıca **iki kopyası var** — birini sil.
4. **Code splitting**: `animations.js` ve 360 viewer kodu dinamik import ile sadece gerektiğinde yüklensin.
5. **`<script defer>`**: Zaten var (iyi). Ama script’i body sonuna koymak yerine head’de `defer` olarak bırak — kritik path daha iyi.
6. **Font**: Manrope 6 weight (300-800) yükleniyor. Sadece 400/600/700 kullanılıyor büyük ihtimalle — diğerlerini çıkar.
7. **HTTP/2 push / Preload**: Hero görsel WebP’si için `<link rel="preload" as="image" href="..." type="image/webp">`.
8. **`<link rel="preload" as="video">`** kesinlikle kullanma — full dosyayı indirir.
9. **Service Worker / PWA**: Basit bir offline-fallback + cache-first static assets. ContecPark’ın Manifest’i olsa kullanıcı telefonuna kurabilir.
10. **CDN**: Görseller Vercel Blob ya da Cloudflare Images üzerinden servis edilsin, origin sıfır byte resim taşısın.

---

## 6. İçerik ve Pazarlama (Notların doğrultusunda)

`gunvel` dosyasındaki notlarınla eşleştirerek:

| Not | Durum | Aksiyon |
|---|---|---|
| BPA-Free (Tritan) ana sayfada öne çıksın, tek item + alt seçenekler | ⚠️ Kısmen | Anasayfada 3 ürün kartı var; **bu 3 ürünü 1 hero ürün + variant chipler** haline getir. Hero card Tritan olsun, altında "Polycarbonate versiyonu / Kapak" seçenekleri olsun. |
| Tritan renk seçenekleri + not (her renk mümkün) | ⚠️ | Renk seçici var ama altında “_not: Her renk opsiyonu üretilebilir — özel siparişler için iletişime geç_” notu yok. Ekle. |
| Kapaklar her renkte | ✅ | Var ama aynı “özel renk” notu eklenmeli. |
| Tritan pahalı, avantajları vurgulanmalı | ⚠️ | Tritan highlight section var, ama maliyet-karşılaştırması (ör. Tritan 500 yıkama vs PC 50 yıkama) grafik yok. Ekle. |
| Şişe şeklinde cursor | ✅ | `img-bottle.png` kursör olarak kullanılıyor. |
| Etkinlikler: 2024 Bucharest, 2025 Milan, 2026 Torremolinos Spain | ✅ | Bölümü var, düzgün görünüyor. Logo/foto ekle (`watercoolerseurope.eu` galerisinden). |
| Valid mail + ülke kodu telefon | ⚠️ | Regex var ama zayıf, zenginleştir. |
| Ürün listesi sadece: Tritan şişe, PC şişe, kapak | ❌ | `prod_rack*`, `rack_uses`, `rack_faqs`, `img-rack.png` ve footer’daki `Bidon 19L Clasic` / `Bidon 19L cu Mâner` kalıntıları **silinmeli**. Ayrıca `prod_clasic_name`, `prod_maner_name` çevirileri i18n’de hâlâ referans ediliyor. |
| Ambalaj: 1 kutu = 8 şişe, şeffaf paket; kapak 1 kutu = 600 | ⚠️ | Mevcut: `tritan_pkg` = "1 cutie = 8 unități", `cap_pkg` = "1 cutie = 600". **“Fiecare bidon ambalat individual în folie transparentă”** ifadesi ekle. |
| https://watercoolerseurope.eu/conference-fair-2025/photo-gallery/ | 💡 | Event bölümüne “Galerie foto” dış link olarak ekle. |
| `we-white-768x412.png` logo | 💡 | Event section’ında “Platinum Member / Member of Water Coolers Europe” rozeti olarak kullan — büyük güven sinyali. |

### Ek öneri içerik bölümleri
1. **“Customer Stories / Partenerii Noștri”** — ContecPark’la çalışan distribütörlerden 2-3 logo ve kısa testimonial. B2B’de güven üreticisi.
2. **Compliance / Sertifikalar Galerisi** — Food-contact, EU 10/2011, ISO sertifika PDF’leri `yeni bilgiler/` klasöründeki 4 PDF burada göster.
3. **Teknik Datasheet İndirme** — zaten `bilgiler ve gorseller/` içinde `Flayer A5 Contec Fata/Spate.pdf`, `Roll Up 2x1m final.pdf` var. Ürün sayfasına “📄 Descarcă fișa tehnică” butonu.
4. **Fabrika turu videosu** — mevcut 222MB’lık Clip Contec v4.mp4’ü 1080p 8Mbps H.265’e sıkıştır (≈ 25MB), YouTube’a da yükle ve embed et (anasayfadaki YouTube iframe’i güncel değil).
5. **Kapasite / üretim hacmi rakamları** — “Aylık 250.000 adet üretim kapasitesi”, “%100 Avrupa menşeli hammadde”, “5 yıl garanti” gibi güven sayıları.
6. **Blog / News** — SEO için faydalı (örn: “5 Criterii de selecție pentru bidoane 19L”, “Tritan vs Polycarbonat — Ghid B2B 2026”).
7. **Newsletter** — damlama kampanyası için B2B e-posta toplamak.

---

## 7. Dosya Yapısı Temizliği

Şu an:
```
contectv1/
├── add-cookies.js               ❌ eski migration
├── apply-changes.js             ❌ eski migration
├── fix-cookies.js               ❌ eski migration
├── fix-email.js                 ❌ eski migration
├── fix-form.js                  ❌ eski migration
├── migrate.js                   ❌ eski migration
├── remove-maintenance.js        ❌ eski migration
├── gunvel                       ⚠️ kişisel not → .gitignore
├── antigravity-skills/          ⚠️ ne için?
├── img-bottle.png (cursor için) ✅
├── img-cap.png                  ⚠️ kullanılıyor mu?
├── img-rack.png                 ❌ rack kaldırılacak
├── bilgiler ve gorseller/       ⚠️ assets yerine src/
├── yeni bilgiler/               ⚠️ assets yerine src/
├── video/hero-bg.mp4 (222MB)    ❌ repo'ya koyma
```

Önerilen yapı:
```
contecpark/
├── public/                    (Vercel statik servis)
│   ├── index.html
│   ├── favicon.ico
│   ├── og-image.jpg
│   ├── sitemap.xml
│   ├── robots.txt
│   ├── img/
│   │   ├── logo.svg
│   │   ├── products/
│   │   │   ├── tritan/       (webp 400/800/1600)
│   │   │   ├── polycarbonate/
│   │   │   └── cap/
│   │   └── factory/          (ASBX fotoları buraya)
│   └── downloads/
│       ├── fisa-tehnica-tritan.pdf
│       └── fisa-tehnica-pc.pdf
├── src/
│   ├── main.js
│   ├── i18n/
│   │   ├── ro.js
│   │   └── en.js
│   ├── data/
│   │   └── products.js
│   ├── pages/
│   │   ├── home.js
│   │   ├── products.js
│   │   ├── product-detail.js
│   │   └── about.js
│   ├── components/
│   │   ├── header.js
│   │   ├── footer.js
│   │   ├── intro.js
│   │   ├── cursor.js
│   │   ├── modal.js
│   │   ├── form.js
│   │   ├── cookies.js
│   │   └── viewer360.js
│   ├── utils/
│   │   ├── router.js
│   │   └── seo.js
│   └── styles/
│       ├── base.css
│       ├── components.css
│       └── pages.css
├── scripts/                   (eski migration'lar arşiv)
├── docs/
│   └── PROJECT_REVIEW.md
├── package.json               (vite ya da parcel ile build)
├── vercel.json
├── .gitignore
└── .vercelignore
```

Build adımı eklersen (Vite önerim):
- Minification + tree-shaking.
- Hash’li dosya isimleri (`app.a1b2c3.js`) → `?v=11` manuel cache-bust’tan kurtulursun.
- CSS modülasyonu, otomatik `@import`.
- Image plugin ile WebP/AVIF üretimi build-time.

---

## 8. Güvenlik

1. **Web3Forms access_key HTML’de açık** — Spam riski (yukarıda). hCaptcha zorunluluğu tanımla Web3Forms panelinde. Ya da kendi Vercel serverless function’ına taşı (env var olarak sakla).
2. **CSP header yok** — `vercel.json`’a header’lar ekle:
   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {"key": "X-Frame-Options", "value": "SAMEORIGIN"},
           {"key": "X-Content-Type-Options", "value": "nosniff"},
           {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
           {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
           {"key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains"}
         ]
       }
     ]
   }
   ```
3. **GDPR**: RO ve EU müşterileri için cookie banner sadece “Am înțeles” butonu var — *kabul/red* seçeneği yok. Gerçek opt-out mekanizması lazım (özellikle analytics eklersen).
4. **Privacy policy** ve **Terms** sayfaları eksik. Footer’a ekle. GDPR için zorunlu değilse de güven artırır.
5. **Formda KVKK/GDPR onay checkbox’ı** yok: “Sunt de acord cu politica de confidențialitate” + link. Yasal zorunluluk.

---

## 9. Hızlı Kazanç Listesi (Öncelikli 10 madde)

1. ❗ **Footer linklerini düzelt** (slug mismatch bug, 1 dakikalık iş).
2. ❗ **Rack referanslarını tamamen sil** (i18n’den, imajlardan, FAQ’lardan).
3. ❗ **Web3Forms spam koruması aç** (panelde hCaptcha).
4. ❗ **222MB video dosyalarından en az birini sil** + diğerini sıkıştır.
5. ❗ **PNG görselleri WebP’ye çevir ve srcset ekle**.
6. ❗ **Footer’a KVKK/GDPR link + form consent checkbox**.
7. ⚡ **Intro’yu sessionStorage ile 1 kez göster**, prefers-reduced-motion’da atla.
8. ⚡ **Favicon + og-image.jpg oluştur**.
9. ⚡ **`cursor: none`’u media query’ye al** (a11y).
10. ⚡ **Scroll listener leak’i onar** (animations.js içinde cleanup doğru yapılsın).

---

## 10. Daha İleri Vizyon (İlerleyen Aşama)

1. **Admin paneli**: Ürün stokları, fiyatlar, haberler için basit bir CMS (Sanity, Strapi, ya da Vercel KV + dashboard).
2. **Distribütör login alanı**: “Sifre ile giriş yap, toplu sipariş ver, fatura indir” tarzı B2B özel portal.
3. **Çok dil genişletmesi**: EN + RO var; DE, IT, ES, FR (Torremolinos Spain etkinliği nedeniyle İspanyolca mantıklı).
4. **Pazarlama otomasyonu**: Form → HubSpot/Mailchimp → sales ekip bildirimi Slack üzerinden.
5. **A/B Test**: Hero copy, CTA butonu, ürün sırası (Vercel Edge Config ile).
6. **3D gerçek zamanlı model**: PNG sequence yerine Three.js + .glb (compressed) — aynı estetiği %70 daha az transferle verir. (hero-bottle-sequence 6 frame için her yönden büyük görsel indiriyorsun.)
7. **Analytics**: Vercel Analytics + Plausible/Umami (cookieless) → hangi ürün modal’ı açılıyor, nereden kopuyor ziyaretçi.
8. **Canlı chat / WhatsApp Business link**: RO + EN destekli.

---

## Kapanış

Görsel dil ve etkileşim seviyen Apple-premium seviyede, bu nadirdir ve çok değerli. Ana iş:
1. **Teknik temizlik** (rack kaldırma, slug fix, migration script arşivleme, asset diyeti),
2. **Performans / a11y** eksikleri (intro, cursor, görsel boyutları),
3. **İçeriği genişletme** (sertifika, fabrika foto, etkinlik galerisi, datasheet download, testimonial).

Bu listedeki ilk 10 “hızlı kazanç” maddesini ardışık olarak uygularsan sitenin hem crawl edilebilirliği hem kullanıcı deneyimi belirgin biçimde sıçrar. Hangi maddeden başlamamı istersen devam edelim — footer slug fix ve rack temizliği tek seferde yapılır, ona başlayalım mı?
