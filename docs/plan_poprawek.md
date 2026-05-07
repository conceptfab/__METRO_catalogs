# Plan poprawek mobile QX/QS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doprowadzić mobilne widoki katalogów QX i QS do akceptowalnego stanu UX/perf zgodnie z `docs/raport-mobile-qx-2026-05-07.md`: poprawić typografię, hero, layout shift packshotów, kompaktowy konfigurator materiałów, target dotykowy logo, rytm sekcji, migrację PNG→WebP, mobilne UX dla Dimensions/Codes, oraz utwardzić pipeline obrazów i font loading.

**Architecture:** Wszystkie poprawki działają na istniejącym layoutie `qx0` współdzielonym przez QS i QX (`src/layouts/qx/CatalogPageQX.tsx`). Per-katalog różnicowanie odbywa się przez klasy `.catalog-id-qs` / `.catalog-id-qx` w `src/app/globals.css` (już wspierane). PNG-i są referencjowane wyłącznie z auto-generowanego `src/generated/responsive-image-manifest.json` produkowanego przez `scripts/generate-thumbnails.mjs` — migracja PNG→WebP polega na konwersji plików + regeneracji manifestu. Testy: vitest + @testing-library/react + jest-axe.

**Tech Stack:** Next.js (App Router), React 19, Tailwind, vitest, sharp, Node.js (skrypty `.mjs`).

**Scope note:** Plan łączy kilka niezależnych podsystemów (UI mobile tokens, migracja assetów, hardening pipeline, performance polish, mobile patterns dla list/tabel). Można go bezpiecznie wykonywać fazami w wybranej kolejności — każda faza jest samodzielna i kończy się działającym, przetestowanym kodem. Dwa duże tematy z raportu są **świadomie pominięte** i wymagają osobnego brainstormu/planu:
- Progressive display packshotów (karuzela / accordion / featured + show all) — zmiana architektoniczna sekcji
- Redukcja `use client` w sekcjach katalogu — wymaga audytu i potencjalnego rozdzielenia komponentów na server + island

---

## Phase 0 — Krytyczny bug: brandLabel "METRO QX" przecieka na QS

Globalny `public/config.json` ma `brandName: "METRO QX"`, a [CatalogPageQX.tsx:48-49](src/layouts/qx/CatalogPageQX.tsx#L48-L49) używa `globalConfig?.brandName ?? catalog.hero.brandLabel`, przez co przycisk powrotu do góry na QS ma `aria-label="METRO QX - back to top"`. Per-katalog `catalog.meta.brandName` ("METRO QS") nigdy nie jest brane pod uwagę.

### Task 0.1: Priorytetyzuj per-katalog brandName w CatalogPageQX

**Files:**
- Modify: `src/layouts/qx/CatalogPageQX.tsx:48-50`
- Test: `src/layouts/qx/CatalogPageQX.test.tsx` (Create)

- [ ] **Step 1: Napisz failing test**

```tsx
// src/layouts/qx/CatalogPageQX.test.tsx
import { render, screen } from '@testing-library/react';
import CatalogPageQX from './CatalogPageQX';
import type { CatalogData } from '@/types/catalog';
import type { GlobalConfig } from '@/lib/catalog-loader';

function makeCatalog(overrides: Partial<CatalogData> = {}): CatalogData {
  return {
    id: 'QS',
    meta: { theme: 'qx0', brandName: 'METRO QS', layoutType: 'qx' } as any,
    sections: [{ id: 'overview', label: 'Overview' }],
    hero: { brandLabel: 'METRO QS', slides: [] } as any,
    overview: {} as any,
    gallery: {} as any,
    finishes: {} as any,
    dimensions: {} as any,
    materials: {} as any,
    features: {} as any,
    gettingStarted: {} as any,
    productCodes: { groups: [] } as any,
    ...overrides,
  };
}

test('brand button uses catalog.meta.brandName, not globalConfig.brandName', () => {
  const globalConfig: GlobalConfig = { brandName: 'METRO QX' } as any;
  render(<CatalogPageQX catalog={makeCatalog()} globalConfig={globalConfig} />);
  expect(
    screen.getByRole('button', { name: /METRO QS - back to top/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /METRO QX - back to top/i }),
  ).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Uruchom test, potwierdź FAIL**

```bash
npm test -- src/layouts/qx/CatalogPageQX.test.tsx
```
Expected: FAIL — aria-label zawiera "METRO QX".

- [ ] **Step 3: Napraw priorytet brandName**

W `src/layouts/qx/CatalogPageQX.tsx` zmień blok `brandLabel`:

```tsx
brandLabel={(
  catalog.meta.brandName ?? globalConfig?.brandName ?? catalog.hero.brandLabel
).toUpperCase()}
```

- [ ] **Step 4: Uruchom test, potwierdź PASS**

```bash
npm test -- src/layouts/qx/CatalogPageQX.test.tsx
```
Expected: PASS.

- [ ] **Step 5: Pełny suite + typecheck**

```bash
npm test && npm run typecheck
```
Expected: wszystkie testy zielone.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/qx/CatalogPageQX.tsx src/layouts/qx/CatalogPageQX.test.tsx
git commit -m "fix(catalog): use per-catalog brandName for nav aria-label"
```

---

## Phase 1 — P1 Mobile typography tokens

Sekcje używają `--section-title-size: 46px` i `--section-title-line: 50px` na każdej szerokości. Na 390px nagłówki zajmują 2-3 linie i dominują pierwszy ekran sekcji.

### Task 1.1: Dodaj mobile tokeny dla nagłówków sekcji

**Files:**
- Modify: `src/app/globals.css:443-453` (dodać mobile media query po bloku tokenów)

- [ ] **Step 1: Dodaj mobile token override w globals.css**

Po linii 468 (zamykającej `.catalog-qx0` / blok z `--packshot-code-spacing`) dodaj sekcję mobile:

```css
@media (max-width: 767px) {
  .catalog-qx0 {
    --section-title-size: 34px;
    --section-title-line: 38px;
    --section-id-size: 14px;
  }
}
```

- [ ] **Step 2: Sprawdź wizualnie w devie**

```bash
npm run dev
```
Otwórz `http://localhost:3000/catalog/QX` i `http://localhost:3000/catalog/QS` w DevTools w trybie 390×844. Nagłówki sekcji ("Models", "Customization", "Dimensions"...) muszą:
- mieć rozmiar ~34px zamiast 46px
- mieścić się w 1-2 liniach na 390px

- [ ] **Step 3: Sprawdź desktop (regresja)**

W tym samym devie zmień viewport na ≥768px — nagłówki muszą wrócić do 46/50.

- [ ] **Step 4: Typecheck + testy + commit**

```bash
npm run typecheck && npm test
git add src/app/globals.css
git commit -m "feat(mobile): add mobile typography tokens for section titles"
```

---

## Phase 2 — P1 Hero mobile refinements

Hero ma już mobile override z `.catalog-id-qs` (top-anchored) i `.catalog-id-qx .hero-content-wrapper.hero-slide-1` w globals.css:578,587. Brakuje per-katalog mobile `object-position`, żeby produkt nie uciekał w prawo na QX, oraz weryfikacji że QS nie ma tego samego problemu.

### Task 2.1: Dodaj per-katalog mobile object-position dla obrazów hero

**Files:**
- Modify: `src/app/globals.css` (sekcja mobile hero, ok. linii 542-590)

- [ ] **Step 1: Zidentyfikuj selektor obrazu hero**

```bash
grep -n "hero-image\|home-tile\|hero-slide.*img\|HeroQX.*img" /Users/micz/__DEV__/__METRO_catalogs/src/layouts/qx/HeroQX.tsx | head -10
```

Zapisz nazwę klasy obrazu (najprawdopodobniej `home-tile-image`).

- [ ] **Step 2: Dodaj per-katalog object-position w mobile**

W `src/app/globals.css` w bloku `@media (max-width: 767px)` (od linii 542) dodaj:

```css
@media (max-width: 767px) {
  /* Per-catalog mobile crop — utrzymuje produkt w kadrze na pionowych telefonach */
  .catalog-id-qx .home-tile-image {
    object-position: 60% 50% !important;
  }
  .catalog-id-qs .home-tile-image {
    object-position: 50% 40% !important;
  }
}
```

(Jeśli klasa obrazu okaże się inna w Step 1, zamień `.home-tile-image` na właściwą.)

- [ ] **Step 3: Test wizualny**

```bash
npm run dev
```

W viewport 390×844 sprawdź `/catalog/QX` i `/catalog/QS`:
- produkt na hero jest centralnym punktem kompozycji, nie uciętą krawędzią
- tekst hero pozostaje czytelny (nie zachodzi na produkt)

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(mobile): per-catalog object-position for hero images"
```

---

## Phase 3 — P1 Packshots aspect-ratio (layout shift)

Desktop packshot używa `block h-auto w-full` ([PackshotsQX.tsx:222](src/layouts/qx/PackshotsQX.tsx#L222)) bez rezerwacji proporcji. Mobile używa `qx-packshot-mobile-frame` ([globals.css:258-271](src/app/globals.css#L258-L271)) który ma `max-width: none; height: auto` — także bez aspect-ratio. Powoduje to layout shift przy lazy-load.

### Task 3.1: Wyznacz aspect-ratio packshotów z manifestu

**Files:**
- Read: `src/generated/responsive-image-manifest.json`

- [ ] **Step 1: Sprawdź proporcje wariantów packshotów**

```bash
python3 -c "
import json
with open('/Users/micz/__DEV__/__METRO_catalogs/src/generated/responsive-image-manifest.json') as f:
    m = json.load(f)
ratios = []
for path, variants in m.items():
    if '/packshots/' not in path: continue
    for v in variants:
        if 'width' in v and 'height' in v:
            ratios.append((path, v['width']/v['height']))
            break
import statistics
if ratios:
    print('count:', len(ratios))
    print('min/median/max ratio (w/h):', min(r for _,r in ratios), statistics.median(r for _,r in ratios), max(r for _,r in ratios))
"
```

Zapisz medianę proporcji (np. ~1.0 = kwadrat, ~1.33 = 4:3). Użyj jej w Step 2.

### Task 3.2: Dodaj kontener z aspect-ratio dla packshotów

**Files:**
- Modify: `src/layouts/qx/PackshotsQX.tsx:200-226`
- Modify: `src/app/globals.css:258-271`

- [ ] **Step 1: Owrap desktop packshot w kontener z aspect-ratio**

W `src/layouts/qx/PackshotsQX.tsx` zamień blok `{isMobile ? ... : ...}` (linie 201-226) tak, aby desktop branch miał kontener:

```tsx
{isMobile ? (
  <div className="qx-packshot-mobile-frame">
    <img
      src={item.image}
      {...responsiveImg(item.image, 'packshot')}
      alt={item.name || `${item.code} packshot`}
      className="qx-packshot-mobile-image"
      loading="lazy"
    />
  </div>
) : (
  <button
    type="button"
    onClick={() => openLightbox(i)}
    className="group relative block w-full overflow-hidden"
    aria-label={`View ${item.name || item.code} packshot in fullscreen`}
  >
    <div className="qx-packshot-desktop-frame">
      <img
        src={item.image}
        {...responsiveImg(item.image, 'packshot')}
        alt={item.name || `${item.code} packshot`}
        className="qx-packshot-desktop-image"
        loading="lazy"
      />
    </div>
  </button>
)}
```

- [ ] **Step 2: Dodaj reguły CSS dla obu kontenerów**

W `src/app/globals.css` zamień blok `.qx-packshot-mobile-frame` / `.qx-packshot-mobile-image` (linie 258-271) na:

```css
.qx-packshot-mobile-frame,
.qx-packshot-desktop-frame {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  aspect-ratio: 1 / 1;          /* <-- użyj mediany z Task 3.1; 1/1 to typowy packshot */
}

.qx-packshot-mobile-frame { padding-block: 8px; }

.qx-packshot-mobile-image,
.qx-packshot-desktop-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.qx-packshot-desktop-image {
  transition: transform 700ms ease;
}
.group:hover .qx-packshot-desktop-image {
  transform: scale(1.05);
}
```

- [ ] **Step 3: Sprawdź wizualnie**

```bash
npm run dev
```

W DevTools 390×844 i 1440×900:
- otwórz `/catalog/QX#packshots` i `/catalog/QS#packshots`
- przy refresh nie powinno być wizualnego "skoku" — kontener trzyma proporcje przed załadowaniem obrazu
- hover na desktopie nadal robi scale 1.05

- [ ] **Step 4: Pełen suite**

```bash
npm test && npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add src/layouts/qx/PackshotsQX.tsx src/app/globals.css
git commit -m "fix(packshots): reserve aspect-ratio to prevent layout shift on lazy-load"
```

---

## Phase 4 — P2 Mobile section spacing token

Aktualnie `[&>section+section]:mt-2` ([CatalogPageQX.tsx:57](src/layouts/qx/CatalogPageQX.tsx#L57)) daje 8px na mobile, co jest wizualnie niewystarczające. Desktop ma 240px.

### Task 4.1: Wprowadź mobile spacing token

**Files:**
- Modify: `src/layouts/qx/CatalogPageQX.tsx:57`

- [ ] **Step 1: Zmień klasę spacing**

W `src/layouts/qx/CatalogPageQX.tsx` linia 57:

```tsx
className="bg-surface-elevated [&>section+section]:mt-12 sm:[&>section+section]:mt-20 lg:[&>section+section]:mt-[240px]"
```

(`mt-12` = 48px na mobile, `sm:mt-20` = 80px na tabletach, `lg:mt-[240px]` zachowane).

- [ ] **Step 2: Test wizualny**

```bash
npm run dev
```

W 390×844 przewiń `/catalog/QX` i `/catalog/QS`. Przejścia między sekcjami muszą być wyraźnie czytelne, ale nie tworzyć ogromnej dziury.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/qx/CatalogPageQX.tsx
git commit -m "feat(mobile): increase section spacing from 8px to 48px on mobile"
```

---

## Phase 5 — P2 Logo touch target 44px

[CatalogNav.tsx:215-218](src/components/catalog/CatalogNav.tsx#L215-L218) renderuje brandowy `<button>` z klasami `font-display text-xl font-black tracking-tighter text-slate-900 !rounded-none`, a logo `h-[22px]`. Sam target przycisku w tej konfiguracji nie ma gwarancji 44×44.

### Task 5.1: Zapewnij 44×44 minimum dla brand button

**Files:**
- Modify: `src/components/catalog/CatalogNav.tsx:215-216`
- Test: `src/components/catalog/CatalogNav.test.tsx`

- [ ] **Step 1: Napisz failing test**

Dodaj w istniejącym `CatalogNav.test.tsx`:

```tsx
test('brand button has minimum 44x44 touch target', () => {
  render(<CatalogNav sections={[]} brandLabel="METRO QS" variant="qx0" />);
  const btn = screen.getByRole('button', { name: /METRO QS - back to top/i });
  expect(btn.className).toMatch(/min-h-\[44px\]/);
  expect(btn.className).toMatch(/min-w-\[44px\]/);
});
```

- [ ] **Step 2: Uruchom test, potwierdź FAIL**

```bash
npm test -- src/components/catalog/CatalogNav.test.tsx
```
Expected: FAIL — brak `min-h-[44px]`.

- [ ] **Step 3: Dodaj klasy do brand button**

W `src/components/catalog/CatalogNav.tsx` zmień wywołanie `renderBrandControl` z linii 215-218:

```tsx
{renderBrandControl(
  'inline-flex items-center min-h-[44px] min-w-[44px] font-display text-xl font-black tracking-tighter text-slate-900 !rounded-none',
  'h-[22px] w-auto object-contain !rounded-none lg:h-7',
)}
```

- [ ] **Step 4: Uruchom test, potwierdź PASS**

```bash
npm test -- src/components/catalog/CatalogNav.test.tsx
```

- [ ] **Step 5: Test wizualny**

```bash
npm run dev
```

W 390×844 sprawdź, że logo nadal wygląda tak samo (22px wysokości), ale klikalny obszar jest większy. DevTools → Inspect → wyświetlony rect przycisku ≥ 44×44.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/CatalogNav.tsx src/components/catalog/CatalogNav.test.tsx
git commit -m "fix(a11y): ensure 44x44 touch target for brand button"
```

---

## Phase 6 — P2 Compact materials configurator (mobile)

`MaterialsOptionGroup` używa `h-[9.75rem] w-[7.25rem]` na każdej szerokości ([MaterialsOptionGroup.tsx:58](src/components/catalog/MaterialsOptionGroup.tsx#L58)). Na 390px daje to 2 kolumny i bardzo długą listę.

### Task 6.1: Dodaj mobile-compact wariant kafelka materiału

**Files:**
- Modify: `src/components/catalog/MaterialsOptionGroup.tsx:58`
- Test: `src/components/catalog/MaterialsOptionGroup.test.tsx`

- [ ] **Step 1: Failing test**

Dodaj w istniejącym `MaterialsOptionGroup.test.tsx`:

```tsx
test('material tile uses compact size on mobile via responsive Tailwind classes', () => {
  const opts = [{ id: '1', code: 'RAL7024', label: 'Anthracite', swatchImage: '/x.webp' }] as any;
  render(<MaterialsOptionGroup options={opts} value="1" onChange={() => {}} role="frame" />);
  const tile = screen.getAllByRole('button')[0];
  // mobile-first compact, sm: original size
  expect(tile.className).toMatch(/h-\[6\.5rem\]/);
  expect(tile.className).toMatch(/w-\[5rem\]/);
  expect(tile.className).toMatch(/sm:h-\[9\.75rem\]/);
  expect(tile.className).toMatch(/sm:w-\[7\.25rem\]/);
});
```

(Dostosuj importy/render do istniejącego stylu testu.)

- [ ] **Step 2: Test failuje**

```bash
npm test -- src/components/catalog/MaterialsOptionGroup.test.tsx
```

- [ ] **Step 3: Implementacja — zamień klasy w `MaterialsOptionGroup.tsx:58`**

Stary fragment:
```
className={`relative h-[9.75rem] w-[7.25rem] shrink-0 border bg-background p-1 pt-[7rem] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
```

Zmień na:
```
className={`relative h-[6.5rem] w-[5rem] sm:h-[9.75rem] sm:w-[7.25rem] shrink-0 border bg-background p-1 pt-[4.5rem] sm:pt-[7rem] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
```

- [ ] **Step 4: Test passuje**

```bash
npm test -- src/components/catalog/MaterialsOptionGroup.test.tsx
```

- [ ] **Step 5: Test wizualny**

```bash
npm run dev
```

W 390×844 sekcja `Customization` katalogu QX musi mieścić ~3 kolumny kafelków zamiast 2. Etykieta i swatch muszą pozostać czytelne. Na ≥640px (sm) wygląd musi być identyczny jak przed zmianą.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/MaterialsOptionGroup.tsx src/components/catalog/MaterialsOptionGroup.test.tsx
git commit -m "feat(mobile): compact material tiles on mobile (3 columns instead of 2)"
```

---

## Phase 7 — P2 PNG → WebP migration (QS materials)

75 plików `.png` w `public/catalogs/QS/materials/` (oryginały + `-400w/-800w/-1200w/-1600w` warianty). Referencje są tylko w `src/generated/responsive-image-manifest.json` (auto-generowane). Po konwersji oryginałów i regeneracji manifestu nic w kodzie nie wymaga zmian.

### Task 7.1: Skrypt konwersji PNG→WebP z zachowaniem alpha

**Files:**
- Create: `scripts/convert-png-to-webp.mjs`

- [ ] **Step 1: Stwórz skrypt konwersji**

```js
// scripts/convert-png-to-webp.mjs
// Konwertuje wszystkie .png w podanym katalogu (rekurencyjnie) na .webp
// z zachowaniem kanału alpha. Nie usuwa oryginałów — to robi osobny krok.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('Usage: node scripts/convert-png-to-webp.mjs <directory>');
  process.exit(1);
}

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) yield full;
  }
}

let converted = 0;
let skipped = 0;
for await (const png of walk(ROOT)) {
  const webp = png.replace(/\.png$/i, '.webp');
  try {
    await fs.access(webp);
    skipped++;
    continue;
  } catch {}
  await sharp(png)
    .webp({ quality: 90, alphaQuality: 100, lossless: false, effort: 6 })
    .toFile(webp);
  console.log(`  → ${path.relative(process.cwd(), webp)}`);
  converted++;
}
console.log(`\nConverted: ${converted}, skipped (already exists): ${skipped}`);
```

- [ ] **Step 2: Uruchom konwersję na QS materials**

```bash
node scripts/convert-png-to-webp.mjs public/catalogs/QS/materials
```

Expected: `Converted: 75, skipped: 0`.

- [ ] **Step 3: Weryfikacja alpha**

```bash
node -e "
const sharp = require('sharp');
const fs = require('fs');
const dir = 'public/catalogs/QS/materials';
const samples = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).slice(0, 5);
(async () => {
  for (const f of samples) {
    const meta = await sharp(\`\${dir}/\${f}\`).metadata();
    console.log(f, 'channels:', meta.channels, 'hasAlpha:', meta.hasAlpha);
  }
})();
"
```

Expected: każdy plik ma `channels: 4`, `hasAlpha: true`.

- [ ] **Step 4: Commit (sam skrypt + nowe webp, jeszcze BEZ usunięcia png)**

```bash
git add scripts/convert-png-to-webp.mjs public/catalogs/QS/materials/*.webp
git commit -m "chore(assets): add WebP conversion script and convert QS materials PNGs"
```

### Task 7.2: Regeneruj manifest i zweryfikuj że odwołuje się do .webp

**Files:**
- Modify: `src/generated/responsive-image-manifest.json` (auto)

- [ ] **Step 1: Wymuś regenerację thumbnails (zbuduje też manifest)**

```bash
npm run thumbnails:force
```

- [ ] **Step 2: Sprawdź że PNG zniknęły z manifestu**

```bash
grep -c '"/catalogs/QS/materials/.*\.png"' src/generated/responsive-image-manifest.json
```

Expected: `0` — wszystkie referencje QS/materials muszą być teraz `.webp` (skoro w katalogu istnieją oba formaty, generator powinien preferować webp; jeśli nie — zobacz Step 3).

- [ ] **Step 3: Jeśli manifest nadal zawiera .png — usuń PNG-i z dysku i zregeneruj**

(Wykonaj tylko gdy Step 2 daje wartość ≠ 0.)

```bash
find public/catalogs/QS/materials -name "*.png" -delete
npm run thumbnails:force
grep -c '"/catalogs/QS/materials/.*\.png"' src/generated/responsive-image-manifest.json
```

Expected: `0`.

- [ ] **Step 4: Commit regeneracji**

```bash
git add src/generated/responsive-image-manifest.json
git commit -m "chore(assets): regenerate responsive manifest after WebP conversion"
```

### Task 7.3: Usuń oryginalne PNG-i

**Files:**
- Delete: `public/catalogs/QS/materials/*.png` (75 plików)

- [ ] **Step 1: Zlicz przed usunięciem**

```bash
find public/catalogs/QS/materials -name "*.png" | wc -l
```

Expected: 75 (lub 0, jeśli już usunięte w Task 7.2/Step 3).

- [ ] **Step 2: Usuń pliki**

```bash
find public/catalogs/QS/materials -name "*.png" -delete
```

- [ ] **Step 3: Sprawdź że build i testy przechodzą**

```bash
npm run thumbnails && npm test && npm run typecheck && npm run build
```

Expected: bez błędów. Build musi się powieść (prebuild ponownie zregeneruje manifest, ale tym razem bez PNG źródłowych — manifest już musi być WebP-only).

- [ ] **Step 4: Test wizualny finiszer**

```bash
npm run dev
```

`/catalog/QS#materials` — kafelki materiałów ładują się normalnie (widoczne swatche), brak 404 w konsoli sieci.

- [ ] **Step 5: Commit**

```bash
git add -u public/catalogs/QS/materials src/generated/responsive-image-manifest.json
git commit -m "chore(assets): remove QS material PNGs (now WebP-only)"
```

---

## Phase 8 — P3 Dimensions mobile UX

Sekcja Dimensions ma długi opis pchający rysunek nisko + obraz z negatywnym marginesem. Na mobile sekcja jest mniej informacyjna niż powinna być.

### Task 8.1: Restrukturyzacja mobile Dimensions

**Files:**
- Modify: `src/layouts/qx/DimensionsQX.tsx`

- [ ] **Step 1: Zmapuj obecny layout**

```bash
sed -n '1,200p' src/layouts/qx/DimensionsQX.tsx
```

Zidentyfikuj:
- container z opisem (`<p>` lub `<div>` z opisową treścią)
- container z rysunkiem (`<img>` lub `<Image>`)
- container z tabelą specyfikacji (`<table>` lub `<dl>`)

Zapisz selektory/linie do następnego kroku.

- [ ] **Step 2: Zmień kolejność/proporcje na mobile**

Cel: na mobile (`<sm`) najpierw pokazać 2-3 kluczowe specyfikacje, potem rysunek, potem opis i pełną tabelę. Na desktop layout pozostaje bez zmian.

W `DimensionsQX.tsx` dodaj na poziomie root sekcji utility-classy mobile-first:
- description: dodaj `order-3 sm:order-none`
- drawing wrapper: dodaj `order-2 sm:order-none mt-0` (zdjęcie negatywnego marginesu na mobile — `mb-0 sm:-mb-16` jeśli istnieje `-mb-16`)
- key-specs (jeśli nie istnieje, dodaj nowy `<dl>` ze ścisłymi 2-3 wymiarami) z klasami `order-1 sm:hidden`

Konkret zależy od istniejącej struktury — wzorzec:

```tsx
<section id="dimensions" className="...">
  <SectionHeading ... />
  <div className="flex flex-col sm:grid sm:grid-cols-2 sm:gap-x-12">
    {/* Mobile-only key specs */}
    <dl className="order-1 sm:hidden mt-6 grid grid-cols-2 gap-3 text-sm">
      {keySpecs.map(s => (
        <div key={s.label}>
          <dt className="text-foreground/60">{s.label}</dt>
          <dd className="font-display text-base">{s.value}</dd>
        </div>
      ))}
    </dl>
    <div className="order-2 sm:order-none mb-0 sm:-mb-16 mt-8 sm:mt-0">
      <img src={drawing} alt={...} />
    </div>
    <p className="order-3 sm:order-none mt-6 sm:mt-8 sec_main_text">{description}</p>
    <FullSpecsTable className="order-4 sm:order-none mt-8" />
  </div>
</section>
```

Dodaj też definicję `keySpecs` z 2-3 najważniejszych wymiarów (np. szerokość, głębokość, wysokość) — bierz z istniejącego źródła danych `data.dimensions` lub statycznie z `data.keyDimensions`, jeżeli typ to wspiera. Jeżeli nie — wybierz pierwsze 3 wpisy z istniejącej tabeli.

- [ ] **Step 3: Uruchom testy regresji**

```bash
npm test && npm run typecheck
```

- [ ] **Step 4: Test wizualny**

```bash
npm run dev
```

390×844:
- pierwsze co widać po nagłówku Dimensions to 2-3 kluczowe wymiary
- potem rysunek
- potem opis
- potem pełna tabela

≥640px:
- układ identyczny jak przed zmianą.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/qx/DimensionsQX.tsx
git commit -m "feat(mobile): reorder Dimensions section for better mobile UX"
```

---

## Phase 9 — P3 Product Codes accordion (mobile)

`ProductCodesQX` renderuje 8-9 grup tabel (32-33 wiersze łącznie). Na mobile użytkownik musi przewijać całą listę. Cel: zmień grupy na natywne `<details>` accordions na mobile, na desktop zachowaj zwykły render.

### Task 9.1: Mobile accordion via `<details>`

**Files:**
- Modify: `src/layouts/qx/ProductCodesQX.tsx`

- [ ] **Step 1: Zlokalizuj pętlę po `groups`**

```bash
grep -n "groups\|map(.*group\|<table\|<h3" src/layouts/qx/ProductCodesQX.tsx | head -30
```

Zapisz strukturę renderowanej grupy.

- [ ] **Step 2: Zamień każdą grupę na `<details>` z `<summary>` na mobile**

Wzorzec — owrap istniejący render w `<details>` z mobile-only behavior:

```tsx
{groups.map((group) => (
  <details
    key={group.id}
    className="border-b border-foreground/10 sm:border-none [&[open]>summary>.chev]:rotate-180"
    open={!isMobile}
  >
    <summary className="cursor-pointer list-none py-4 sm:py-0 sm:cursor-default flex items-baseline justify-between sm:block">
      <h3 className="font-display text-xl">{group.title}</h3>
      <span className="chev sm:hidden text-foreground/60 transition-transform" aria-hidden="true">▾</span>
    </summary>
    <div className="pb-6 sm:pb-0">
      {/* istniejąca tabela / lista wierszy bez zmian */}
      <ProductCodesTable rows={group.rows} />
    </div>
  </details>
))}
```

Aby `<details>` był domyślnie otwarty na desktopie (>=sm) i zamknięty na mobile, użyj `useIsMobile()` (hook już dostępny w PackshotsQX). Importuj go i ustaw `open={!isMobile}` na `<details>` (jak wyżej).

Jeśli hook nie jest jeszcze ogólnodostępny, alternatywa CSS-only: zostaw `<details>` zawsze closed i w globals.css dodaj:

```css
@media (min-width: 640px) {
  .codes-accordion[data-codes-accordion] { /* expose all on desktop */ }
  .codes-accordion[data-codes-accordion] > summary { display: none; }
  .codes-accordion[data-codes-accordion] > div { display: block !important; }
}
```

(Wybierz prostszą drogę zależnie od reszty kodu.)

- [ ] **Step 3: A11y — keyboard test**

`<details>`/`<summary>` jest natywnie dostępne (Enter/Space toggluje). Sprawdź ręcznie w devie że:
- Tab przechodzi po summary
- Enter rozwija/zwija
- Po rozwinięciu zawartość czytana przez screen reader (sprawdź w VoiceOver: Cmd+F5)

- [ ] **Step 4: Commit**

```bash
git add src/layouts/qx/ProductCodesQX.tsx src/app/globals.css
git commit -m "feat(mobile): collapse Product Codes groups into accordion on mobile"
```

---

## Phase 10 — Pipeline hardening

### Task 10.1: CI guard — żaden PNG/JPG w public/catalogs

**Files:**
- Create: `scripts/check-no-rasterized-non-webp.mjs`
- Modify: `package.json` (dodanie skryptu i wpięcie w `prebuild`)

- [ ] **Step 1: Stwórz check**

```js
// scripts/check-no-rasterized-non-webp.mjs
// Failuje, jeśli w public/catalogs istnieje plik .png/.jpg/.jpeg.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('public/catalogs');
const FORBIDDEN = /\.(png|jpe?g)$/i;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

const offenders = [];
for await (const f of walk(ROOT)) {
  if (FORBIDDEN.test(f)) offenders.push(path.relative(process.cwd(), f));
}

if (offenders.length) {
  console.error(`\n✖ Found ${offenders.length} non-WebP raster file(s) under public/catalogs:`);
  for (const f of offenders) console.error('  ' + f);
  console.error('\nConvert them to .webp (preserving alpha for transparent layers) and remove the originals.');
  process.exit(1);
}
console.log('✓ public/catalogs is WebP-only');
```

- [ ] **Step 2: Wpisz do package.json**

W `package.json` dodaj `assets:check` i podepnij do `prebuild`:

```json
{
  "scripts": {
    "assets:check": "node scripts/check-no-rasterized-non-webp.mjs",
    "prebuild": "node scripts/check-no-rasterized-non-webp.mjs && node scripts/generate-thumbnails.mjs"
  }
}
```

- [ ] **Step 3: Uruchom check**

```bash
npm run assets:check
```

Expected: `✓ public/catalogs is WebP-only` (zakładając że Phase 7 przeszło).

- [ ] **Step 4: Negatywny test (manualnie)**

```bash
cp src/generated/responsive-image-manifest.json public/catalogs/QS/materials/_test.png
npm run assets:check
```

Expected: exit code 1, lista zawiera `_test.png`.

```bash
rm public/catalogs/QS/materials/_test.png
```

- [ ] **Step 5: Commit**

```bash
git add scripts/check-no-rasterized-non-webp.mjs package.json
git commit -m "chore(ci): fail build if non-WebP raster files appear under public/catalogs"
```

### Task 10.2: Zawęź `catalog-loader` i `generate-thumbnails` do WebP-only

**Files:**
- Modify: `src/lib/catalog-loader.ts:99,103,300-302`
- Modify: `scripts/generate-thumbnails.mjs:33,143-146`

- [ ] **Step 1: Failing test dla loadera (lub poszerz istniejący)**

Jeżeli istnieje `src/lib/catalog-loader.test.ts`, dodaj test, że `IMAGE_EXTENSION_PRIORITY` zawiera tylko `.webp`. Jeżeli nie istnieje:

```ts
// src/lib/catalog-loader.test.ts (Create)
import { test, expect } from 'vitest';
// @ts-expect-error - import internal const for test
import { IMAGE_EXTENSION_PRIORITY, WEBP_SOURCE_EXTENSIONS } from './catalog-loader';

test('catalog-loader supports only webp', () => {
  expect(IMAGE_EXTENSION_PRIORITY).toEqual(['.webp']);
  expect([...WEBP_SOURCE_EXTENSIONS]).toEqual([]);
});
```

(Jeżeli stałe nie są eksportowane — w Step 2 dopisz `export` przy nich w `catalog-loader.ts` żeby dało się przetestować, lub zastąp test snapshotem treści pliku.)

- [ ] **Step 2: Test failuje**

```bash
npm test -- src/lib/catalog-loader.test.ts
```

- [ ] **Step 3: Zwęź `IMAGE_EXTENSION_PRIORITY` i `WEBP_SOURCE_EXTENSIONS`**

W `src/lib/catalog-loader.ts`:

- linia 99:
  ```ts
  export const IMAGE_EXTENSION_PRIORITY = ['.webp'] as const;
  ```
- linia 103:
  ```ts
  export const WEBP_SOURCE_EXTENSIONS = new Set<string>();
  ```
- linie 300-302 — usuń wpisy `.png`, `.jpg`, `.jpeg` z tablicy/zbioru obsługiwanych formatów (zostaw tylko `.webp`).

- [ ] **Step 4: Test passuje**

```bash
npm test -- src/lib/catalog-loader.test.ts && npm test
```

(Pełny suite — bo zwężenie typu obrazów może uderzyć w inne testy/komponenty. Jeśli tak, napraw — to jest świadoma zmiana kontraktu.)

- [ ] **Step 5: Zwęź `generate-thumbnails.mjs`**

W `scripts/generate-thumbnails.mjs`:

- linia 33:
  ```js
  const IMAGE_EXTENSIONS = new Set(['.webp']);
  ```
- linie 143-146 — usuń branche `.jpg/.jpeg` i `.png`. Zostaw tylko obsługę `.webp`. Cały blok if/else powinien sprowadzić się do:
  ```js
  pipeline = pipeline.webp({ quality: 85, alphaQuality: 100, effort: 6 });
  ```

- [ ] **Step 6: Pełen build**

```bash
npm run thumbnails && npm test && npm run typecheck && npm run build
```

Expected: bez błędów. Manifest pozostaje WebP-only.

- [ ] **Step 7: Commit**

```bash
git add src/lib/catalog-loader.ts scripts/generate-thumbnails.mjs src/lib/catalog-loader.test.ts
git commit -m "chore(pipeline): tighten loader and thumbnail generator to WebP-only"
```

---

## Phase 11 — Performance polish

### Task 11.1: Migracja Lato z @import na next/font

**Files:**
- Modify: `src/app/layout.tsx:1-30`
- Modify: `src/app/globals.css:1` (usuń `@import url(...)`)

- [ ] **Step 1: Zaimportuj font przez next/font w layout.tsx**

W `src/app/layout.tsx` dodaj na górze (przed `import './globals.css'`):

```tsx
import { Lato } from 'next/font/google';

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
});
```

I w komponencie `RootLayout` dodaj klasę `lato.variable` na `<html>`:

```tsx
<html lang="en" className={lato.variable}>
```

- [ ] **Step 2: Wymień `'Lato', sans-serif` na `var(--font-lato)` w globals.css**

```bash
grep -n "'Lato', sans-serif\|var(--font-display)\|--font-body\|--font-display" src/app/globals.css | head -20
```

Zmień definicje tokenów w `:root`:
- `--font-display: 'Lato', sans-serif;` → `--font-display: var(--font-lato), sans-serif;`
- to samo dla `--font-body` i `--font-qx`

Oraz wszystkie literały `font-family: 'Lato', sans-serif` zamień na `font-family: var(--font-lato), sans-serif`.

- [ ] **Step 3: Usuń @import z globals.css**

Skasuj linię 1: `@import url('https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap');`

- [ ] **Step 4: Pełen build + dev test**

```bash
npm run typecheck && npm run build && npm run dev
```

Otwórz `/`, `/catalog/QX`, `/catalog/QS`. Font Lato musi się ładować (DevTools → Network → szukaj requestu do `fonts.gstatic.com` lub lokalnego `_next/static/media/...`). Brak FOUT przy refresh.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "perf(fonts): load Lato via next/font instead of CSS @import"
```

### Task 11.2: `content-visibility` dla ciężkich sekcji

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Dodaj reguły content-visibility**

W `src/app/globals.css` na końcu pliku dodaj:

```css
/* Performance: defer offscreen rendering of heavy below-fold sections.
   contain-intrinsic-size dobrane orientacyjnie z mobile 390px. */
@supports (content-visibility: auto) {
  .catalog-qx0 #packshots,
  .catalog-qx0 #materials,
  .catalog-qx0 #codes,
  .catalog-qx0 #features {
    content-visibility: auto;
    contain-intrinsic-size: 1px 4000px;
  }
}
```

(Zachowaj `scroll-margin-top: 56px` z linii 472-474 — kotwice nadal działają.)

- [ ] **Step 2: Test wizualny + scroll-anchor test**

```bash
npm run dev
```

W 390×844 i 1440×900:
- `/catalog/QX` — przewiń do dołu, potem klikaj kotwice w nawigacji (Models, Customization, Codes). Każda musi precyzyjnie scroll'ować do sekcji (offset 56px), nie wstawiać "skoku".
- W DevTools Performance → record → Reload — sprawdź czy `Layout` time spadł vs baseline (notuj liczbę przed/po).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "perf(catalog): use content-visibility on heavy below-fold sections"
```

### Task 11.3: Video w Features — preload metadata + IntersectionObserver play

**Files:**
- Modify: `src/layouts/qx/FeaturesQX.tsx`

- [ ] **Step 1: Zmapuj obecny `<video>`**

```bash
grep -n "<video\|preload\|autoplay\|loop" src/layouts/qx/FeaturesQX.tsx | head -20
```

Zapisz props i miejsce użycia.

- [ ] **Step 2: Zmień preload na metadata i odpal play tylko gdy widoczne**

W `FeaturesQX.tsx`:

```tsx
import { useEffect, useRef } from 'react';

function FeatureVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      className="..."
    />
  );
}
```

Zastosuj `<FeatureVideo>` w miejscach gdzie aktualnie jest `<video>` z `autoPlay` / `preload="auto"`.

- [ ] **Step 3: Test wizualny**

```bash
npm run dev
```

`/catalog/QX#features`:
- przy load strony video się NIE buforuje pełnym strumieniem (Network panel — początkowo tylko metadata range request)
- gdy sekcja Features wjeżdża w viewport, video startuje
- gdy scroll wyjedzie poza, video się pauzuje

- [ ] **Step 4: Commit**

```bash
git add src/layouts/qx/FeaturesQX.tsx
git commit -m "perf(features): play video on intersect, preload metadata only"
```

---

## Self-Review Checklist (do wykonania przy starcie pracy)

- [ ] Każde zadanie ma dokładne ścieżki plików (Files)
- [ ] Każdy step z kodem zawiera kompletny snippet, nie szkic
- [ ] Każdy `npm test`/`npm run dev` ma wyraźnie podane oczekiwane zachowanie
- [ ] Phase 0 jest BLOKADĄ — wszystkie inne fazy mogą się odpalić niezależnie po niej
- [ ] Phase 7 (PNG migration) musi przejść PRZED Phase 10 (CI guard) — w przeciwnym razie guard zafailuje build
- [ ] Phase 11.1 (next/font) wymaga restart `npm run dev` po zmianie

## Items świadomie przeniesione do osobnych planów

- **Progressive packshot display** (karuzela / accordion / featured + show all dla QX 18 modeli) — wymaga produktowej decyzji + brainstormu UX
- **Redukcja `use client`** w sekcjach katalogu — wymaga audytu interakcji w każdym komponencie i potencjalnego rozdzielenia na server + client island
- **Hero copy mobile shorter variants** — wymaga decyzji contentowej (kto pisze krótszy mobile copy)
- **Brand label / logo per katalog** w nav — Phase 0 naprawia aria-label; per-katalog logo (nie tylko `metro_logo.svg` z `/catalogs/QX/`) wymaga decyzji o assetach
