# Raport optymalizacyjny — METRO Catalogs

Data: 2026-05-08
Zakres: front-end (Next.js 15 + Tailwind + framer-motion), pipeline obrazów, zależności.
Założenie: UI działa poprawnie — raport skupia się na **redukcji wagi assetów** i **usunięciu martwego kodu**, bez zmian behawioralnych.

Sumaryczny payload statyczny: **~31 MB** (359 plików `.webp` + 10 `.mp4` + SVG/ikony). Po wdrożeniu propozycji z sekcji P1 — szacunkowa redukcja **~6–8 MB transferu** dla typowego użytkownika oraz **~260 KB** w bundlu JS.

Priorytety:
- **P1** — duży zysk, niski koszt, do wdrożenia od razu
- **P2** — średni zysk, do zaplanowania
- **P3** — porządki / hygiena

---

## 1. Materiały graficzne

### 1.1 [P1] Bazowe pliki w `public/catalogs/.../gallery/` są dołączane do `srcSet` jako kandydat `4000w`

[src/lib/responsive-image.ts:117](src/lib/responsive-image.ts#L117) zawsze dopisuje oryginał na końcu `srcset`:

```ts
candidates.push(`${encodeForSrcset(src)} 4000w`);
```

Konsekwencje:

| Plik bazowy | Wymiary | Rozmiar bazy | Największy wariant `-1600w` | Stosunek |
|---|---|---|---|---|
| `QX/gallery/office-lifestyle.webp` | 4000×3000 | **1530 KB** | ~? (337 KB wg listingu) | ~4.5× |
| `QX/gallery/02_26_Metro_QX_SOLO_A0001.webp` | 3000×3000 | **725 KB** | 92 KB | ~7.9× |
| `QX/gallery/02_26_Metro_QX_SOLO_C_0001.webp` | 3000×3000 | 651 KB | (analogicznie) | ~7× |
| `QX/gallery/02_26_Metro_QX_SOLO_B_0000.webp` | 3000×3000 | 510 KB | 60 KB | ~8.5× |
| `QS/gallery/04_26_Metro_QS_SOLO_A_0001.webp` | 3000×3000 | 551 KB | — | — |

Na ekranach z DPR ≥ 2 i wyższych viewportach `sizes` rozwiązuje się powyżej 1600px → przeglądarka pobierze plik bazowy (`4000w`), a nie `-1600w`. Galeria QX ma 6 zdjęć (`content.json`) i pokazuje 4 z `slice(0,4)`, więc na retina-desktop może to oznaczać **~3 MB extra transferu na pojedyncze wejście w produkt**.

**Akcje (do wyboru):**

1. (najprostsze) W [scripts/generate-thumbnails.mjs](scripts/generate-thumbnails.mjs) wygenerować dodatkowe szerokości `2400` lub `3000` dla `gallery` i nadal zostawić bazę jako `4000w` — wtedy największe warianty obsłużą retina, a baza będzie rzadko trafiana. Koszt: kilka MB więcej w `public/`, ale lepszy realny transfer.
2. (najefektowniejsze) Zmienić [src/lib/responsive-image.ts:117](src/lib/responsive-image.ts#L117) — nie pushować bazy jako `4000w`. Dodatkowo: w skrypcie `generate-thumbnails.mjs` po wygenerowaniu wariantów **przekompresować plik bazowy** do `q=80` zamiast 100 (lub po prostu skopiować `-1600w` jako bazę), co zmniejszy `office-lifestyle.webp` z 1.5 MB do ~150 KB.
3. (kompromis) Zostawić bazę w srcset, ale zoptymalizować same pliki bazowe: `cwebp -q 82 -m 6` dla wszystkich 13 plików galerii w QX/QS. Zysk: ~3–4 MB na dysku (i identyczny w transferze).

> Uwaga: zamiana `4000w` → `2400w` lub niższe **zmieni** największy realny rozmiar serwowany na retina-4K. Jeżeli to jest świadomy wybór (galeria nie zasługuje na 4K source) — preferowałbym wariant 2 lub 3.

### 1.2 [P1] Stałe warianty po starym presecie `gallery_thumb` zaśmiecają `gallery`

Wycieczka po [src/generated/responsive-image-manifest.json](src/generated/responsive-image-manifest.json) pokazuje, że niektóre **główne** zdjęcia galerii mają nadkomplet wariantów:

```
QX/gallery/02_26_Metro_QX_SOLO_A0001.webp: [256, 400, 512, 800, 1200, 1600]
QX/gallery/02_26_Metro_QX_SOLO_B_0000.webp: [256, 400, 512, 800, 1200, 1600]
QX/gallery/02_26_Metro_QX_SOLO_C_0000.webp: [256, 400, 512, 800, 1200, 1600]
QX/gallery/desk-detail.webp:                [256, 512, 1024, 1600]      ← stary preset
QX/gallery/office-lifestyle.webp:           [256, 512, 1024, 1600]      ← stary preset
QX/gallery/02_26_Metro_QX_HOME0000.webp:    [256, 512, 1024, 1600]      ← stary preset
QS/gallery/04_26_Metro_QS_DETAL_.webp:      [256, 512, 1024, 1600]      ← stary preset
QS/gallery/04_26_Metro_QS_HOME0000.webp:    [256, 512, 1024, 1600]      ← stary preset
```

Aktualny preset `gallery` w [scripts/lib/section-widths.mjs:11](scripts/lib/section-widths.mjs#L11) to `[400, 800, 1200, 1600]`. Pozostałe (256/512/1024) to artefakty starszej generacji (poprzednio te same pliki były klasyfikowane jako `gallery_thumb`). Manifest mając np. `[256, 400, 512, 800, 1200, 1600]` zatwierdza 6-elementowe `srcSet`, w tym **dwie pary niemal duplikatów** (256+400 oraz 512+800). Przeglądarka na mobile potencjalnie pobierze 400w (nie 256w), ale 256w/1024w siedzą na dysku bez dobrego powodu.

**Akcje:**
- `npm run thumbnails:clean && npm run thumbnails` — wyzeruje wygenerowane warianty i odbuduje zgodnie z aktualnym presetem. Po komendzie sprawdzić, czy manifest ma czystą postać `[400, 800, 1200, 1600]` dla `gallery`.
- Sanity check: skasowanie 256w + 512w + 1024w gallery_main = ~12 plików × ~5 KB = ~60 KB na dysku (mało), ale czyściej w manifeście (i krótszy `srcset` w HTML, który leci do każdego klienta).

### 1.3 [P2] MP4 features bez plakatów (`poster`)

[src/layouts/qx/FeaturesQX.tsx:59](src/layouts/qx/FeaturesQX.tsx#L59) renderuje:

```tsx
<video src={active.video.src} poster={active.video.poster} ... />
```

W praktyce w obu `content.json` (QX, QS, sekcja `features`) **żaden item nie ma pola `poster`**. Skutek:
- przed odtworzeniem video pokazuje pusty kontener (czarny/transparentny) zanim `preload="metadata"` przyciągnie pierwszą klatkę
- mobile bez autoplay zobaczy puste pole

**Akcje:**
- W skrypcie generującym dorzucić ekstrakcję pierwszej klatki MP4 do `.webp` (`ffmpeg -ss 0 -i input.mp4 -frames:v 1 -vf scale=960 poster.webp`).
- Uzupełnić `poster` w obu `features/content.json`.

Uwaga z pamięci: `feedback_mp4_optimization_params.md` mówi o `libx264 CRF 23 slow faststart -an` dla feature animacji. Bez znajomości obecnych parametrów kodowania nie polecam re-encodować zdrowych MP4 (1–10s × 5–10 plików = ryzyko regresji jakości); to **nie** jest cel ani problem (MP4 = ~2.8 MB łącznie, pomijalne wobec 23 MB webp).

### 1.4 [P2] Powtórki materiałów per-katalog vs `public/shared/materials/`

[public/shared/materials/](public/shared/materials/) zawiera próbki RAL/W (~3.8 MB) zachodzące nazwami z [public/catalogs/QX/materials/](public/catalogs/QX/materials/) i [public/catalogs/QS/materials/](public/catalogs/QS/materials/). Spot-check:

```
QX/materials/metro RAL 7024.webp:  283K
QS/materials/metro RAL 7024.webp:  283K
shared/materials/RAL 7024.webp:    5.8K  ← inna treść (chip, nie preview)
```

Świadomy podział: `shared/` to małe próbki kolorów (chipy), `catalogs/*/materials/` to duże podglądy (~280 KB każdy). MD5 wskazuje **różną** zawartość, więc to **nie** są duplikaty.

**Akcja (P2):** Sprawdzić, czy te same pliki preview (np. `metro RAL 7024.webp` w QX i QS) są **bajtowo identyczne** w obu katalogach. Jeśli tak — przenieść do `public/shared/material-previews/` i zaktualizować ścieżki w `materials/content.json`. Potencjalna oszczędność: kilkanaście MB na dysku (nie w transferze, bo każda strona załaduje to samo). Wymaga MD5 weryfikacji wg twojej reguły z pamięci (`feedback_verify_duplicates_via_md5.md`).

### 1.5 [P3] Brak `decoding="async"` na obrazach lazy

[src/layouts/qx/GalleryQX.tsx:89](src/layouts/qx/GalleryQX.tsx#L89), [PackshotsQX.tsx:208](src/layouts/qx/PackshotsQX.tsx#L208), [FinishesQX.tsx:270](src/layouts/qx/FinishesQX.tsx#L270), [MaterialsQX.tsx:313](src/layouts/qx/MaterialsQX.tsx#L313), [OverviewQX.tsx:62](src/layouts/qx/OverviewQX.tsx#L62) — wszystkie używają `loading="lazy"`, ale żadne nie ma `decoding="async"`. Dla 30+ webp na stronie w QX dodanie `decoding="async"` zmniejsza blokadę głównego wątku przy scrollu (widoczne zwłaszcza na słabszych Androidach).

**Akcja:** dodać `decoding="async"` na każdym `<img>` w sekcji not-above-the-fold, oraz `decoding="sync"` (lub pominięcie) tylko dla pierwszej klatki Hero.

### 1.6 [P3] Generator nie usuwa starych wariantów po zmianie presetu

`scripts/generate-thumbnails.mjs --force` nadpisuje istniejące pliki, ale nie kasuje już-niepotrzebnych. Stąd hybrydowy stan z 1.2. Komenda `--clean` istnieje (`thumbnails:clean` w [package.json:13](package.json#L13)) — warto rutynowo `clean && rebuild` po edycji `section-widths.mjs`, lub dodać krok auto-prune do `--force`.

---

## 2. Nadmiarowy / martwy kod

### 2.1 [P1] Cała biblioteka shadcn/ui w `src/components/ui/` — używane są 3 komponenty z 47

```
$ grep '@/components/ui/<NAZWA>' src/ → liczba importów (poza src/components/ui)
sonner    1   ← faktycznie używany w providers.tsx
toaster   1   ← faktycznie używany w providers.tsx
tooltip   1   ← faktycznie używany w providers.tsx
toast     2   ← używany przez sonner/toaster
[pozostałe 43 komponenty: 0 importów]
```

[src/app/providers.tsx](src/app/providers.tsx) tworzy `QueryClientProvider` + `TooltipProvider` + `Toaster` + `Sonner`, ale w całym `src/` **brak** wywołań `useQuery / useMutation / useToast / toast(...)`. To znaczy:

- `@tanstack/react-query` (~52 KB JS) tworzy `QueryClient`, który nigdy nie obsługuje zapytań
- `<Toaster />` + `<Sonner />` renderują dwa zerowe portale (toasty nigdy nie są emitowane)
- `<TooltipProvider />` jest aktywny, ale w `src/layouts/qx/**` żaden komponent nie używa `Tooltip` z `@/components/ui/tooltip` (jedyny import to providers.tsx)

**Akcje:**
1. **Usunąć ze `src/components/ui/` 43 nieużywane pliki** (lista poniżej). Razem z nimi można zdjąć z `package.json`:
   - `@radix-ui/react-accordion` *(uwaga: `accordion.tsx` używa go, ale `accordion.tsx` nie jest importowany — można zostawić, jeśli chcesz mieć rezerwę, ale to dead code)*
   - `@radix-ui/react-alert-dialog`, `react-aspect-ratio`, `react-avatar`, `react-checkbox`, `react-collapsible`, `react-context-menu`, `react-dialog`, `react-dropdown-menu`, `react-hover-card`, `react-label`, `react-menubar`, `react-navigation-menu`, `react-popover`, `react-progress`, `react-radio-group`, `react-scroll-area`, `react-select`, `react-separator`, `react-slider`, `react-slot`, `react-switch`, `react-tabs`, `react-toggle`, `react-toggle-group`
   - `cmdk`, `embla-carousel-react`, `input-otp`, `date-fns`, `react-day-picker`, `recharts`, `react-resizable-panels`, `vaul`, `react-hook-form`, `@hookform/resolvers`
2. **Zachować**: `sonner`, `next-themes` (zależność `sonner`), `@radix-ui/react-tooltip`, `@radix-ui/react-toast`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `framer-motion`, `zod` (jeśli używane w schemach `src/lib/schemas/`), Next/React.
3. **Decyzja**: czy `<Toaster />`/`<Sonner />`/`<TooltipProvider>` są potrzebne "na zapas"? Jeśli nie — wyciąć z [src/app/providers.tsx](src/app/providers.tsx) i znacząco uprościć root layout (możliwe usunięcie `'use client'` z `Providers` o ile zostanie sam `QueryClientProvider`, którego również można usunąć).

**Szacunkowy zysk w bundlu:** 250–400 KB JS (zależnie od tree-shake, większość Radix jest dobrze code-split, ale `react-query` + `recharts` to twardy ciężar).

Lista nieużywanych plików w [src/components/ui/](src/components/ui/):
```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button,
calendar, card, carousel, chart, checkbox, collapsible, command, context-menu,
dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label,
menubar, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider,
switch, table, tabs, textarea, toggle, toggle-group
```

### 2.2 [P1] Layouty `type2` / `type3` — duplikaty placeholderów

[src/layouts/type2/CatalogPageType2.tsx](src/layouts/type2/CatalogPageType2.tsx) i [src/layouts/type3/CatalogPageType3.tsx](src/layouts/type3/CatalogPageType3.tsx) to **bajtowo identyczne** pliki różniące się jedną literą w nazwie funkcji (`diff` zwraca 1 linię). Treść: pusty placeholder „Layout in preparation".

Trzy opcje:
- **A.** Skoro żaden z dwóch katalogów nie ma realnego layoutu, scalić w jeden `CatalogPagePlaceholder.tsx` w [src/components/catalog/](src/components/catalog/) i routować oba typy do tego samego komponentu.
- **B.** Usunąć oba i pokazywać `not-found.tsx` dla katalogów, które nie mają zaprojektowanego layoutu.
- **C.** Zostawić jako szkielet, ale zlinkować jeden do drugiego (np. `re-export`), żeby nie duplikować placeholdera.

### 2.3 [P3] `src/hooks/use-toast.ts`

Hook istnieje ([src/hooks/use-toast.ts](src/hooks/use-toast.ts)) i jest jedynym konsumentem `@/components/ui/toast`, ale **sam `useToast()` nie jest nigdzie wywoływany** w `src/`. Razem z czyszczeniem 2.1 — do usunięcia.

### 2.4 [P3] `src/app/design-system/page.tsx`

Strona-galeria komponentów istnieje (importuje m.in. `recharts` przez `chart.tsx` w design-system page). To wewnętrzne narzędzie deweloperskie — **nie buduje się do produkcyjnego ruchu klientów**, ale wlecze cały zestaw nieużywanych zależności do drzewa typecheck/lint.

**Akcja (do decyzji):** wykluczyć `app/design-system/**` z buildu produkcyjnego (np. środowiskowy `NEXT_PUBLIC_DESIGN_SYSTEM=1` + warunkowe routowanie), albo świadomie utrzymać (jest cenna jako referencja).

### 2.5 [P3] Pliki binarne `.DS_Store` w repo

```
public/.DS_Store
public/catalogs/QX/... (potencjalnie też)
.DS_Store w root
```

Jeśli nie są zignorowane przez `.gitignore` — dodać `**/.DS_Store`. Sprawdzić `git ls-files | grep DS_Store`.

### 2.6 [P3] Skrypt `kill-next.bat` + `kill-next.ps1`

W [package.json:8-9](package.json#L8-L9) są dwie wersje (Windows + macOS). Repo ma wpisany `kill-next.bat` w roocie (8 KB), choć użytkownik pracuje na macOS. Można usunąć `.bat`, jeżeli drugi devloper nie jest na Windowsie — zysk symboliczny, porządek większy.

---

## 3. Konfiguracja i bundle

### 3.1 [P2] Bug Z-index: PackshotsQX inline-modal koliduje z CatalogNav

[src/layouts/qx/PackshotsQX.tsx:267](src/layouts/qx/PackshotsQX.tsx#L267) używa `z-[60]`, a [src/components/catalog/CatalogNav.tsx:203](src/components/catalog/CatalogNav.tsx#L203) również ma `z-[60]`. Współdzielony [Lightbox.tsx:62](src/components/catalog/Lightbox.tsx#L62) używa `z-modal` (=80) — czyli poprawnie.

**Akcja:** zamienić `z-[60]` na `z-modal` (lub `z-[80]`) w `PackshotsQX.tsx`. Jeszcze lepiej: zrefaktorować inline-modal w `PackshotsQX` na `<Lightbox>` z [src/components/catalog/Lightbox.tsx](src/components/catalog/Lightbox.tsx) — i zlikwidować duplikację (osobny dialog z własnym focus-trapem, a11y itd.).

### 3.2 [P3] `content-visibility: auto` w globals.css

[src/app/globals.css:765-773](src/app/globals.css#L765-L773) stosuje `content-visibility:auto` na `#packshots, #materials, #codes, #features` w `.catalog-qx0`. To **dobre rozwiązanie** dla long-page (oszczędza render mobile), ale przypominam: w pamięci sesji jest log o tym, że `content-visibility` na `#codes` powodowało problem z desktop accordion (rozwiązany przez `desktopOpen` JS). Teraz wszystko gra, ale każda zmiana w `ProductCodesQX` musi tę interakcję uwzględnić — warto zostawić komentarz w CSS przy `#codes`.

### 3.3 [P3] `'use client'` w 10/10 layoutów QX

Wszystkie sekcje QX są klienckie ([memory 2172](memory)). To wymusza renderowanie po stronie klienta całej strony katalogu. Z perspektywy SEO/Core Web Vitals: zapewne część (np. `OverviewQX`, `ProductCodesQX`, `DimensionsQX`) jest czysto deklaratywna i mogłaby być Server Component, redukując JS bundle. Przewidziany koszt refaktoru jest jednak **wysoki** (rozdzielenie logiki motion od markup), a zysk niepewny — to więcej **P4** niż P2.

### 3.4 [P3] `tsconfig.tsbuildinfo` w repo (340 KB)

Plik z incremental-buildem TypeScript siedzi w repo. Zwykle do `.gitignore`. Warto zweryfikować — jeśli nie ma tam świadomego użycia (np. CI), dodać do `.gitignore` i `git rm --cached`.

### 3.5 [P3] `next.config.ts` — pusty?

[next.config.ts](next.config.ts) ma 818 bajtów, dobrze byłoby:
- włączyć `experimental.optimizePackageImports` dla `lucide-react`, `framer-motion` (Next 15 wspiera)
- włączyć `compiler.removeConsole: true` w produkcji
- zweryfikować, czy `images.formats: ['image/avif', 'image/webp']` jest aktywne (mimo że używamy raw `<img>`, własna mikro-optymalizacja i tak nie zaszkodzi)

---

## 4. Zestawienie akcji do wykonania (TL;DR)

### Zrób od razu (P1, ~2 godziny pracy)

1. **Pliki bazowe galerii** ([1.1](#11-p1-bazowe-pliki-w-publiccatalogs--gallery-są-dołączane-do-srcset-jako-kandydat-4000w)) — wybrać jedną z trzech akcji. Rekomendacja: **wariant 3** (rekompresja baz `cwebp -q 82 -m 6`) — najmniej inwazyjna, ratuje ~3–4 MB transferu.
2. **Wyczyścić warianty galerii** ([1.2](#12-p1-stałe-warianty-po-starym-presecie-gallery_thumb-zaśmiecają-gallery)): `npm run thumbnails:clean && npm run thumbnails`. Sprawdzić [src/generated/responsive-image-manifest.json](src/generated/responsive-image-manifest.json) po regeneracji.
3. **Usunąć martwe shadcn/ui** ([2.1](#21-p1-cała-biblioteka-shadcnui-w-srccomponentsui--używane-są-3-komponenty-z-47)): wykasować 43 pliki + odpowiednie `@radix-ui/*` + `cmdk`, `embla-carousel-react`, `input-otp`, `date-fns`, `react-day-picker`, `recharts`, `react-resizable-panels`, `vaul`, `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query`. Po `npm install` przetestować build.
4. **Scalić type2/type3** ([2.2](#22-p1-layouty-type2--type3--duplikaty-placeholderów)) lub usunąć.

### Zaplanuj na sprint (P2)

5. Plakaty MP4 dla `features` ([1.3](#13-p2-mp4-features-bez-plakatów-poster)).
6. Audyt MD5 duplikatów materiałów per-catalog ([1.4](#14-p2-powtórki-materiałów-per-catalog-vs-publicsharedmaterials)).
7. Z-index w PackshotsQX → `z-modal` lub refaktor na `<Lightbox>` ([3.1](#31-p2-bug-z-index-packshotsqx-inline-modal-koliduje-z-catalognav)).

### Hygiena (P3)

8. `decoding="async"` na lazy `<img>` ([1.5](#15-p3-brak-decodingasync-na-obrazach-lazy)).
9. `--clean` przed `--force` w `scripts/generate-thumbnails.mjs` ([1.6](#16-p3-generator-nie-usuwa-starych-wariantów-po-zmianie-presetu)).
10. Wyciąć `use-toast.ts`, `kill-next.bat`, `tsconfig.tsbuildinfo` z repo, dodać `.DS_Store` do `.gitignore`.
11. Doprecyzować `next.config.ts` (P3.5).

---

## 5. Szacowany bilans po P1

| Zasób | Przed | Po | Zysk |
|---|---|---|---|
| `public/catalogs/.../gallery/*.webp` (bazy) | ~5.6 MB | ~1.5 MB | **−4.1 MB** na dysku/transferze |
| Manifest gallery (redundantne 256w/512w/1024w) | 12 plików | 0 | porządek + krótszy `srcSet` w HTML |
| Bundle JS (production) | bez tych deps | bez ~10 paczek | **~250–400 KB** mniej JS |
| Drzewo `src/components/ui/` | 47 plików | 4 pliki | mniej szumu w PR-ach, szybszy lint |
| Layouty type2/type3 | 86 LOC duplikatu | 1 plik (placeholder) | spójność |

**Brak zmian behawioralnych** (UI dalej działa identycznie) — wszystkie akcje to czyszczenie i optymalizacja transferu.

---

## 6. Czego **nie** rekomenduję (świadomie pominięte)

- Migracja `<img>` → `next/image`. Source dynamiczny (z `content.json`), `next/image` wymaga znajomości wymiarów w JSX, a `responsiveImg` daje równoważne `srcSet`. Migracja generuje koszt bez wyraźnego zysku.
- Re-encode MP4. Łącznie ~2.8 MB, nie jest wąskim gardłem; ryzyko regresji jakości > zysk.
- Usuwanie `framer-motion`. Używany w 10 layoutach QX dla scroll-reveal; usunięcie zmieniłoby UX.
- Wycinanie `'use client'` z layoutów QX. Zysk niepewny, koszt refaktoru wysoki.
- "Lepsze" presety obrazów (np. AVIF). WebP @ q=85 jest już bardzo dobry; AVIF dałby ~20%, ale dwukrotny pipeline generacji + większa złożoność testów.
