# Plan implementacji — pozostała część raportu (post-Sprint-A+B)

> **Dla wykonawcy (agenta lub człowieka):** WYMAGANY SUB-SKILL — użyj `superpowers:subagent-driven-development` (zalecane) albo `superpowers:executing-plans`, żeby przeprowadzić plan task-by-task. Kroki są oznaczone checkboxami (`- [ ]`).

**Goal:** Wdrożyć pozostałe rekomendacje z `raport.md` (2026-05-08) w czterech fazach (P1 → P2 → P3 → P4) — config hardening, refaktor placeholder layoutów, deduplikacja skryptów image-pipeline, audyty (font-weights, `'use client'`), uzupełnienie testów dla middleware/OAuth/sitemap. Sprint A i B (cleanup martwego kodu) zostały już wykonane.

**Architecture:** Praca odbywa się głównie w `src/layouts/qx/`, `src/components/catalog/`, `src/app/catalog/[catalogId]/`, `scripts/lib/`, oraz konfigach roota (`next.config.ts`, `eslint.config.mjs`). Każda faza kończy się działającym buildem (`npm run build`) i zielonym testem (`npm test`). Pomiędzy taskami robimy jeden commit na zadanie.

**Tech Stack:** Next.js 15.5, React 19, Tailwind 3, framer-motion 12, sharp 0.33, vitest 2, ESLint 9, TypeScript 5.9.

**Założenia globalne:**
- Pracujemy na bieżącym branchu (`stage_2`). Nie zmieniamy brancha, nie pushujemy nic bez zgody użytkownika.
- `git add <ścieżki>` — nigdy `git add -A` (preferencja użytkownika).
- Każdy task kończy się commitem. Po każdej fazie odpalamy `npm run build` (nie po każdym tasku).
- Komendy uruchamiamy z roota repo: `/Users/micz/__DEV__/__METRO_catalogs`.
- Memory: nie usuwać `src/app/design-system/page.tsx`. Skrypty PowerShell/`*.bat` są zamierzone (dual-platform setup).

**Co JEST już zrobione (kontekst):**
- Sprint A: usunięte `src/app/layout.js`, `src/vite-env.d.ts`, `src/test/example.test.ts`; `pnpm`/`vercel` z deps; duplikat `.next-build` z `.gitignore`.
- Sprint B: usunięte `src/components/ui/sonner.tsx`, `src/components/ui/tooltip.tsx`, `src/lib/utils.ts`; uproszczony `src/app/providers.tsx`; usunięte 6 deps (`@radix-ui/react-tooltip`, `sonner`, `next-themes`, `class-variance-authority`, `tailwind-merge`, `clsx`).
- Wszystkie testy zielone (49 passed), build zielony (22 stron).

---

## Mapa plików w planie

| Akcja | Plik | Zadanie |
|---|---|---|
| Modify | [src/layouts/qx/PackshotsQX.tsx](src/layouts/qx/PackshotsQX.tsx) (linia 267) | Task 1 — z-modal fix |
| Modify | 6 plików w [src/layouts/qx/](src/layouts/qx/) | Task 2 — `decoding="async"` |
| Modify | [next.config.ts](next.config.ts) | Task 3 — optimizePackageImports + removeConsole |
| Modify | [eslint.config.mjs](eslint.config.mjs) | Task 4 — no-console rule |
| Create | `src/components/catalog/CatalogPagePlaceholder.tsx` | Task 5 — unified placeholder |
| Delete | [src/layouts/type2/CatalogPageType2.tsx](src/layouts/type2/CatalogPageType2.tsx), [src/layouts/type3/CatalogPageType3.tsx](src/layouts/type3/CatalogPageType3.tsx) | Task 5 |
| Modify | [src/app/catalog/[catalogId]/page.tsx](src/app/catalog/[catalogId]/page.tsx) | Task 5 — re-route layoutMap |
| Modify | [src/components/catalog/ColorChip.tsx](src/components/catalog/ColorChip.tsx) | Task 6 — `<img>` → `next/image` (opcjonalne) |
| Create | `scripts/lib/image-utils.mjs` | Task 7 |
| Modify | [scripts/process-images.mjs](scripts/process-images.mjs), [scripts/recompress-gallery-bases.mjs](scripts/recompress-gallery-bases.mjs), [scripts/generate-thumbnails.mjs](scripts/generate-thumbnails.mjs) | Task 7 |
| Modify | [src/app/layout.tsx](src/app/layout.tsx) (linia 9) | Task 8 — Lato weights audit |
| Create | `src/middleware.test.ts` | Task 9 — testy middleware |
| Create | `src/lib/oauth-discovery.test.ts` | Task 10 — testy OAuth discovery |
| Create | `src/app/sitemap.test.ts` | Task 11 — testy sitemap |
| Audyt (raport) | n/a — analiza | Task 12 — `'use client'` audit w QX layouts |

---

## TL;DR kolejność

| # | Faza | Zadanie | Czas | Risk |
|---|---|---|---|---|
| 1 | P1 | PackshotsQX z-modal fix | 5 min | None |
| 2 | P1 | `decoding="async"` na `<img>` | 10 min | None |
| 3 | P1 | next.config.ts (optimizePackageImports + removeConsole) | 10 min | Low |
| 4 | P1 | eslint.config.mjs (no-console rule) | 10 min | Low |
| 5 | P2 | Unifikacja Type2/Type3 → CatalogPagePlaceholder | 25 min | Low |
| 6 | P2 | ColorChip `<img>` → `next/image` (opcjonalne) | 15 min | Low |
| 7 | P3 | scripts/lib/image-utils.mjs ekstraktowanie | 40 min | Medium |
| 8 | P3 | Audyt wag Lato + trim | 20 min | Low |
| 9 | P4 | Testy middleware.ts | 30 min | None |
| 10 | P4 | Testy oauth-discovery.ts | 25 min | None |
| 11 | P4 | Testy sitemap.ts | 20 min | None |
| 12 | P5 | Audyt `'use client'` w QX (raport) | 30 min | None (analiza) |

---

# FAZA P1 — Quick wins (config + drobne fixy)

## Task 1: PackshotsQX inline lightbox — z-modal fix

**Goal:** Poprawić z-index inline lightboxa w `PackshotsQX` z `z-[60]` na `z-modal` (var(--z-modal)=80), żeby był spójny z globalnym `Lightbox` i przykrywał `CatalogNav`.

**Files:**
- Modify: [src/layouts/qx/PackshotsQX.tsx:267](src/layouts/qx/PackshotsQX.tsx#L267)

**Why:** Raport sekcja 4.7. Globalny komponent [Lightbox.tsx](src/components/catalog/Lightbox.tsx) używa już `z-modal`. `PackshotsQX` ma drugą inline implementację dla desktopu z hardkodowanym `z-[60]`, który jest niżej niż `z-modal=80` — w niektórych konfiguracjach `CatalogNav` (`z-[60]`) renderuje się na tym samym poziomie.

- [ ] **Step 1.1: Zlokalizuj linię.** Komenda:

```bash
grep -n 'z-\[60\]' src/layouts/qx/PackshotsQX.tsx
```

Expected output: `267:            className="fixed inset-0 z-[60] bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4"`

- [ ] **Step 1.2: Edit.** W [src/layouts/qx/PackshotsQX.tsx](src/layouts/qx/PackshotsQX.tsx) linia 267 — zamień `z-[60]` na `z-modal`.

```tsx
// PRZED (linia 267):
className="fixed inset-0 z-[60] bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4"

// PO:
className="fixed inset-0 z-modal bg-foreground/90 backdrop-blur-md flex items-center justify-center p-4"
```

- [ ] **Step 1.3: Test + typecheck.** Komendy:

```bash
npm run typecheck
npm test -- src/layouts/qx
```

Expected: typecheck PASS, testy QX layoutów PASS (CatalogPageQX).

- [ ] **Step 1.4: Commit.**

```bash
git add src/layouts/qx/PackshotsQX.tsx
git commit -m "fix(qx): use z-modal for PackshotsQX inline lightbox"
```

---

## Task 2: `decoding="async"` na `<img>` z `loading="lazy"`

**Goal:** Dodać `decoding="async"` do każdego `<img>` który ma już `loading="lazy"`. Tani fix poprawiający parallel decoding (mniej blokowania głównego wątku przy scrollu).

**Files:**
- Modify: [src/layouts/qx/FinishesQX.tsx:316](src/layouts/qx/FinishesQX.tsx#L316) (oraz `loading="lazy"` na linii 270 — czyli należy znaleźć dokładny `<img>`)
- Modify: [src/layouts/qx/PackshotsQX.tsx:203](src/layouts/qx/PackshotsQX.tsx#L203), [src/layouts/qx/PackshotsQX.tsx:219](src/layouts/qx/PackshotsQX.tsx#L219)
- Modify: [src/layouts/qx/GalleryQX.tsx:84](src/layouts/qx/GalleryQX.tsx#L84), [src/layouts/qx/GalleryQX.tsx:106](src/layouts/qx/GalleryQX.tsx#L106)
- Modify: [src/layouts/qx/MaterialsQX.tsx:308](src/layouts/qx/MaterialsQX.tsx#L308)
- Modify: [src/layouts/qx/OverviewQX.tsx:57](src/layouts/qx/OverviewQX.tsx#L57)
- **Pomijamy:** [src/layouts/qx/HeroQX.tsx:322](src/layouts/qx/HeroQX.tsx#L322) — pierwsza slajda ma `loading="eager"` i jest potencjalnym LCP, więc `decoding="sync"` jest pożądane (default).

**Why:** Raport sekcja 4.6. `decoding="async"` na off-fold `<img>` zezwala browserowi na dekodowanie obrazu poza głównym wątkiem.

- [ ] **Step 2.1: Inwentaryzacja.** Komenda:

```bash
grep -n 'loading="lazy"' src/layouts/qx/*.tsx
```

Expected: 8 trafień (FinishesQX:270, PackshotsQX:208 i :224, GalleryQX:89 i :111, MaterialsQX:313, OverviewQX:62, HeroQX:322 — pomijamy ostatni).

- [ ] **Step 2.2: Edycja FinishesQX.tsx.** Otwórz plik, znajdź `<img>` zawierający `loading="lazy"` (okolice linii 270). Dodaj atrybut `decoding="async"` bezpośrednio po `loading="lazy"`.

```tsx
// PRZED:
loading="lazy"

// PO:
loading="lazy"
decoding="async"
```

Powtórz dla wszystkich 7 plików × po 1–2 wystąpienia (suma 7 edycji w 6 plikach z listy, bez HeroQX).

- [ ] **Step 2.3: Weryfikacja.** Komenda:

```bash
grep -c 'decoding="async"' src/layouts/qx/*.tsx
```

Expected: 7 trafień (FinishesQX:1, PackshotsQX:2, GalleryQX:2, MaterialsQX:1, OverviewQX:1).

- [ ] **Step 2.4: Test + typecheck.**

```bash
npm run typecheck && npm test
```

Expected: PASS, PASS.

- [ ] **Step 2.5: Commit.**

```bash
git add src/layouts/qx/FinishesQX.tsx src/layouts/qx/PackshotsQX.tsx src/layouts/qx/GalleryQX.tsx src/layouts/qx/MaterialsQX.tsx src/layouts/qx/OverviewQX.tsx
git commit -m "perf(qx): add decoding=async to off-fold images"
```

---

## Task 3: next.config.ts — optimizePackageImports + removeConsole

**Goal:** Skrócić bundle dla `lucide-react` i `framer-motion` przez `experimental.optimizePackageImports`. Wyciąć `console.log` z produkcji (zostawić `error`/`warn`).

**Files:**
- Modify: [next.config.ts](next.config.ts)

**Why:** Raport sekcja 3.3. Next.js 15 wspiera `optimizePackageImports`, który robi automatic barrel re-export tree-shaking dla nazwanych pakietów.

- [ ] **Step 3.1: Edit `next.config.ts`.** Aktualny plik to 44 linijki. Zaktualizuj `return { ... }` w funkcji `nextConfig` żeby zawierał `experimental` i `compiler`:

```ts
// src/.../next.config.ts (cały plik):
import type { NextConfig } from 'next';
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants';

const DEFAULT_DIST_DIR = '.next';
const LOCAL_ISOLATED_PROD_DIST_DIR = '.next-build';
const HOMEPAGE_AGENT_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"; profile="https://www.rfc-editor.org/info/rfc9727"',
  '</api/catalogs>; rel="service-desc"; type="application/json"',
].join(', ');

export default function nextConfig(phase: string): NextConfig {
  const isProdPhase =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;
  const isVercel = process.env.VERCEL === '1';
  const useLocalIsolatedProdDist =
    isProdPhase &&
    !isVercel &&
    process.env.NEXT_LOCAL_ISOLATED_DIST === '1';

  return {
    distDir: useLocalIsolatedProdDist
      ? LOCAL_ISOLATED_PROD_DIST_DIR
      : DEFAULT_DIST_DIR,
    experimental: {
      optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    compiler: {
      removeConsole: isProdPhase
        ? { exclude: ['error', 'warn'] }
        : false,
    },
    async headers() {
      return [
        {
          source: '/',
          headers: [
            {
              key: 'Link',
              value: HOMEPAGE_AGENT_LINKS,
            },
          ],
        },
      ];
    },
  };
}
```

- [ ] **Step 3.2: Build clean.** Komenda:

```bash
rm -rf .next .next-build && npm run build
```

Expected: `✓ Generating static pages (22/22)`. Bundle output sekcja `Route (app)` powinien pokazać podobne lub mniejsze rozmiary niż przed taskiem.

- [ ] **Step 3.3: Test.**

```bash
npm test
```

Expected: 49 passed, 1 skipped.

- [ ] **Step 3.4: Commit.**

```bash
git add next.config.ts
git commit -m "perf: enable optimizePackageImports and removeConsole in prod"
```

---

## Task 4: eslint.config.mjs — no-console rule

**Goal:** Dodać regułę `no-console` (ostrzega o `console.log` w `src/`, dopuszcza `console.warn`/`console.error`). Skrypty buildowe w `scripts/` są wyłączone.

**Files:**
- Modify: [eslint.config.mjs](eslint.config.mjs)

**Why:** Raport sekcja 3.4. `console.log` w produkcji byłby usunięty przez `compiler.removeConsole` z Task 3, ale lint powinien ostrzec już w trybie dev.

- [ ] **Step 4.1: Edit `eslint.config.mjs`.** Aktualnie 19 linijek; rozszerzyć o regułę dla `src/`:

```js
// eslint.config.mjs (cały plik):
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ['.next/**', '.next-build/**'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

export default eslintConfig;
```

- [ ] **Step 4.2: Run lint.** Komenda:

```bash
npm run lint
```

Expected: PASS (mogą pojawić się warningi `no-console` jeśli w `src/` jest `console.log` — sprawdź czy są zamierzone).

- [ ] **Step 4.3: Inwentaryzacja `console.log` w `src/`.** Komenda:

```bash
grep -rn 'console\.log\|console\.info\|console\.debug' src/ --include='*.ts' --include='*.tsx' 2>/dev/null
```

Jeśli są trafienia: ocenić indywidualnie, czy zostawić jako `console.warn`/`console.error`, czy usunąć.

- [ ] **Step 4.4: Test + typecheck.**

```bash
npm run typecheck && npm test
```

Expected: PASS, PASS.

- [ ] **Step 4.5: Commit.**

```bash
git add eslint.config.mjs
# + ewentualne zmiany w src/ jeśli były console.log do uprzątnięcia
git commit -m "chore(eslint): warn on console.log in src/"
```

---

**Po Fazie P1:** odpalić `npm run build` żeby zweryfikować, że nic się nie zepsuło.

```bash
rm -rf .next .next-build && npm run build
```

Expected: build zielony, 22 strony statyczne.

---

# FAZA P2 — Refactoring kodu

## Task 5: Unifikacja Type2/Type3 → CatalogPagePlaceholder

**Goal:** Zastąpić dwa identyczne pliki [CatalogPageType2.tsx](src/layouts/type2/CatalogPageType2.tsx) i [CatalogPageType3.tsx](src/layouts/type3/CatalogPageType3.tsx) jednym wspólnym komponentem `CatalogPagePlaceholder`. Routing layoutów w [page.tsx](src/app/catalog/[catalogId]/page.tsx) mapuje obie wartości (`type2`, `type3`) na ten sam komponent. **Nie zmieniamy** typu `CatalogLayoutType` ani `VALID_LAYOUT_TYPES` — zachowujemy publiczne wartości w `config.json` katalogów.

**Files:**
- Create: `src/components/catalog/CatalogPagePlaceholder.tsx`
- Modify: [src/app/catalog/[catalogId]/page.tsx](src/app/catalog/[catalogId]/page.tsx) (linie 11-21)
- Delete: [src/layouts/type2/CatalogPageType2.tsx](src/layouts/type2/CatalogPageType2.tsx)
- Delete: [src/layouts/type3/CatalogPageType3.tsx](src/layouts/type3/CatalogPageType3.tsx)
- Sprawdź: [src/types/catalog.ts:19](src/types/catalog.ts#L19) (`CatalogLayoutType` zostaje bez zmian: `'qx' | 'type2' | 'type3'`)
- Sprawdź: [src/lib/catalog-loader.ts:518](src/lib/catalog-loader.ts#L518) (`VALID_LAYOUT_TYPES` zostaje bez zmian)

**Why:** Raport sekcja 1.2. Pliki są identyczne (różnią się tylko nazwą funkcji, weryfikowane przez MD5). 88 linii duplikatu. Zachowujemy wartości `type2`/`type3` na wypadek gdyby w przyszłości miały rozdzielić się — wtedy łatwo dorobić oddzielne komponenty.

- [ ] **Step 5.1: Create CatalogPagePlaceholder.tsx.** Plik: `src/components/catalog/CatalogPagePlaceholder.tsx`

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

- [ ] **Step 5.2: Update page.tsx routing.** [src/app/catalog/[catalogId]/page.tsx](src/app/catalog/[catalogId]/page.tsx) — zastąp linie 10-21 (importy + layoutMap):

```tsx
// PRZED (linie 10-21):
import CatalogPageQX from '@/layouts/qx/CatalogPageQX';
import CatalogPageType2 from '@/layouts/type2/CatalogPageType2';
import CatalogPageType3 from '@/layouts/type3/CatalogPageType3';

const layoutMap: Record<
  CatalogLayoutType,
  typeof CatalogPageQX | typeof CatalogPageType2 | typeof CatalogPageType3
> = {
  qx: CatalogPageQX,
  type2: CatalogPageType2,
  type3: CatalogPageType3,
};

// PO:
import CatalogPageQX from '@/layouts/qx/CatalogPageQX';
import CatalogPagePlaceholder from '@/components/catalog/CatalogPagePlaceholder';

const layoutMap: Record<
  CatalogLayoutType,
  typeof CatalogPageQX | typeof CatalogPagePlaceholder
> = {
  qx: CatalogPageQX,
  type2: CatalogPagePlaceholder,
  type3: CatalogPagePlaceholder,
};
```

- [ ] **Step 5.3: Delete old layout files.** Komenda:

```bash
git rm src/layouts/type2/CatalogPageType2.tsx src/layouts/type3/CatalogPageType3.tsx
```

- [ ] **Step 5.4: Sprawdź czy katalogi są puste i je usuń.**

```bash
ls src/layouts/type2/ src/layouts/type3/ 2>/dev/null
```

Jeśli puste — usuń:

```bash
rmdir src/layouts/type2 src/layouts/type3
```

(`git rm` już oznaczył pliki jako usunięte; puste katalogi nie są w gicie, więc `rmdir` wystarcza.)

- [ ] **Step 5.5: Typecheck + test.**

```bash
npm run typecheck && npm test
```

Expected: PASS, PASS. Wszystkie 49 testów dalej działa (testy QX nie zależały od type2/type3).

- [ ] **Step 5.6: Manualna weryfikacja routingu.**

Sprawdź w `public/catalogs/*/config.json` jakiego `layoutType` używają QS/QX:

```bash
grep -rn '"layoutType"' public/catalogs/ 2>/dev/null
```

Expected: oba używają `"qx"` (memory: ostatnio QS i QX miały `layoutType: 'qx'`). Jeśli któryś katalog ma `type2` albo `type3` — przy `npm run dev` powinien renderować się placeholder z brand nameu z `globalConfig.brandName` i tytułem katalogu.

- [ ] **Step 5.7: Commit.**

```bash
git add src/components/catalog/CatalogPagePlaceholder.tsx src/app/catalog/[catalogId]/page.tsx
git commit -m "refactor: unify type2/type3 layouts into CatalogPagePlaceholder"
```

---

## Task 6: ColorChip `<img>` → `next/image` (OPCJONALNE — niski priorytet)

**Goal:** Zastąpić `<img>` w [src/components/catalog/ColorChip.tsx](src/components/catalog/ColorChip.tsx) (linie 60-67 i 75-80) komponentem `next/image` żeby skorzystać z optymalizacji Vercel Image.

**Skip jeśli:** użytkownik nie chce ruszać działającego kodu, miniaturki są tak małe że overhead `next/image` może być większy niż zysk.

**Files:**
- Modify: [src/components/catalog/ColorChip.tsx](src/components/catalog/ColorChip.tsx)

**Why:** Raport sekcja 4.3. Konsystencja z resztą galerii (która używa już `<img>` z `responsiveImg()` helperem). **Caveat:** memory observation 2124 zauważa że "rendered sizes are tiny (24px chip, ~116px tooltip)" — overhead `next/image` (extra HTML, Vercel image serwer roundtrip) może nie warto. **Decyzja użytkownika.**

- [ ] **Step 6.1: Sprawdź sizes thumbnaili.** Komenda:

```bash
ls -la public/catalogs/*/materials/*.webp 2>/dev/null | head
ls -la public/catalogs/shared/materials/*.webp 2>/dev/null | head
```

Jeśli pliki są <50 KB każdy — `next/image` da minimalny zysk. Jeśli są >100 KB — warto.

- [ ] **Step 6.2: Decyzja go/no-go.** Jeśli no-go: pomiń Task 6.

- [ ] **Step 6.3 (jeśli go): Edit `ColorChip.tsx`.** Dodaj import `next/image` i zastąp dwa `<img>`:

```tsx
// Dodaj na górze pliku:
import Image from 'next/image';

// PRZED (linie 60-67, w button):
<img
  src={option.thumbnail}
  alt=""
  aria-hidden="true"
  width={24}
  height={24}
  className="block h-6 w-6 border border-foreground/60 object-cover"
/>

// PO:
<Image
  src={option.thumbnail}
  alt=""
  aria-hidden
  width={24}
  height={24}
  className="block h-6 w-6 border border-foreground/60 object-cover"
  unoptimized
/>

// PRZED (linie 75-80, w tooltip):
<img
  src={option.thumbnail}
  alt=""
  aria-hidden="true"
  className="block aspect-square w-full object-cover"
/>

// PO:
<Image
  src={option.thumbnail}
  alt=""
  aria-hidden
  width={116}
  height={116}
  className="block aspect-square w-full object-cover"
  unoptimized
/>
```

`unoptimized` bo lokalne assety (Vercel image-optimizer dodaje narzut bez wyraźnej korzyści dla mikro thumbnaili).

- [ ] **Step 6.4: Typecheck + test.**

```bash
npm run typecheck && npm test -- src/components/catalog/ColorChip
```

Expected: PASS. Test `ColorChip.test.tsx` (3 tests) musi pozostać zielony — `next/image` w jsdom renderuje `<img>` pod spodem.

- [ ] **Step 6.5: Commit.**

```bash
git add src/components/catalog/ColorChip.tsx
git commit -m "refactor: use next/image for ColorChip swatches"
```

---

**Po Fazie P2:** `npm run build` (i opcjonalnie `npm run dev` + manualne sprawdzenie w przeglądarce).

---

# FAZA P3 — Skrypty + audyty

## Task 7: scripts/lib/image-utils.mjs ekstraktowanie

**Goal:** Wyciągnąć wspólny boilerplate ze skryptów `process-images.mjs`, `recompress-gallery-bases.mjs`, `generate-thumbnails.mjs` do nowego modułu `scripts/lib/image-utils.mjs`. Wzór już istnieje (`scripts/lib/section-widths.mjs`).

**Files:**
- Create: `scripts/lib/image-utils.mjs`
- Modify: [scripts/process-images.mjs](scripts/process-images.mjs) (header)
- Modify: [scripts/recompress-gallery-bases.mjs](scripts/recompress-gallery-bases.mjs) (header)
- Modify: [scripts/generate-thumbnails.mjs](scripts/generate-thumbnails.mjs) (header)

**Why:** Raport sekcja 4.2. Skrypty duplikują:
- `__filename`/`__dirname`/`ROOT`/`PUBLIC` boilerplate
- `loadSharp()` (try/catch import)
- regex pomijania wariantów `*-NNNw.webp`

**WAŻNE:** zachować zachowanie 1:1. Wszystkie istniejące snapshoty (`/tmp/metro-gallery-bases-before.txt` itp.) muszą dalej działać.

- [ ] **Step 7.1: Create `scripts/lib/image-utils.mjs`.**

```js
/**
 * Wspólne helpery dla skryptów image-pipeline.
 * Importowane przez: process-images.mjs, recompress-gallery-bases.mjs, generate-thumbnails.mjs.
 */

import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Wylicza absolutne ścieżki ROOT i PUBLIC z perspektywy skryptu w `scripts/`.
 * Używaj tak: const { ROOT, PUBLIC } = pathsFromScript(import.meta.url);
 */
export function pathsFromScript(importMetaUrl) {
  const __dirname = path.dirname(fileURLToPath(importMetaUrl));
  const ROOT = path.resolve(__dirname, '..');
  const PUBLIC = path.join(ROOT, 'public');
  return { __dirname, ROOT, PUBLIC };
}

/**
 * Próbuje załadować `sharp`; przy błędzie wypisuje komunikat i exit(1).
 * Zwraca `sharp` (callable factory).
 */
export async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    console.error('Error: sharp is not installed. Run: npm install --save-dev sharp');
    process.exit(1);
  }
}

/**
 * Predykat: czy plik `name` jest wariantem responsywnym (np. `hero_00-640w.webp`).
 * Używamy go żeby pominąć wygenerowane warianty przy operacjach na bazach.
 */
export function isResponsiveVariant(name) {
  return /-\d+w\.webp$/i.test(name);
}
```

- [ ] **Step 7.2: Refactor `scripts/recompress-gallery-bases.mjs` (header).** Otwórz plik, znajdź sekcję pod docblockiem (linie 22-32 mniej więcej):

```js
// PRZED:
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

// PO:
import fs from 'fs/promises';
import path from 'path';
import { pathsFromScript, loadSharp, isResponsiveVariant } from './lib/image-utils.mjs';

const { ROOT, PUBLIC } = pathsFromScript(import.meta.url);
const sharp = await loadSharp();
```

Następnie: jeśli skrypt ma własny `isResponsiveVariant`/`isGeneratedThumbnail` regex w środku — zamień na import.

- [ ] **Step 7.3: Refactor `scripts/generate-thumbnails.mjs` (header).** Analogicznie:

```js
// PRZED (linie 19-31):
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SECTION_ASPECTS, SECTION_WIDTHS } from './lib/section-widths.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const MANIFEST_OUTPUT = path.join(
  ROOT,
  'src',
  'generated',
  'responsive-image-manifest.json',
);

// PO:
import fs from 'fs/promises';
import path from 'path';
import { SECTION_ASPECTS, SECTION_WIDTHS } from './lib/section-widths.mjs';
import { pathsFromScript, loadSharp, isResponsiveVariant } from './lib/image-utils.mjs';

const { ROOT, PUBLIC } = pathsFromScript(import.meta.url);
const MANIFEST_OUTPUT = path.join(
  ROOT,
  'src',
  'generated',
  'responsive-image-manifest.json',
);
```

Plus: jeśli `generate-thumbnails.mjs` ma lokalny `loadSharp` lub równoważny — zastąp `const sharp = await loadSharp();`. Jeśli ma lokalną wersję `isResponsiveVariant` (np. inline regex `/-\d+w\.webp$/`) — zastąp importem.

- [ ] **Step 7.4: Refactor `scripts/process-images.mjs` (header).** Plik to orchestrator, niewiele do dedupować, ale `pathsFromScript` można wykorzystać:

```js
// PRZED (linie 23-29):
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CATALOGS = path.join(ROOT, 'public', 'catalogs');
const MANIFEST = path.join(ROOT, 'src', 'generated', 'responsive-image-manifest.json');

// PO:
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { pathsFromScript } from './lib/image-utils.mjs';

const { ROOT } = pathsFromScript(import.meta.url);
const CATALOGS = path.join(ROOT, 'public', 'catalogs');
const MANIFEST = path.join(ROOT, 'src', 'generated', 'responsive-image-manifest.json');
```

(W `process-images.mjs` `__dirname` jest często niepotrzebne — jeśli jest używane gdzie indziej, dodaj `const { __dirname, ROOT } = pathsFromScript(...)`.)

- [ ] **Step 7.5: Smoke test skryptów.** Każdy skrypt musi działać identycznie jak przed refaktorem.

```bash
# 1. Snapshot rozmiarów PRZED:
du -ah public/catalogs/QX/gallery/*.webp public/catalogs/QS/gallery/*.webp 2>/dev/null \
  | grep -v -- '-[0-9]\+w\.webp$' \
  | tee /tmp/metro-gallery-bases-pre-task7.txt

# 2. Odpalenie skryptów (idempotentnie):
node scripts/recompress-gallery-bases.mjs
node scripts/generate-thumbnails.mjs
node scripts/process-images.mjs

# 3. Sprawdź manifest:
cat src/generated/responsive-image-manifest.json | head -20

# 4. Snapshot PO:
du -ah public/catalogs/QX/gallery/*.webp public/catalogs/QS/gallery/*.webp 2>/dev/null \
  | grep -v -- '-[0-9]\+w\.webp$' \
  | tee /tmp/metro-gallery-bases-post-task7.txt

# 5. Diff:
diff /tmp/metro-gallery-bases-pre-task7.txt /tmp/metro-gallery-bases-post-task7.txt
```

Expected: pliki bazowe gallery niezmienione (idempotencja). Manifest istnieje i ma poprawną strukturę.

- [ ] **Step 7.6: Test + typecheck.**

```bash
npm run typecheck && npm test
```

Expected: PASS, PASS (testy `scripts/__tests__/preset-parity.test.ts` itd. nadal działają).

- [ ] **Step 7.7: Commit.**

```bash
git add scripts/lib/image-utils.mjs scripts/process-images.mjs scripts/recompress-gallery-bases.mjs scripts/generate-thumbnails.mjs
git commit -m "refactor(scripts): extract pathsFromScript/loadSharp into image-utils"
```

---

## Task 8: Audyt wag Lato + trim

**Goal:** Sprawdzić, które z 5 załadowanych wag fontu Lato (100, 300, 400, 700, 900) są faktycznie używane w kodzie i CSS. Usunąć nieużywane (zwłaszcza `100`, jeśli nigdzie nie ma `font-thin`).

**Files:**
- Modify: [src/app/layout.tsx](src/app/layout.tsx) (linia 9)
- Sprawdź: [src/app/globals.css](src/app/globals.css) (font-weight: NN)
- Sprawdź: cały `src/` na klasy Tailwind `font-thin`/`font-light`/`font-normal`/`font-medium`/`font-semibold`/`font-bold`/`font-black`

**Why:** Raport sekcja 4.4. Każda wag fontu = osobny plik (woff2). 5 wag × dwa style = potencjalnie do 10 plików font. Trim daje oszczędność na każdym pierwszym ładowaniu.

**Mapowanie Tailwind → numerical:**
- `font-thin` → 100
- `font-extralight` → 200
- `font-light` → 300
- `font-normal` → 400 (default)
- `font-medium` → 500
- `font-semibold` → 600
- `font-bold` → 700
- `font-extrabold` → 800
- `font-black` → 900

- [ ] **Step 8.1: Inwentaryzacja klas Tailwind.**

```bash
grep -rohn 'font-\(thin\|extralight\|light\|normal\|medium\|semibold\|bold\|extrabold\|black\)' src/ --include='*.tsx' --include='*.ts' \
  | sed 's/.*://; s/.*\(font-[a-z]*\).*/\1/' \
  | sort | uniq -c | sort -rn
```

Spodziewany wynik (z dotychczasowej analizy):
- `font-normal` ×9 (wszędzie nagłówki sekcji)
- `font-bold` ×7
- `font-black` ×2 (page.tsx grid hover labels)
- `font-medium` ×1
- `font-thin`, `font-light`, `font-extralight`, `font-semibold`, `font-extrabold` — sprawdź wynik.

- [ ] **Step 8.2: Inwentaryzacja `font-weight` w CSS.**

```bash
grep -n 'font-weight' src/app/globals.css
```

Spodziewane wagi w CSS (z analizy raportu): 200, 300, 500, 600, 700, 200.

**UWAGA:** wagi 200, 500, 600 są referencowane w CSS, ale **NIE** są ładowane przez `next/font` (lista to 100, 300, 400, 700, 900). Browser wykonuje fallback na najbliższą dostępną wagę. To istniejący stan — analiza ujawnia rozjazd, ale nie jest to nowy bug; **nie zmieniamy CSS w tym tasku**.

- [ ] **Step 8.3: Decyzja co zostawić.**

Reguła: zostawiamy wagę W jeśli (a) używana w `font-XX` w `src/`, ALBO (b) referencowana przez `font-weight: W` w `globals.css`.

Najprawdopodobniejszy wynik:
- `100` — usuń (brak `font-thin` w `src/`, brak `font-weight: 100` w CSS)
- `300` — zostaw (CSS:167, CSS:599, CSS:610)
- `400` — zostaw (default, dużo `font-normal`)
- `700` — zostaw (`font-bold`, CSS:228, CSS:721)
- `900` — zostaw (`font-black` w page.tsx)

Jeśli krok 8.1 pokaże użycie `font-thin` (100) lub `font-light` (300) gdzie indziej — zaktualizuj decyzję.

- [ ] **Step 8.4: Edit `src/app/layout.tsx` — usuń wagę 100.**

```tsx
// PRZED (linia 7-12):
const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
});

// PO:
const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
});
```

- [ ] **Step 8.5: Build + ręczny smoke test.**

```bash
rm -rf .next .next-build && npm run build
npm start &  # opcjonalnie
```

Otwórz `http://localhost:3000` i `http://localhost:3000/catalog/QX` w przeglądarce. Sprawdź czy nagłówki, paragrafy itp. wyglądają identycznie. Sprawdź zakładkę Network → Fonts: jest jeden plik mniej (Lato-Thin).

- [ ] **Step 8.6: Test + typecheck.**

```bash
npm run typecheck && npm test
```

Expected: PASS, PASS.

- [ ] **Step 8.7: Commit.**

```bash
git add src/app/layout.tsx
git commit -m "perf(fonts): drop unused Lato weight 100"
```

---

**Po Fazie P3:** `npm run build` + manualny smoke test.

---

# FAZA P4 — Test coverage

## Task 9: Testy `src/middleware.ts`

**Goal:** Pokryć jednostkowo logikę content-negotiation w `middleware.ts` — funkcje `acceptsMarkdown` i `isHtmlRoute` (obecnie nie eksportowane). Zmienimy je na eksportowane (no-op refactor) i napiszemy testy.

**Files:**
- Modify: [src/middleware.ts](src/middleware.ts) — eksportuj `acceptsMarkdown` i `isHtmlRoute` (obecnie są lokalnymi funkcjami)
- Create: `src/middleware.test.ts`

**Why:** Raport sekcja 5.2. Middleware decyduje czy request idzie do HTML czy do `/agent-markdown` route. Testowanie unitarne tych decyzji jest tanie i wartościowe (regression-proof content negotiation).

- [ ] **Step 9.1: Edit `src/middleware.ts` — eksportuj helpery.** Zmień `function acceptsMarkdown(...)` → `export function acceptsMarkdown(...)`; analogicznie `isHtmlRoute`.

```ts
// W src/middleware.ts:

// PRZED (linia 6):
function acceptsMarkdown(request: NextRequest): boolean {

// PO:
export function acceptsMarkdown(request: NextRequest): boolean {

// PRZED (linia 22):
function isHtmlRoute(pathname: string): boolean {

// PO:
export function isHtmlRoute(pathname: string): boolean {
```

- [ ] **Step 9.2: Write failing test.** Plik: `src/middleware.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { acceptsMarkdown, isHtmlRoute } from './middleware';

function makeRequest(accept: string | null): NextRequest {
  const headers = new Headers();
  if (accept !== null) headers.set('accept', accept);
  return new NextRequest('http://localhost/test', { headers });
}

describe('isHtmlRoute', () => {
  it('returns true for catalog page', () => {
    expect(isHtmlRoute('/catalog/QX')).toBe(true);
  });

  it('returns true for root', () => {
    expect(isHtmlRoute('/')).toBe(true);
  });

  it('returns false for /agent-markdown', () => {
    expect(isHtmlRoute('/agent-markdown')).toBe(false);
  });

  it('returns false for /agent-markdown subpaths', () => {
    expect(isHtmlRoute('/agent-markdown/foo')).toBe(false);
  });

  it('returns false for /_next/* assets', () => {
    expect(isHtmlRoute('/_next/static/chunks/x.js')).toBe(false);
  });

  it('returns false for /api/* routes', () => {
    expect(isHtmlRoute('/api/catalogs')).toBe(false);
  });

  it('returns false for /.well-known/* discovery', () => {
    expect(isHtmlRoute('/.well-known/oauth-authorization-server')).toBe(false);
  });

  it('returns false for files with extensions', () => {
    expect(isHtmlRoute('/favicon.ico')).toBe(false);
    expect(isHtmlRoute('/robots.txt')).toBe(false);
    expect(isHtmlRoute('/sitemap.xml')).toBe(false);
  });
});

describe('acceptsMarkdown', () => {
  it('returns false when Accept header is missing', () => {
    expect(acceptsMarkdown(makeRequest(null))).toBe(false);
  });

  it('returns false for plain text/html', () => {
    expect(acceptsMarkdown(makeRequest('text/html'))).toBe(false);
  });

  it('returns true for plain text/markdown', () => {
    expect(acceptsMarkdown(makeRequest('text/markdown'))).toBe(true);
  });

  it('returns true for text/markdown with q>0', () => {
    expect(acceptsMarkdown(makeRequest('text/markdown;q=0.8'))).toBe(true);
  });

  it('returns false for text/markdown with q=0', () => {
    expect(acceptsMarkdown(makeRequest('text/markdown;q=0'))).toBe(false);
  });

  it('returns true when text/markdown is one of multiple types', () => {
    expect(
      acceptsMarkdown(makeRequest('text/html, text/markdown;q=0.9, */*;q=0.1')),
    ).toBe(true);
  });

  it('returns false when only text/markdown;q=0', () => {
    expect(
      acceptsMarkdown(makeRequest('text/html, text/markdown;q=0')),
    ).toBe(false);
  });
});
```

- [ ] **Step 9.3: Run test — expect FAIL or pass.**

```bash
npm test -- src/middleware.test.ts
```

Expected: PASS (logika już istnieje; eksport został właśnie dodany).

- [ ] **Step 9.4: Commit.**

```bash
git add src/middleware.ts src/middleware.test.ts
git commit -m "test: cover middleware content negotiation logic"
```

---

## Task 10: Testy `src/lib/oauth-discovery.ts`

**Goal:** Pokryć jednostkowo cztery factory funkcje: `buildOAuthDiscoveryMetadata`, `buildOpenIdConfiguration`, `buildProtectedResourceMetadata`, `buildJwks` plus header helpers.

**Files:**
- Create: `src/lib/oauth-discovery.test.ts`

**Why:** Raport sekcja 5.2. JSON shapes są konsumowane przez external compliance tooling; każda regresja w nazwach pól może złamać clientów.

- [ ] **Step 10.1: Sprawdź jak `getSiteUrl()` działa w testach.** Komenda:

```bash
cat src/lib/site-url.ts
```

Jeśli zwraca z `process.env.SITE_URL` (lub podobnie) — w teście trzeba zamockować. Założenie: zwraca string (np. `https://example.com`).

- [ ] **Step 10.2: Write failing test.** Plik: `src/lib/oauth-discovery.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/site-url', () => ({
  getSiteUrl: () => 'https://test.metro.example',
}));

import {
  buildOAuthDiscoveryMetadata,
  buildOpenIdConfiguration,
  buildProtectedResourceMetadata,
  buildJwks,
  discoveryJsonHeaders,
  oauthEndpointHeaders,
} from './oauth-discovery';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildOAuthDiscoveryMetadata', () => {
  it('returns expected core fields', () => {
    const meta = buildOAuthDiscoveryMetadata();
    expect(meta.issuer).toBe('https://test.metro.example');
    expect(meta.authorization_endpoint).toBe('https://test.metro.example/oauth/authorize');
    expect(meta.token_endpoint).toBe('https://test.metro.example/oauth/token');
    expect(meta.jwks_uri).toBe('https://test.metro.example/oauth/jwks.json');
    expect(meta.response_types_supported).toEqual(['code']);
    expect(meta.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
    expect(meta.scopes_supported).toEqual(['openid', 'profile', 'email', 'catalogs:read']);
    expect(meta.code_challenge_methods_supported).toEqual(['S256']);
    expect(meta.token_endpoint_auth_methods_supported).toContain('none');
  });

  it('points service_documentation to .well-known agent skill', () => {
    const meta = buildOAuthDiscoveryMetadata();
    expect(meta.service_documentation).toBe(
      'https://test.metro.example/.well-known/agent-skills/metro-catalog-discovery/SKILL.md',
    );
  });
});

describe('buildOpenIdConfiguration', () => {
  it('extends OAuth metadata with OIDC fields', () => {
    const oidc = buildOpenIdConfiguration();
    expect(oidc.issuer).toBe('https://test.metro.example');
    expect(oidc.subject_types_supported).toEqual(['public']);
    expect(oidc.id_token_signing_alg_values_supported).toEqual(['RS256']);
    expect(oidc.claims_supported).toEqual(['sub', 'name', 'email']);
  });
});

describe('buildProtectedResourceMetadata', () => {
  it('returns metadata for /api/catalogs resource', () => {
    const meta = buildProtectedResourceMetadata();
    expect(meta.resource).toBe('https://test.metro.example/api/catalogs');
    expect(meta.authorization_servers).toEqual(['https://test.metro.example']);
    expect(meta.scopes_supported).toEqual(['catalogs:read']);
    expect(meta.bearer_methods_supported).toEqual(['header']);
    expect(meta.resource_name).toBe('METRO Catalog API');
  });
});

describe('buildJwks', () => {
  it('returns empty key set for now', () => {
    expect(buildJwks()).toEqual({ keys: [] });
  });
});

describe('header helpers', () => {
  it('discovery headers are public-cacheable JSON', () => {
    const h = discoveryJsonHeaders();
    expect(h['Content-Type']).toBe('application/json; charset=utf-8');
    expect(h['Cache-Control']).toContain('public');
    expect(h['Cache-Control']).toContain('max-age=3600');
    expect(h['Access-Control-Allow-Origin']).toBe('*');
  });

  it('oauth endpoint headers are no-store', () => {
    const h = oauthEndpointHeaders();
    expect(h['Cache-Control']).toBe('no-store');
    expect(h['Access-Control-Allow-Methods']).toContain('POST');
  });
});
```

- [ ] **Step 10.3: Run test.**

```bash
npm test -- src/lib/oauth-discovery.test.ts
```

Expected: PASS (wszystkie funkcje są pure; mock site-url załatwia issuer).

- [ ] **Step 10.4: Commit.**

```bash
git add src/lib/oauth-discovery.test.ts
git commit -m "test: cover OAuth/OIDC discovery metadata builders"
```

---

## Task 11: Testy `src/app/sitemap.ts`

**Goal:** Pokryć generowanie sitemapy: poprawny URL bazowy, włączone wszystkie katalogi z `getCatalogList()`, struktura `MetadataRoute.Sitemap` zgodna z Next.js 15.

**Files:**
- Create: `src/app/sitemap.test.ts`

**Why:** Raport sekcja 5.2. Sitemap to jedyny plik konsumowany przez Google/Bing — regresja jest niewidoczna w UI.

- [ ] **Step 11.1: Write test.** Plik: `src/app/sitemap.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/site-url', () => ({
  getSiteUrl: () => 'https://test.metro.example',
}));

vi.mock('@/lib/catalog-loader', () => ({
  getCatalogList: vi.fn(),
}));

import { getCatalogList } from '@/lib/catalog-loader';
import sitemap from './sitemap';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sitemap', () => {
  it('always includes the homepage', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([]);
    const entries = await sitemap();
    expect(entries[0]).toMatchObject({
      url: 'https://test.metro.example/',
      changeFrequency: 'weekly',
      priority: 1,
    });
  });

  it('includes one entry per catalog', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([
      { id: 'QX' } as any,
      { id: 'QS' } as any,
    ]);
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://test.metro.example/catalog/QX');
    expect(urls).toContain('https://test.metro.example/catalog/QS');
    expect(entries.length).toBe(3); // home + 2 catalogs
  });

  it('catalog entries have priority 0.8 and weekly cadence', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([{ id: 'QX' } as any]);
    const entries = await sitemap();
    const catalogEntry = entries.find((e) =>
      e.url === 'https://test.metro.example/catalog/QX',
    );
    expect(catalogEntry).toMatchObject({
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  it('lastModified is a Date', async () => {
    vi.mocked(getCatalogList).mockResolvedValue([]);
    const entries = await sitemap();
    expect(entries[0].lastModified).toBeInstanceOf(Date);
  });
});
```

- [ ] **Step 11.2: Run test.**

```bash
npm test -- src/app/sitemap.test.ts
```

Expected: PASS.

- [ ] **Step 11.3: Commit.**

```bash
git add src/app/sitemap.test.ts
git commit -m "test: cover sitemap generation for home + catalogs"
```

---

**Po Fazie P4:** `npm run build` + finalny `npm test` (powinno być >= 49 + 9 (Task 9) + ~12 (Task 10) + 4 (Task 11) = ~74 testy).

---

# FAZA P5 — Audyty (analiza, bez kodu)

## Task 12: Audyt `'use client'` w QX layoutach

**Goal:** Zinwentaryzować, które z 10 sekcji QX (`HeroQX`, `OverviewQX`, `MaterialsQX`, `FeaturesQX`, `GalleryQX`, `FinishesQX`, `GettingStartedQX`, `ProductCodesQX`, `DimensionsQX`, `PackshotsQX`) faktycznie potrzebuje `'use client'`, a które dałyby się przerobić na Server Component + cienki `<ClientMotionWrapper>`. **Output: raport `docs/superpowers/audits/2026-05-XX-use-client-qx.md` z rekomendacjami per-sekcja**, NIE zmiany w kodzie.

**Files:**
- Create: `docs/superpowers/audits/<YYYY-MM-DD>-use-client-qx.md`

**Why:** Raport sekcja 4.1. Każdy `'use client'` zwiększa hydratable JS. Refactor na Server Components może być znaczącym zyskiem TTI, ale wymaga case-by-case analizy (czy są hooki, event handlery, browser APIs).

- [ ] **Step 12.1: Inwentaryzacja powodów `'use client'`.** Dla każdej z 10 sekcji znajdź:
  - czy używa `useState`, `useEffect`, `useRef`, `useId`, `useMemo`, `useCallback`?
  - czy używa `framer-motion` (`motion.*`, `useInView`, `AnimatePresence`)?
  - czy ma event handlery (`onClick`, `onMouseEnter`, etc.)?
  - czy używa custom hooków (`useFocusTrap`, `useIsMobile`)?

```bash
for f in src/layouts/qx/*.tsx; do
  echo "=== $f ==="
  grep -E '"use client"|useState|useEffect|useRef|useInView|motion\.|onClick|onMouse|use[A-Z][a-zA-Z]*\(' "$f" | head -10
  echo
done
```

- [ ] **Step 12.2: Klasyfikacja per-sekcja.** Wypełnij tabelę w raporcie:

| Sekcja | `useState`? | `useEffect`? | framer-motion? | event handlers? | Custom hooks? | **Werdykt** |
|---|---|---|---|---|---|---|
| HeroQX | ? | ? | ? | ? | ? | ? |
| OverviewQX | ? | ? | ? | ? | ? | ? |
| ... | | | | | | |

Werdykt:
- **MUST CLIENT** — używa `useState` + interakcji (np. PackshotsQX z lightboxem).
- **SPLIT** — większość JSX statyczne, tylko fragment animowany — można rozdzielić.
- **CAN BE SERVER** — nie używa nic poza prostą `motion.*` na wrapperze, da się refactor na Server Component + ClientMotionWrapper.

- [ ] **Step 12.3: Write audit report.** Plik: `docs/superpowers/audits/<dziś>-use-client-qx.md`. Struktura:

```markdown
# Audyt `'use client'` w QX layoutach

**Data:** YYYY-MM-DD
**Autor:** [nazwa]
**Cel:** zidentyfikować, które sekcje QX dałyby się przerobić na Server Components + ClientMotionWrapper.

## Streszczenie

[1-2 zdania]

## Tabela klasyfikacji

| Sekcja | `useState` | `useEffect` | framer-motion | onClick/etc | Custom hooks | Werdykt |
|---|---|---|---|---|---|---|
| ... | | | | | | |

## Rekomendacje

### MUST CLIENT (bez zmian)

- ...

### SPLIT (Server + ClientMotionWrapper)

- ...

### CAN BE SERVER

- ...

## Szacowany impact

[KB JS hydratable do oszczędzenia, jeśli wszystkie SPLIT/CAN BE SERVER zostaną wdrożone.]

## Następne kroki

[Jeśli warto — utworzyć osobny plan implementacji refaktoru.]
```

- [ ] **Step 12.4: Commit.**

```bash
git add docs/superpowers/audits/
git commit -m "docs(audit): inventory 'use client' usage in QX layouts"
```

---

# Decyzje wymagające user input (NIE są taskami kodu)

## D1: vercel.json deployment gating

**Status:** [vercel.json](vercel.json) ma `git.deploymentEnabled: { stage_2: true }` — auto-deploy włączony **tylko** dla brancha `stage_2`.

**Pytania do użytkownika:**
1. Czy `main` ma być produkcyjnym auto-deploymentem? Jeśli tak — dodać `"main": true`.
2. Czy `stage_2` ma być przejściowy (cleanup) czy stały preview?
3. Czy któreś inne branche (np. `dev`, `staging`) mają być deployowane?

**Po decyzji** — jednoliniowy edit `vercel.json` + commit.

---

# Self-review

| Wymóg z raportu | Pokryty taskiem |
|---|---|
| Sekcja 4.7 PackshotsQX z-modal | Task 1 |
| Sekcja 4.6 decoding=async | Task 2 |
| Sekcja 3.3 next.config.ts (optimizePackageImports + removeConsole) | Task 3 |
| Sekcja 3.4 eslint.config.mjs (no-console) | Task 4 |
| Sekcja 1.2 Type2/Type3 unification | Task 5 |
| Sekcja 4.3 ColorChip next/image (LOW) | Task 6 |
| Sekcja 4.2 image-pipeline scripts dedup | Task 7 |
| Sekcja 4.4 Lato weights audit | Task 8 |
| Sekcja 5.2 testy middleware | Task 9 |
| Sekcja 5.2 testy oauth-discovery | Task 10 |
| Sekcja 5.2 testy sitemap | Task 11 |
| Sekcja 4.1 audyt 'use client' | Task 12 |
| Sekcja 3.1 vercel.json gating | D1 (decyzja) |
| Sekcja 4.5 tailwind cssColor() helper | **NIEPOKRYTY** — bardzo niski priorytet, kosmetyka |
| Sekcja 2.3 react/react-dom pinning | **NIEPOKRYTY** — tylko obserwacja |
| Sekcja 2.3 engines.npm | **NIEPOKRYTY** — tylko obserwacja |

---

**Konkluzja:** plan pokrywa wszystkie konkretne rekomendacje sekcji 1–5 raportu (oprócz dwóch obserwacji w 2.3 i 4.5, które nie są działaniami a uwagami). Faza P1 (Tasks 1–4) to ~35 min czystej pracy z zerowym ryzykiem. Faza P2 wymaga decyzji o ColorChip (Task 6 może być pominięty). Faza P3 (Task 7) to medium-risk refaktor skryptów — wymaga smoke-testu. Fazy P4–P5 nie zmieniają zachowania, tylko dodają testy/raport.
