# Plan implementacji optymalizacji METRO Catalogs

> **Dla wykonawcy (agenta lub człowieka):** WYMAGANY SUB-SKILL — użyj `superpowers:subagent-driven-development` (zalecane) albo `superpowers:executing-plans`, żeby przeprowadzić plan task-by-task. Kroki są oznaczone checkboxami (`- [ ]`).

**Goal:** Wdrożyć rekomendacje z `raport.md` (2026-05-08) w trzech fazach (P1 → P2 → P3) — zredukować transfer assetów (~6–8 MB), wyciąć martwy kod (~250–400 KB JS), uporządkować pipeline obrazów. Zero zmian behawioralnych.

**Architecture:** Praca odbywa się głównie po stronie publicznych assetów (`public/catalogs/**`), pipeline'u w `scripts/generate-thumbnails.mjs`, oraz `src/components/ui/` + `src/app/providers.tsx`. Każda faza kończy się działającym buildem (`npm run build`) i zielonym testem (`npm test`). Pomiędzy fazami robimy jeden commit na zadanie.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, framer-motion, sharp 0.33 (jedyne źródło rekompresji WebP), vitest, ESLint 9, TypeScript 5.9.

**Założenia globalne:**
- Pracujemy na bieżącym branchu (obecnie `stage_2`). Nie zmieniamy brancha, nie pushujemy nic bez zgody użytkownika.
- `git add <ścieżki>` — nigdy `git add -A` (preferencja użytkownika z pamięci sesji `feedback_workflow_main_branch.md`).
- Każdy task kończy się commitem. Po fazie P1 odpalamy `npm run build` na końcu (nie po każdym tasku).
- Komendy uruchamiamy z roota repo: `/Users/micz/__DEV__/__METRO_catalogs`.

---

## Plan zadań (TL;DR kolejność)

| # | Faza | Zadanie | Pliki | Czas |
|---|---|---|---|---|
| 1 | P1 | Rekompresja baz galerii (sharp q=82) | `scripts/recompress-gallery-bases.mjs` (nowy), `public/catalogs/QX/gallery/*.webp`, `public/catalogs/QS/gallery/*.webp` | 30 min |
| 2 | P1 | Wyczyszczenie + regeneracja wariantów galerii | regenerowane pliki `*-Nw.webp`, `src/generated/responsive-image-manifest.json` | 10 min |
| 3 | P1 | Usunięcie martwych komponentów shadcn/ui i zależności | `src/components/ui/*` (43 pliki), `src/hooks/use-toast.ts`, `src/app/providers.tsx`, `package.json` | 60 min |
| 4 | P1 | Scalenie `type2`/`type3` w pojedynczy placeholder | `src/components/catalog/CatalogPagePlaceholder.tsx` (nowy), routing w `src/app/catalogs/[slug]/page.tsx` (lub gdzie jest odpalany layout) | 15 min |
| 5 | P2 | Plakaty MP4 dla feature animacji | `scripts/generate-video-posters.mjs` (nowy), `public/catalogs/QX/features/*.webp` (nowe), `public/catalogs/QS/features/*.webp` (nowe), `content.json` (oba katalogi) | 30 min |
| 6 | P2 | MD5-audyt duplikatów `materials/` | tylko raport, opcjonalna migracja | 20 min |
| 7 | P2 | Z-index w `PackshotsQX` → `z-modal` | `src/layouts/qx/PackshotsQX.tsx` | 10 min |
| 8 | P3 | `decoding="async"` na lazy `<img>` | 5 plików w `src/layouts/qx/` | 15 min |
| 9 | P3 | Higiena repo: `.DS_Store`, `tsconfig.tsbuildinfo`, `kill-next.bat` | `.gitignore`, `package.json` | 10 min |
| 10 | P3 | `next.config.ts` — `optimizePackageImports` + `removeConsole` | `next.config.ts` | 10 min |

---

# FAZA P1 — Wdrożyć od razu

## Task 1: Rekompresja baz galerii (sharp q=82)

**Goal:** Zredukować rozmiar plików bazowych w `public/catalogs/QX/gallery/` i `public/catalogs/QS/gallery/` (~5.6 MB → ~1.5 MB) bez naruszania `srcSet` — `responsiveProps()` w `src/lib/responsive-image.ts:117` nadal dopisuje bazę jako `4000w`, ale baza jest teraz mocno skompresowana, więc retina-desktop dostaje akceptowalny payload.

**Why sharp, nie cwebp:** Repo już ma `sharp ^0.33.5` w `devDependencies` (`package.json:93`). cwebp wymagałby instalacji binarki systemowej. Sharp wewnętrznie używa libwebp z tymi samymi parametrami.

**Files:**
- Create: `scripts/recompress-gallery-bases.mjs`
- Modify in place: `public/catalogs/QX/gallery/*.webp` (tylko bazowe, nie `*-Nw.webp`), `public/catalogs/QS/gallery/*.webp`

**Pre-check:**

- [ ] **Step 1.1: Zrób snapshot rozmiarów PRZED.** Komenda:

```bash
du -ab /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QX/gallery/*.webp \
       /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QS/gallery/*.webp \
  | grep -v -- '-[0-9]\+w\.webp$' \
  | tee /tmp/metro-gallery-bases-before.txt
```

Expected: lista ~13 plików z rozmiarami (3000–4000 KB sumarycznie). Zachowaj plik dla porównania w Step 1.7.

- [ ] **Step 1.2: Utwórz skrypt rekompresji.**

Plik: `scripts/recompress-gallery-bases.mjs`

```js
#!/usr/bin/env node

/**
 * recompress-gallery-bases.mjs
 *
 * Rekompresuje bazowe pliki .webp w public/catalogs/<CATALOG>/gallery/
 * do quality=82 / effort=6, zachowując oryginalne wymiary.
 * Pomija pliki z sufiksem -Nw (warianty wygenerowane przez
 * generate-thumbnails.mjs).
 *
 * Idempotentny: jeśli `--force` nie jest podany, pomija pliki, których
 * rozmiar jest mniejszy niż 200 KB (heurystyka — założenie, że już
 * były rekompresowane).
 *
 * Usage:
 *   node scripts/recompress-gallery-bases.mjs
 *   node scripts/recompress-gallery-bases.mjs --force
 *   node scripts/recompress-gallery-bases.mjs --quality 80
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Error: sharp is not installed. Run: npm install --save-dev sharp');
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const qualityFlagIdx = args.indexOf('--quality');
const quality =
  qualityFlagIdx >= 0 ? Number(args[qualityFlagIdx + 1]) : 82;

const SKIP_THRESHOLD_BYTES = 200 * 1024; // 200 KB

function isGeneratedThumbnail(name) {
  return /-\d+w\.\w+$/.test(name);
}

async function recompress(filePath) {
  const stat = await fs.stat(filePath);
  if (!force && stat.size < SKIP_THRESHOLD_BYTES) {
    return { skipped: true, before: stat.size, after: stat.size };
  }

  const tmpPath = `${filePath}.tmp`;
  await sharp(filePath)
    .webp({ quality, alphaQuality: 100, effort: 6 })
    .toFile(tmpPath);

  const newStat = await fs.stat(tmpPath);
  await fs.rename(tmpPath, filePath);

  return { skipped: false, before: stat.size, after: newStat.size };
}

async function processGallery(galleryDir) {
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;
  let skipped = 0;

  const files = await fs.readdir(galleryDir);
  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    if (isGeneratedThumbnail(file)) continue;

    const filePath = path.join(galleryDir, file);
    const result = await recompress(filePath);
    totalBefore += result.before;
    totalAfter += result.after;

    if (result.skipped) {
      skipped++;
      continue;
    }
    processed++;
    const pct = (((result.before - result.after) / result.before) * 100).toFixed(1);
    console.log(
      `  ${file}: ${(result.before / 1024).toFixed(0)}K → ${(result.after / 1024).toFixed(0)}K (-${pct}%)`,
    );
  }

  return { totalBefore, totalAfter, processed, skipped };
}

async function main() {
  console.log(`Recompressing gallery bases (q=${quality}, effort=6)${force ? ' [force]' : ''}...`);

  const catalogsDir = path.join(PUBLIC, 'catalogs');
  const catalogs = await fs.readdir(catalogsDir);

  let grandBefore = 0;
  let grandAfter = 0;

  for (const catalog of catalogs) {
    const galleryDir = path.join(catalogsDir, catalog, 'gallery');
    try {
      await fs.access(galleryDir);
    } catch {
      continue;
    }
    console.log(`\n${catalog}/gallery:`);
    const r = await processGallery(galleryDir);
    grandBefore += r.totalBefore;
    grandAfter += r.totalAfter;
    if (r.skipped) console.log(`  (skipped ${r.skipped} files under ${SKIP_THRESHOLD_BYTES / 1024}KB)`);
  }

  const saved = grandBefore - grandAfter;
  console.log(
    `\nDone. Total: ${(grandBefore / 1024).toFixed(0)}K → ${(grandAfter / 1024).toFixed(0)}K (saved ${(saved / 1024).toFixed(0)}K)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 1.3: Zarejestruj skrypt w `package.json` (sekcja `scripts`).**

Plik: `package.json`. W bloku `"scripts": { ... }` dodaj jedną linię (po `"thumbnails:clean"`):

```json
"recompress:gallery": "node scripts/recompress-gallery-bases.mjs",
```

- [ ] **Step 1.4: Sucha weryfikacja na pojedynczym pliku** (test bez nadpisania całego katalogu).

```bash
cd /Users/micz/__DEV__/__METRO_catalogs && \
  cp "public/catalogs/QX/gallery/office-lifestyle.webp" /tmp/office-lifestyle-before.webp && \
  node -e "import('sharp').then(async ({default: sharp}) => { \
    const out = '/tmp/office-lifestyle-after.webp'; \
    await sharp('/tmp/office-lifestyle-before.webp').webp({quality:82,alphaQuality:100,effort:6}).toFile(out); \
    const fs = await import('fs'); \
    console.log('before', fs.statSync('/tmp/office-lifestyle-before.webp').size); \
    console.log('after',  fs.statSync(out).size); \
  })"
```

Expected: `before` ~1500000, `after` ~120000–200000 bajtów (>80% redukcja). Jeśli redukcja jest <30%, źródło już było skompresowane — przerwij i poinformuj użytkownika.

- [ ] **Step 1.5: Uruchom rekompresję na obu katalogach.**

```bash
npm run recompress:gallery
```

Expected: dla każdego pliku w `QX/gallery/` i `QS/gallery/` linia `name.webp: XK → YK (-Z%)`. Sumarycznie zysk ~3–4 MB.

- [ ] **Step 1.6: Wizualna inspekcja jakości.** Otwórz w przeglądarce 2–3 zdjęcia bezpośrednio z `public/catalogs/QX/gallery/office-lifestyle.webp` (np. `http://localhost:3000/catalogs/QX/gallery/office-lifestyle.webp` po `npm run dev`). Porównaj z wersją sprzed rekompresji w `/tmp/office-lifestyle-before.webp`. Jeżeli widać banding lub artefakty na podglądzie 100% — przerwij i podnieś `--quality 88`.

Komenda:

```bash
npm run dev &
DEV_PID=$!
sleep 5
open "http://localhost:3000/catalogs/QX/gallery/office-lifestyle.webp"
# ręczne porównanie z /tmp/office-lifestyle-before.webp
kill $DEV_PID
```

- [ ] **Step 1.7: Snapshot PO i porównanie.**

```bash
du -ab /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QX/gallery/*.webp \
       /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QS/gallery/*.webp \
  | grep -v -- '-[0-9]\+w\.webp$' \
  | tee /tmp/metro-gallery-bases-after.txt

echo "BEFORE total:"
awk '{s+=$1} END {print s/1024 "KB"}' /tmp/metro-gallery-bases-before.txt
echo "AFTER total:"
awk '{s+=$1} END {print s/1024 "KB"}' /tmp/metro-gallery-bases-after.txt
```

Expected: `BEFORE total` ~5500–6000 KB, `AFTER total` ~1500–2000 KB.

- [ ] **Step 1.8: Commit.**

```bash
git add scripts/recompress-gallery-bases.mjs package.json \
        public/catalogs/QX/gallery/*.webp public/catalogs/QS/gallery/*.webp
# UWAGA: jeśli `git status` pokazuje pliki -Nw (warianty), nie staguj ich tutaj — to robi Task 2.
git commit -m "perf(images): recompress gallery base files to webp q=82 (~3.5MB saved)"
```

---

## Task 2: Wyczyszczenie i regeneracja wariantów galerii (zgodnie z aktualnym presetem)

**Goal:** Manifest `src/generated/responsive-image-manifest.json` ma reliktowe warianty `[256, 512, 1024, 1600]` (stary preset `gallery_thumb`) na zdjęciach głównych, mieszane z aktualnym `[400, 800, 1200, 1600]`. Czyszczenie + regeneracja zostawia jednolity zestaw na każde zdjęcie.

**Files:**
- Modify (regeneracja): `public/catalogs/*/gallery/*-Nw.webp`
- Modify (auto-regenerowany): `src/generated/responsive-image-manifest.json`

**Pre-check:**

- [ ] **Step 2.1: Snapshot manifestu PRZED.**

```bash
cp /Users/micz/__DEV__/__METRO_catalogs/src/generated/responsive-image-manifest.json /tmp/manifest-before.json
grep -E '"/catalogs/(QX|QS)/gallery/' /tmp/manifest-before.json | head -20
```

Expected: zobaczysz mieszane wartości w stylu `[256, 400, 512, 800, 1200, 1600]`.

- [ ] **Step 2.2: Wyczyść istniejące warianty.**

```bash
npm run thumbnails:clean
```

Expected: linia `Removed N generated thumbnails.` (oczekiwane N: ~80–120).

- [ ] **Step 2.3: Regeneruj zgodnie z aktualnym presetem.**

```bash
npm run thumbnails
```

Expected: log dla każdego katalogu sekcji, sumarycznie kilkadziesiąt plików, czas <10s. Manifest zostanie nadpisany na końcu.

- [ ] **Step 2.4: Weryfikacja manifestu.**

```bash
grep -E '"/catalogs/(QX|QS)/gallery/' /Users/micz/__DEV__/__METRO_catalogs/src/generated/responsive-image-manifest.json | grep -v -- '-thumb' | head -20
```

Expected: dla obrazów głównych galerii widzisz `[400, 800, 1200, 1600]`. Dla thumbnaili (`thumbImageNames` w `processGalleryDirectory`) — `[256, 512, 1024, 1600]`. Brak duplikatów `[256, 400, ...]`.

- [ ] **Step 2.5: Test parytetu `responsive-image.test.ts`.**

```bash
npm test -- responsive-image
```

Expected: PASS (testy weryfikują, że `PRESET_WIDTHS` w `src/lib/responsive-image.ts` jest spójne z `SECTION_WIDTHS` w `scripts/lib/section-widths.mjs`). Jeżeli FAIL — to sygnał, że któryś z plików jest zdesynchronizowany; nie regeneruj na siłę, popraw rozjazd presetu i wróć do Step 2.2.

- [ ] **Step 2.6: Smoke build.**

```bash
npm run build
```

Expected: build kończy się sukcesem (`✓ Compiled`, `✓ Generating static pages`). Brak błędów Next.js typu „Image not found" (oznaczałoby to martwą referencję w content.json).

- [ ] **Step 2.7: Commit.**

```bash
git add public/catalogs src/generated/responsive-image-manifest.json
git commit -m "chore(images): clean & regenerate gallery thumbnail variants

Remove legacy 256w/512w/1024w on gallery_main images. Manifest now uses
canonical [400, 800, 1200, 1600] for main images and [256, 512, 1024, 1600]
for thumbnails, matching SECTION_WIDTHS presets."
```

---

## Task 3: Wycięcie martwego shadcn/ui + zależności

**Goal:** Zostawić tylko 4 komponenty UI używane realnie w aplikacji (`tooltip`, `toast`, `toaster`, `sonner`). Skasować 43 nieużywane pliki + 24 zależności z `package.json`. Uprościć `providers.tsx`.

**Decyzja architektoniczna:** Zostawiamy `<Sonner />` + `<TooltipProvider>` w `providers.tsx` jako lekki bufor — w razie potrzeby toast/tooltip mogą być użyte w przyszłych iteracjach, ich koszt runtime to <5 KB. **Usuwamy** natomiast `<QueryClientProvider>` (cały `@tanstack/react-query` ~52 KB) i radixowy `<Toaster />` (radix-toast jest tylko częścią dead-tree).

**Files:**
- Delete: 43 pliki w `src/components/ui/`
- Delete: `src/hooks/use-toast.ts`
- Modify: `src/app/providers.tsx`
- Modify: `package.json`
- Side-effect: `package-lock.json` zostanie zregenerowany przez `npm install`

**Lista plików do usunięcia w `src/components/ui/`:**

```
accordion.tsx, alert.tsx, alert-dialog.tsx, aspect-ratio.tsx, avatar.tsx,
badge.tsx, breadcrumb.tsx, button.tsx, calendar.tsx, card.tsx, carousel.tsx,
chart.tsx, checkbox.tsx, collapsible.tsx, command.tsx, context-menu.tsx,
dialog.tsx, drawer.tsx, dropdown-menu.tsx, form.tsx, hover-card.tsx,
input.tsx, input-otp.tsx, label.tsx, menubar.tsx, navigation-menu.tsx,
pagination.tsx, popover.tsx, progress.tsx, radio-group.tsx, resizable.tsx,
scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx, sidebar.tsx,
skeleton.tsx, slider.tsx, switch.tsx, table.tsx, tabs.tsx, textarea.tsx,
toggle.tsx, toggle-group.tsx
```

**Lista zależności do usunięcia z `package.json` (sekcja `dependencies`):**

```
@hookform/resolvers
@radix-ui/react-accordion
@radix-ui/react-alert-dialog
@radix-ui/react-aspect-ratio
@radix-ui/react-avatar
@radix-ui/react-checkbox
@radix-ui/react-collapsible
@radix-ui/react-context-menu
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-hover-card
@radix-ui/react-label
@radix-ui/react-menubar
@radix-ui/react-navigation-menu
@radix-ui/react-popover
@radix-ui/react-progress
@radix-ui/react-radio-group
@radix-ui/react-scroll-area
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-slider
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-tabs
@radix-ui/react-toast
@radix-ui/react-toggle
@radix-ui/react-toggle-group
@tanstack/react-query
cmdk
date-fns
embla-carousel-react
input-otp
react-day-picker
react-hook-form
react-resizable-panels
recharts
vaul
```

**Zachowane:** `@radix-ui/react-tooltip`, `sonner`, `next-themes` (zależność `sonner`), `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `framer-motion`, `zod` (jeżeli używane w `src/lib/schemas/` — zweryfikujemy), `next`, `react`.

**Pre-check:**

- [ ] **Step 3.1: Zweryfikuj, że `useToast` ani `toast()` z `@/hooks/use-toast` nigdzie nie są wywoływane.**

```bash
cd /Users/micz/__DEV__/__METRO_catalogs && \
grep -rEn "from\s+['\"]@/hooks/use-toast['\"]|from\s+['\"]@/components/ui/toast['\"]|from\s+['\"]@/components/ui/toaster['\"]" src/ \
  --include='*.tsx' --include='*.ts'
```

Expected: TYLKO `src/app/providers.tsx` jako konsument. Jeżeli pojawi się cokolwiek innego — przerwij i poinformuj użytkownika.

- [ ] **Step 3.2: Sprawdź użycie `zod` (decyzja czy zostawić).**

```bash
grep -rEn "from\s+['\"]zod['\"]" /Users/micz/__DEV__/__METRO_catalogs/src/ \
  --include='*.tsx' --include='*.ts' | head
```

Expected: pojawia się w `src/lib/schemas/*` lub podobnych. Jeśli tak — `zod` zostaje. Jeśli zero wyników — dopisz `zod` do listy do usunięcia w Step 3.7.

- [ ] **Step 3.3: Sprawdź użycie `next-themes`.**

```bash
grep -rEn "from\s+['\"]next-themes['\"]" /Users/micz/__DEV__/__METRO_catalogs/src/ \
  --include='*.tsx' --include='*.ts'
```

Expected: użycie w `src/components/ui/sonner.tsx`. Jeśli to jedyny konsument — `next-themes` zostaje (Sonner go wymaga).

- [ ] **Step 3.4: Sprawdź `src/app/design-system/page.tsx`.** Strona designsystemu importuje `recharts`, `chart`, `form` itd. Jej istnienie blokuje czyszczenie typów.

```bash
grep -E "@/components/ui/(chart|form|carousel|calendar|command|dialog|menubar|navigation-menu|popover|select|sheet|sidebar|table|tabs)" \
  /Users/micz/__DEV__/__METRO_catalogs/src/app/design-system/page.tsx | head
```

Expected: dziesiątki importów. **Decyzja:** trzeba usunąć też `src/app/design-system/`. Strona to wewnętrzny preview — nie buduje się dla klientów.

- [ ] **Step 3.5: Usuń stronę design-system.**

```bash
rm -rf /Users/micz/__DEV__/__METRO_catalogs/src/app/design-system
```

- [ ] **Step 3.6: Usuń 43 pliki shadcn/ui + use-toast.**

```bash
cd /Users/micz/__DEV__/__METRO_catalogs && \
rm src/components/ui/{accordion,alert,alert-dialog,aspect-ratio,avatar,badge,breadcrumb,button,calendar,card,carousel,chart,checkbox,collapsible,command,context-menu,dialog,drawer,dropdown-menu,form,hover-card,input,input-otp,label,menubar,navigation-menu,pagination,popover,progress,radio-group,resizable,scroll-area,select,separator,sheet,sidebar,skeleton,slider,switch,table,tabs,textarea,toggle,toggle-group}.tsx && \
rm src/components/ui/toast.tsx src/components/ui/toaster.tsx && \
rm src/hooks/use-toast.ts
```

Expected: 0 błędów. Pozostałe w `src/components/ui/`: `sonner.tsx`, `tooltip.tsx`.

- [ ] **Step 3.7: Uprość `src/app/providers.tsx`.**

Plik: `src/app/providers.tsx`. Zamień całość na:

```tsx
'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as Sonner } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Sonner />
    </TooltipProvider>
  );
}
```

- [ ] **Step 3.8: Edytuj `package.json` — usuń 37 zależności.**

Otwórz `package.json` i usuń linie wymienione w sekcji powyżej (Step 3 nagłówek). **Zostawiasz** `@radix-ui/react-tooltip` i `sonner` + `next-themes`.

- [ ] **Step 3.9: Zainstaluj zależności od nowa.**

```bash
cd /Users/micz/__DEV__/__METRO_catalogs && rm -rf node_modules package-lock.json && npm install
```

Expected: `npm install` przechodzi bez błędów. Czas: 1–2 min.

- [ ] **Step 3.10: Typecheck.**

```bash
npm run typecheck
```

Expected: zero błędów. Jeśli pojawiają się błędy „Cannot find module '@/components/ui/<x>'" — to oznacza, że gdzieś w `src/` jest jeszcze import komponentu, którego nie usunąłeś. Wtedy: `grep -rE "@/components/ui/<x>" src/` i zdecyduj — albo komponent zostaje (dopisz na powrót), albo usuń import.

- [ ] **Step 3.11: Lint + testy.**

```bash
npm run lint && npm test
```

Expected: lint zero errors / pre-existing warnings only; testy 48/49 lub 49/49 zielone.

- [ ] **Step 3.12: Build.**

```bash
npm run build
```

Expected: build zielony, `✓ Generating static pages`. Brak strony `/design-system` w outpucie.

- [ ] **Step 3.13: Commit.**

```bash
git add package.json package-lock.json src/app/providers.tsx \
        src/components/ui src/hooks src/app

git commit -m "chore: remove unused shadcn/ui components and dependencies

Drop 43 unused shadcn/ui components, src/hooks/use-toast.ts, and the
src/app/design-system preview page. Remove 37 npm dependencies including
@tanstack/react-query, recharts, react-hook-form, embla-carousel-react,
all unused @radix-ui/* packages. Simplify Providers to TooltipProvider
+ Sonner only.

Bundle JS reduction: ~250-400KB (production gzipped est)."
```

---

## Task 4: Scalenie placeholderów `type2` / `type3`

**Goal:** `src/layouts/type2/CatalogPageType2.tsx` i `src/layouts/type3/CatalogPageType3.tsx` różnią się dokładnie 1 linią (nazwa funkcji w `export default`). Scalamy w jeden komponent `CatalogPagePlaceholder` w `src/components/catalog/`.

**Files:**
- Create: `src/components/catalog/CatalogPagePlaceholder.tsx`
- Delete: `src/layouts/type2/CatalogPageType2.tsx`
- Delete: `src/layouts/type3/CatalogPageType3.tsx`
- Delete (puste katalogi): `src/layouts/type2/`, `src/layouts/type3/`
- Modify: routing/loader, gdzie te komponenty są importowane (zlokalizujemy w Step 4.1)

**Steps:**

- [ ] **Step 4.1: Znajdź konsumentów.**

```bash
grep -rEn "(CatalogPageType2|CatalogPageType3|layouts/type2|layouts/type3)" \
  /Users/micz/__DEV__/__METRO_catalogs/src \
  --include='*.tsx' --include='*.ts'
```

Expected: lista 1–4 plików (najpewniej w `src/lib/catalog-loader.ts` lub podobnym route-resolverze). Jeżeli jest tam też `CatalogPagePlaceholder` lub `CatalogPageType1` — odczytaj cały blok, żeby zrozumieć mapowanie typów.

- [ ] **Step 4.2: Stwórz scalony komponent.**

Plik: `src/components/catalog/CatalogPagePlaceholder.tsx`

```tsx
import Link from 'next/link';
import type { CatalogData } from '@/types/catalog';
import type { CatalogFooterEntry, GlobalConfig } from '@/lib/catalog-loader';

interface Props {
  catalog: CatalogData;
  globalConfig: GlobalConfig;
  footerEntries?: CatalogFooterEntry[];
}

export default function CatalogPagePlaceholder({ catalog, globalConfig }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-6 py-16 sm:px-8">
      <header className="mb-12">
        <Link
          href="/"
          className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← {globalConfig.brandName}
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {catalog.meta.collectionName}
        </p>
        <h1 className="mt-6 font-display text-5xl md:text-7xl">
          {catalog.meta.title}
        </h1>
        <p className="mt-6 max-w-full text-muted-foreground sm:max-w-xl">
          {catalog.meta.description}
        </p>
        <p className="mt-12 inline-block border border-border px-6 py-3 font-display text-xs uppercase tracking-widest text-muted-foreground">
          Layout in preparation
        </p>
      </section>

      <footer className="mt-12 text-xs uppercase tracking-widest text-muted-foreground/60">
        {globalConfig.footerText}
      </footer>
    </main>
  );
}
```

- [ ] **Step 4.3: Przekieruj wszystkie odwołania `CatalogPageType2` i `CatalogPageType3` na `CatalogPagePlaceholder`.**

W każdym pliku z listy ze Step 4.1 zamień:

- `import CatalogPageType2 from '@/layouts/type2/CatalogPageType2'` → `import CatalogPagePlaceholder from '@/components/catalog/CatalogPagePlaceholder'`
- `import CatalogPageType3 from '@/layouts/type3/CatalogPageType3'` → (usuń linię, jeśli plik już importuje placeholder) lub zamień analogicznie
- `<CatalogPageType2 .../>` → `<CatalogPagePlaceholder .../>`
- `<CatalogPageType3 .../>` → `<CatalogPagePlaceholder .../>`

**Uwaga:** jeśli w route-resolverze typ jest mapowany przez switch/object (`'type2': () => <CatalogPageType2/>, 'type3': () => <CatalogPageType3/>`), oba klucze mają wskazywać na ten sam komponent placeholder.

- [ ] **Step 4.4: Usuń stare pliki + katalogi.**

```bash
rm -rf /Users/micz/__DEV__/__METRO_catalogs/src/layouts/type2 /Users/micz/__DEV__/__METRO_catalogs/src/layouts/type3
```

- [ ] **Step 4.5: Typecheck + build.**

```bash
npm run typecheck && npm run build
```

Expected: zero błędów typecheck; build zielony. Jeżeli error „Cannot find module '@/layouts/type2/...'" — wróć do Step 4.1 i sprawdź, czy znalazłeś WSZYSTKICH konsumentów.

- [ ] **Step 4.6: Smoke test ręczny.** Jeśli któryś z testowych katalogów używa typu 2/3 (sprawdź `public/catalogs/*/catalog.json` pole `type`):

```bash
npm run dev &
DEV_PID=$!
sleep 5
# otwórz w przeglądarce każdy katalog z type2/type3, np.:
open "http://localhost:3000/catalogs/<slug-z-type2-lub-type3>"
# wzrokowo: napis "Layout in preparation", brak błędów w konsoli
kill $DEV_PID
```

- [ ] **Step 4.7: Commit.**

```bash
git add src/components/catalog/CatalogPagePlaceholder.tsx \
        src/layouts \
        # plus wszystkie pliki zmienione w Step 4.3 — staguj indywidualnie

git commit -m "refactor: merge type2/type3 layouts into CatalogPagePlaceholder

Both files were byte-identical except for the function name. Single
placeholder lives in src/components/catalog/, type2 and type3 routing
keys both render it. Empty layouts/type2 and layouts/type3 directories
removed."
```

---

# FAZA P2 — Zaplanować w sprincie

## Task 5: Plakaty MP4 dla feature animacji

**Goal:** `src/layouts/qx/FeaturesQX.tsx:59` renderuje `<video poster={active.video.poster}/>`, ale w obu `content.json` (QX/QS, sekcja `features`) `poster` nie istnieje. Skutek: czarne pole przed odtworzeniem (zwłaszcza mobile bez autoplay). Wyciągamy pierwszą klatkę z każdego MP4 jako webp i dopisujemy `poster: ...` w content.

**Wymaganie:** `ffmpeg` w PATH. Sprawdzenie: `which ffmpeg`. Jeżeli nie ma — przerwij task i poinformuj użytkownika (instalacja: `brew install ffmpeg` na macOS).

**Files:**
- Create: `scripts/generate-video-posters.mjs`
- Create: `public/catalogs/QX/features/<frame>.webp` × N (~5 plików)
- Create: `public/catalogs/QS/features/<frame>.webp` × N (~5 plików)
- Modify: `public/catalogs/QX/features/content.json`
- Modify: `public/catalogs/QS/features/content.json`

**Steps:**

- [ ] **Step 5.1: Sprawdź lokalizację MP4 i strukturę content.json.**

```bash
ls /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QX/features/
ls /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QS/features/
cat /Users/micz/__DEV__/__METRO_catalogs/public/catalogs/QX/features/content.json
```

Expected: `*.mp4` + `content.json` z polem `items: [{video: {src: "/catalogs/QX/features/X.mp4"}, ...}]`. Zachowaj kształt pól w głowie — będą potrzebne w Step 5.3.

- [ ] **Step 5.2: Sprawdź, czy `ffmpeg` jest dostępny.**

```bash
which ffmpeg && ffmpeg -version | head -1
```

Expected: linia z wersją. Jeżeli „ffmpeg: command not found" — przerwij task, poinformuj użytkownika.

- [ ] **Step 5.3: Stwórz skrypt generujący plakaty.**

Plik: `scripts/generate-video-posters.mjs`

```js
#!/usr/bin/env node

/**
 * generate-video-posters.mjs
 *
 * Wyciąga pierwszą klatkę z każdego pliku .mp4 w public/catalogs/<C>/features/
 * jako .webp (q=85, max width 960). Plik plakatu trafia obok wideo z
 * sufiksem `-poster`, np. feature-anim.mp4 → feature-anim-poster.webp.
 *
 * Po wygenerowaniu drukuje sugerowane wpisy do content.json (do ręcznej
 * inspekcji — nie modyfikuje content.json automatycznie).
 *
 * Wymaga: ffmpeg w PATH, sharp w devDependencies.
 *
 * Usage:
 *   node scripts/generate-video-posters.mjs
 *   node scripts/generate-video-posters.mjs --force
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const force = process.argv.includes('--force');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Error: sharp not installed.');
  process.exit(1);
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function generatePoster(mp4Path) {
  const dir = path.dirname(mp4Path);
  const name = path.basename(mp4Path, '.mp4');
  const tmpPng = path.join(dir, `${name}-poster.tmp.png`);
  const outWebp = path.join(dir, `${name}-poster.webp`);

  if (!force && (await fileExists(outWebp))) {
    return { skipped: true, out: outWebp };
  }

  // Wyciągnij pierwszą klatkę jako PNG (lossless intermediate).
  await exec('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', '0', '-i', mp4Path,
    '-frames:v', '1',
    '-vf', 'scale=960:-2',
    tmpPng,
  ]);

  // Konwersja PNG → WebP q=85.
  await sharp(tmpPng)
    .webp({ quality: 85, effort: 6 })
    .toFile(outWebp);

  await fs.unlink(tmpPng);
  return { skipped: false, out: outWebp };
}

async function processFeaturesDir(featuresDir, catalogSlug) {
  if (!(await fileExists(featuresDir))) return [];

  const files = await fs.readdir(featuresDir);
  const mp4s = files.filter((f) => f.endsWith('.mp4'));
  const results = [];

  for (const mp4 of mp4s) {
    const mp4Path = path.join(featuresDir, mp4);
    const { skipped, out } = await generatePoster(mp4Path);
    const publicPath = `/${path.relative(PUBLIC, out).replace(/\\/g, '/')}`;
    results.push({
      catalog: catalogSlug,
      videoFile: mp4,
      videoPath: `/catalogs/${catalogSlug}/features/${mp4}`,
      posterPath: publicPath,
      skipped,
    });
    console.log(`  ${skipped ? 'skipped' : 'generated'} ${publicPath}`);
  }

  return results;
}

async function main() {
  console.log('Generating video posters...');
  const all = [];
  const catalogsDir = path.join(PUBLIC, 'catalogs');
  const catalogs = await fs.readdir(catalogsDir);

  for (const catalog of catalogs) {
    const featuresDir = path.join(catalogsDir, catalog, 'features');
    if (!(await fileExists(featuresDir))) continue;
    console.log(`\n${catalog}/features:`);
    const r = await processFeaturesDir(featuresDir, catalog);
    all.push(...r);
  }

  console.log('\n--- content.json suggestions ---');
  console.log('Add these poster paths to features/content.json items:');
  for (const r of all) {
    console.log(`  ${r.catalog}: ${r.videoFile}`);
    console.log(`    "video": { "src": "${r.videoPath}", "poster": "${r.posterPath}" }`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 5.4: Zarejestruj w `package.json`.**

W `"scripts": { ... }` dodaj:

```json
"posters": "node scripts/generate-video-posters.mjs",
```

- [ ] **Step 5.5: Wygeneruj plakaty.**

```bash
npm run posters
```

Expected: dla każdego MP4 nowy `*-poster.webp`. Na końcu output „content.json suggestions" — zachowaj go (skopiuj do bufora).

- [ ] **Step 5.6: Wpisz `poster` do `content.json` (QX i QS).**

Otwórz `public/catalogs/QX/features/content.json`. Dla każdego itemu z polem `video` dopisz `poster` analogicznie do sugestii ze Step 5.5:

```json
{
  "video": {
    "src": "/catalogs/QX/features/feature-anim-1.mp4",
    "poster": "/catalogs/QX/features/feature-anim-1-poster.webp"
  },
  ...
}
```

To samo dla `public/catalogs/QS/features/content.json`.

**WAŻNE:** Nie zmieniaj innych pól (np. `title`, `description`). Reguła z pamięci: nie freelancuj na user copy (`feedback_no_freelancing_on_user_copy.md`).

- [ ] **Step 5.7: Smoke test wizualny.**

```bash
npm run dev &
DEV_PID=$!
sleep 5
open "http://localhost:3000/catalogs/QX"
# Zescroluj do sekcji „Funkcje" / „Features". Zanim klikniesz play —
# powinieneś widzieć pierwszą klatkę zamiast czarnego prostokąta.
kill $DEV_PID
```

- [ ] **Step 5.8: Commit.**

```bash
git add scripts/generate-video-posters.mjs package.json \
        public/catalogs/QX/features/*-poster.webp \
        public/catalogs/QS/features/*-poster.webp \
        public/catalogs/QX/features/content.json \
        public/catalogs/QS/features/content.json
git commit -m "feat(features): add poster images for feature animations

Extract first-frame poster (.webp q=85, 960px wide) from each MP4.
content.json items now declare video.poster, eliminating the black
frame on mobile before user-initiated play."
```

---

## Task 6: MD5-audyt duplikatów `materials/`

**Goal:** Zweryfikować zgodnie z preferencją użytkownika (`feedback_verify_duplicates_via_md5.md`), czy te same pliki preview materiałów (`metro RAL XXXX.webp`) są bajtowo identyczne między `public/catalogs/QX/materials/` i `public/catalogs/QS/materials/`. Jeśli tak — przygotować propozycję ekstrakcji do `public/shared/material-previews/`. **Sam task kończy się raportem** — fizyczna migracja zostaje na decyzję użytkownika.

**Files (audyt):**
- Tylko odczyt: `public/catalogs/QX/materials/*.webp`, `public/catalogs/QS/materials/*.webp`, `public/shared/materials/*.webp`
- Output: `docs/superpowers/plans/material-md5-audit.md` (raport)

**Steps:**

- [ ] **Step 6.1: Wygeneruj listę MD5 dla każdej z trzech ścieżek.**

```bash
cd /Users/micz/__DEV__/__METRO_catalogs && \
for d in public/catalogs/QX/materials public/catalogs/QS/materials public/shared/materials; do
  echo "=== $d ==="
  find "$d" -name '*.webp' ! -name '*-[0-9]*w.webp' \
    -exec md5 -r {} \; | sort | tee "/tmp/md5-$(basename $(dirname $d))-$(basename $d).txt"
done
```

Expected: dwa pliki MD5 (QX/materials, QS/materials) oraz shared/materials. Format: `<md5>  <ścieżka>`.

- [ ] **Step 6.2: Znajdź pary o tej samej nazwie i porównaj MD5.**

```bash
diff <(awk '{print $2}' /tmp/md5-catalogs-QX-materials.txt 2>/dev/null || awk '{print $2}' /tmp/md5-QX-materials.txt) \
     <(awk '{print $2}' /tmp/md5-catalogs-QS-materials.txt 2>/dev/null || awk '{print $2}' /tmp/md5-QS-materials.txt)
# (uwaga na nazwy plików tmp — wybierz właściwe ze Step 6.1)

# Następnie:
join -1 2 -2 2 \
  <(sort -k2 /tmp/md5-*-QX-materials.txt) \
  <(sort -k2 /tmp/md5-*-QS-materials.txt) \
  | awk '{
      qx=$2; qs=$3;
      if (qx==qs) print "IDENT  " $1;
      else        print "DIFFER " $1;
    }' | sort | head -50
```

(Jeżeli nazwy plików zawierają spacje — użyj wariantu z `while read`).

- [ ] **Step 6.3: Stwórz raport.**

Plik: `docs/superpowers/plans/material-md5-audit.md`

Format:

```markdown
# Material MD5 Audit (2026-05-08)

## Summary
- Total files in QX/materials: <N>
- Total files in QS/materials: <N>
- Total files in shared/materials: <N>
- IDENT pairs (QX==QS): <N>
- DIFFER pairs (same name, different content): <N>

## Recommendations
[Wpisz po wynikach Step 6.2:]
- Jeżeli IDENT == 100%, można przenieść do `shared/material-previews/`.
  Oszczędność dyskowa: <N> KB.
- Jeżeli DIFFER > 0, każdy taki plik wymaga indywidualnej decyzji
  (różnica może być niezamierzona albo świadoma).

## Tabela szczegółowa
| Plik | QX (md5) | QS (md5) | Status |
|---|---|---|---|
...
```

Wypełnij na podstawie outputu ze Step 6.2.

- [ ] **Step 6.4: Commit RAPORT (bez fizycznej migracji).**

```bash
git add docs/superpowers/plans/material-md5-audit.md
git commit -m "docs: MD5 audit of catalog material previews

Identifies which QX/QS/material files are byte-identical and which
diverge. Decision on whether to extract identical pairs into
public/shared/material-previews/ left to follow-up."
```

---

## Task 7: Z-index PackshotsQX — zamiana na `z-modal`

**Goal:** `src/layouts/qx/PackshotsQX.tsx:267` używa `z-[60]`, kolidującego z `CatalogNav` (`z-[60]`). Współdzielony `Lightbox.tsx` poprawnie używa `z-modal` (=80). Najprostsza poprawka: zmiana literału w PackshotsQX. Refaktor na `<Lightbox/>` zostawiamy jako opcję.

**Files:**
- Modify: `src/layouts/qx/PackshotsQX.tsx:267`

**Steps:**

- [ ] **Step 7.1: Sprawdź obecny literał.**

```bash
grep -n 'z-\[60\]' /Users/micz/__DEV__/__METRO_catalogs/src/layouts/qx/PackshotsQX.tsx
```

Expected: 1 dopasowanie w okolicach linii 267 (modal overlay).

- [ ] **Step 7.2: Edytuj plik.**

Plik: `src/layouts/qx/PackshotsQX.tsx`

```diff
- className="fixed inset-0 z-[60] bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4"
+ className="fixed inset-0 z-modal bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4"
```

(Jeżeli klasa `z-modal` nie istnieje w Tailwind config, sprawdź `tailwind.config.ts` — projektowy mapping na `var(--z-modal)`. Jeśli mapping nieistnieje, użyj literału `z-[80]` zamiast `z-modal`.)

- [ ] **Step 7.3: Smoke test ręczny.**

```bash
npm run dev &
DEV_PID=$!
sleep 5
open "http://localhost:3000/catalogs/QX"
# Zescroluj do sekcji Packshots, kliknij thumbnail, lightbox-modal
# powinien być NAD CatalogNav (nav nie jest klikalny przez modal).
kill $DEV_PID
```

- [ ] **Step 7.4: Commit.**

```bash
git add src/layouts/qx/PackshotsQX.tsx
git commit -m "fix(layouts): use z-modal in PackshotsQX inline lightbox

Avoids z-index collision with CatalogNav (both at z-[60]). Aligns with
shared Lightbox.tsx which already uses z-modal (=80)."
```

---

# FAZA P3 — Higiena

## Task 8: `decoding="async"` na lazy `<img>`

**Goal:** Dodać atrybut `decoding="async"` do każdego `<img loading="lazy">` w 5 plikach QX. Redukuje blokadę głównego wątku przy scrollu.

**Files (każdy z atrybutem `loading="lazy"` na `<img>`):**
- Modify: `src/layouts/qx/GalleryQX.tsx`
- Modify: `src/layouts/qx/PackshotsQX.tsx`
- Modify: `src/layouts/qx/FinishesQX.tsx`
- Modify: `src/layouts/qx/MaterialsQX.tsx`
- Modify: `src/layouts/qx/OverviewQX.tsx`

**Steps:**

- [ ] **Step 8.1: Znajdź wszystkie `loading="lazy"` w `src/layouts/qx/`.**

```bash
grep -rEn 'loading="lazy"' /Users/micz/__DEV__/__METRO_catalogs/src/layouts/qx/
```

Expected: ~5–10 dopasowań w 5 plikach.

- [ ] **Step 8.2: Dodaj `decoding="async"` do każdego z nich.**

Dla każdego dopasowania w każdym z 5 plików: tuż obok `loading="lazy"` dopisz `decoding="async"`. Przykład:

```diff
- <img src={src} loading="lazy" alt="" {...rest} />
+ <img src={src} loading="lazy" decoding="async" alt="" {...rest} />
```

**Uwaga:** Hero image (zawsze pierwsze, bez `loading="lazy"`) zostaje bez `decoding="async"` — chcemy żeby zostało zsynchroniczne (LCP).

- [ ] **Step 8.3: Typecheck + test.**

```bash
npm run typecheck && npm test
```

Expected: PASS (atrybut nie zmienia logiki ani testów).

- [ ] **Step 8.4: Commit.**

```bash
git add src/layouts/qx/GalleryQX.tsx src/layouts/qx/PackshotsQX.tsx \
        src/layouts/qx/FinishesQX.tsx src/layouts/qx/MaterialsQX.tsx \
        src/layouts/qx/OverviewQX.tsx
git commit -m "perf(images): add decoding=async to lazy images in QX layouts

Frees the main thread during scroll-driven image decode. Hero (eager)
keeps default sync decoding for LCP."
```

---

## Task 9: Higiena repo (`.DS_Store`, `tsconfig.tsbuildinfo`, `kill-next.bat`)

**Goal:** Posprzątać pliki binarne i platformowe w repo, dodać `.DS_Store` do `.gitignore`.

**Files:**
- Modify: `.gitignore`
- Delete: `kill-next.bat` (jeżeli istnieje), `tsconfig.tsbuildinfo` (jeżeli zatwierdzony w git), wszystkie `.DS_Store` zatwierdzone w git
- Modify: `package.json` (usunięcie skryptu `kill:next` Windows-only)

**Steps:**

- [ ] **Step 9.1: Sprawdź, co jest faktycznie w git.**

```bash
cd /Users/micz/__DEV__/__METRO_catalogs && \
  git ls-files | grep -E '(\.DS_Store|kill-next\.bat|tsconfig\.tsbuildinfo|kill-next\.ps1)' || echo "(nothing tracked)"
```

Expected: zobaczysz ewentualnie `kill-next.bat`, `kill-next.ps1`, `tsconfig.tsbuildinfo` i/lub `.DS_Store`. Jeżeli `(nothing tracked)` — części Step'ów poniżej nie wykonujesz.

- [ ] **Step 9.2: Usuń pliki z gita (zachowaj lokalnie tylko jeśli istnieją na dysku).**

```bash
# Wykonuj tylko dla tych, które wystąpiły w Step 9.1.
git rm --cached -r tsconfig.tsbuildinfo 2>/dev/null
git rm --cached -r kill-next.bat 2>/dev/null
# .DS_Store w całym repo:
git ls-files | grep '\.DS_Store$' | xargs -I {} git rm --cached "{}"
```

- [ ] **Step 9.3: Dodaj wpisy do `.gitignore`.**

Sprawdź obecną zawartość:

```bash
cat /Users/micz/__DEV__/__METRO_catalogs/.gitignore
```

Dodaj na końcu sekcję (jeśli wpisy jeszcze nie istnieją):

```gitignore

# OS / IDE
**/.DS_Store
*.tsbuildinfo
```

- [ ] **Step 9.4: Usuń `kill-next.bat` z repo i ze skryptu, jeśli userem jest macOS-only.**

```bash
ls /Users/micz/__DEV__/__METRO_catalogs/kill-next.bat 2>/dev/null && \
  rm /Users/micz/__DEV__/__METRO_catalogs/kill-next.bat && \
  rm /Users/micz/__DEV__/__METRO_catalogs/scripts/kill-next.ps1 2>/dev/null
```

W `package.json` usuń linię z `"kill:next": "powershell ..."` (zostawia `"kill:next:mac": "lsof -ti:3000-3009 ..."`).

**Uwaga:** Jeżeli wiesz, że ktoś inny w zespole pracuje na Windowsie — zostaw oba i pomiń ten step. (Z pamięci: użytkownik pracuje na macOS, ale potwierdź zanim usuniesz.)

- [ ] **Step 9.5: Commit.**

```bash
git add .gitignore package.json
# tracked files removals are already staged via git rm --cached
git commit -m "chore(repo): ignore .DS_Store and *.tsbuildinfo, drop windows kill script

Adds /.DS_Store and *.tsbuildinfo to .gitignore. Removes kill-next.bat
from repo (project is macOS-only). Untracks any previously committed
DS_Store / tsbuildinfo files."
```

---

## Task 10: `next.config.ts` — `optimizePackageImports` + `removeConsole`

**Goal:** Zaktywować w Next 15 dwie tanie optymalizacje produkcyjne. **Bez zmian behawioralnych** w dev.

**Files:**
- Modify: `next.config.ts`

**Steps:**

- [ ] **Step 10.1: Odczytaj obecny config.**

```bash
cat /Users/micz/__DEV__/__METRO_catalogs/next.config.ts
```

- [ ] **Step 10.2: Zaktualizuj `next.config.ts`.**

Plik: `next.config.ts`. Dodaj w obiekcie `nextConfig`:

```ts
const nextConfig = {
  // ... istniejące pola ...
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
};
```

(Jeżeli `experimental` lub `compiler` już istnieje — scal pola, nie nadpisuj).

- [ ] **Step 10.3: Smoke build.**

```bash
npm run build
```

Expected: build zielony. Sprawdź size hint Next-a w outpucie — pakiety `lucide-react` powinny być raportowane jako tree-shake-optimized.

- [ ] **Step 10.4: Smoke dev — upewnij się, że `console.log` w dev nadal działa.**

```bash
npm run dev &
DEV_PID=$!
sleep 5
# Otwórz dowolną stronę z console.log w komponencie (jeśli takie są).
# DevTools console powinno pokazywać log-i (bo NODE_ENV=development).
kill $DEV_PID
```

- [ ] **Step 10.5: Commit.**

```bash
git add next.config.ts
git commit -m "chore(config): enable optimizePackageImports and prod console removal

- experimental.optimizePackageImports for lucide-react and framer-motion
  reduces JS bundle in production (Next 15 supports it natively).
- compiler.removeConsole strips console.log/info/debug in production
  builds, keeping console.warn and console.error for ops visibility."
```

---

# Weryfikacja końcowa (po wszystkich fazach)

- [ ] **Step F.1: Pełny build.**

```bash
npm run build
```

Expected: zielony, brak warningów typu „Module not found".

- [ ] **Step F.2: Pełny test suite.**

```bash
npm test
```

Expected: PASS dla wszystkich poprzednio zielonych testów (pre-faza było 48/49 lub 49/49).

- [ ] **Step F.3: Lint.**

```bash
npm run lint
```

Expected: zero errors. Liczba warningów może być mniejsza po wycięciu design-system page.

- [ ] **Step F.4: Smoke dev.**

```bash
npm run dev
# Otwórz w przeglądarce http://localhost:3000
# Sprawdź: każdy katalog (QX, QS, type2/type3 placeholder)
# Sprawdź: galeria mobile (swipe), packshot lightbox (z-index), feature animation (poster)
```

- [ ] **Step F.5: Bilans rozmiarów assetów.**

```bash
du -sh /Users/micz/__DEV__/__METRO_catalogs/public/
# Porównaj z wartością przed Task 1 (zachowaną w pamięci sesji jako 23.39MB).
```

Expected: ~17–19 MB (vs 23 MB przed P1).

- [ ] **Step F.6: Bilans bundla JS.**

Po `npm run build` Next pokaże w outpucie tabelę rozmiarów stron (`First Load JS shared by all`). Porównaj z wartością przed Task 3.

Expected: redukcja 200–400 KB shared JS.

---

## Czego ten plan świadomie NIE robi (zgodnie z raport.md §6)

- **Migracja `<img>` → `next/image`** — koszt > zysk (responsiveImg już daje srcSet).
- **Re-encode MP4** — łącznie ~2.8 MB, nie wąskie gardło, ryzyko regresji jakości.
- **Usunięcie `framer-motion`** — używany w 10 layoutach QX dla scroll-reveal.
- **Wycięcie `'use client'` z layoutów QX** — wysoki koszt refaktoru, niepewny zysk.
- **AVIF zamiast WebP** — WebP @ q=82–85 jest wystarczające, AVIF dwukrotny pipeline.
- **Migracja material-previews do `shared/`** — wykonana TYLKO jako audyt (Task 6); fizyczna migracja po decyzji.

---

## Mapowanie zadań → priorytetów raportu

| Task # | Sekcja raportu | Priorytet |
|---|---|---|
| 1 | 1.1 (wariant 3) | P1 |
| 2 | 1.2 | P1 |
| 3 | 2.1 + 2.3 + 2.4 | P1 |
| 4 | 2.2 | P1 |
| 5 | 1.3 | P2 |
| 6 | 1.4 | P2 |
| 7 | 3.1 | P2 |
| 8 | 1.5 | P3 |
| 9 | 2.5 + 2.6 + 3.4 | P3 |
| 10 | 3.5 | P3 |

Niewdrożone z raportu (świadomie): 1.6 (auto-prune w `--force`) — `processGalleryDirectory` już ma prune-logic dla galerii (linie 224–236 `generate-thumbnails.mjs`); rozszerzanie na pozostałe sekcje to scope-creep. 3.2 (komentarz przy `content-visibility:auto` na `#codes`) — można dodać przy okazji, ale to nie task.
