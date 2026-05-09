# React Doctor — Raport audytu

**Projekt:** metro-catalogs
**Branch:** `stage_2`
**Data:** 2026-05-09
**Narzędzie:** `react-doctor v0.1.4`
**Polecenie:** `npx -y react-doctor@latest . --verbose`

## Podsumowanie

| Metryka | Wartość |
|---|---|
| **Wynik ogólny** | **78 / 100** (Great) |
| Błędy (errors) | 1 |
| Ostrzeżenia (warnings) | 213 |
| **Łącznie problemów** | **214** |
| Plików z problemami | 33 / 83 |
| Framework | Next.js |
| React | 19.0.0 |
| TypeScript | tak |
| React Compiler | nie wykryto |

---

## Błędy (priorytet: napraw najpierw)

### `jsx-a11y/alt-text` — 1 wystąpienie
Brak atrybutu `alt` na obrazie. Wymagany — albo z opisem, albo pusty (`alt=""`) dla obrazów dekoracyjnych.

- [src/test/a11y-helpers.test.tsx:12](src/test/a11y-helpers.test.tsx#L12) *(plik testowy — niski wpływ produkcyjny)*

---

## Ostrzeżenia wg ważności i częstotliwości

### 1. `react-doctor/no-render-in-render` — 59 wystąpień (TOP)
Inline render functions (np. `renderBrand()`) wewnątrz komponentów łamią rekoncyliację Reacta. Powinny być wydzielone do osobnych komponentów.

**Najbardziej dotknięte pliki:**
- [src/components/catalog/CatalogNav.tsx](src/components/catalog/CatalogNav.tsx) — 8 wystąpień (linie 181, 192, 215, 238, 282, 311, 331, 372)
- [src/app/design-system/page.tsx](src/app/design-system/page.tsx) — 4 wystąpienia (109, 151, 563, 1060)
- [src/layouts/qx/DimensionsQX.tsx](src/layouts/qx/DimensionsQX.tsx) — 8 wystąpień
- [src/layouts/qx/FinishesQX.tsx](src/layouts/qx/FinishesQX.tsx) — 4 wystąpienia
- [src/layouts/qx/MaterialsQX.tsx](src/layouts/qx/MaterialsQX.tsx) — 5 wystąpień
- [src/layouts/qx/FeaturesQX.tsx](src/layouts/qx/FeaturesQX.tsx) — 5 wystąpień
- [src/layouts/qx/HeroQX.tsx](src/layouts/qx/HeroQX.tsx) — 3 wystąpienia
- [src/layouts/qx/ProductCodesQX.tsx](src/layouts/qx/ProductCodesQX.tsx) — 5 wystąpień

**Rekomendacja:** Wydzielić jako nazwane komponenty: `const ListItem = ({ item }) => <div>{item.name}</div>`.

### 2. `knip/types` — 23 wystąpienia
Nieużywane typy (m.in. `CatalogMeta`).

**Pliki:**
- [src/types/catalog.ts](src/types/catalog.ts)
- [src/components/catalog/ColorChip.tsx](src/components/catalog/ColorChip.tsx)
- [src/components/catalog/Lightbox.tsx](src/components/catalog/Lightbox.tsx)
- [src/lib/schemas/index.ts](src/lib/schemas/index.ts)

### 3. `react-doctor/design-no-em-dash-in-jsx-text` — 16 wystąpień
Em-dash (—) w tekstach JSX brzmi jak output modelu LLM. Zamienić na przecinek, dwukropek, średnik lub nawiasy.

**Pliki:**
- [src/app/design-system/page.tsx](src/app/design-system/page.tsx) — 15 wystąpień
- [src/layouts/qx/PackshotsQX.tsx:318](src/layouts/qx/PackshotsQX.tsx#L318) — 1 wystąpienie

### 4. `react-doctor/no-side-tab-border` — 16 wystąpień
Gruby jednostronny border (`border-l-4`) — najbardziej rozpoznawalna cecha UI generowanego przez AI. Użyć subtelniejszego akcentu.

**Wszystkie w [src/app/design-system/page.tsx](src/app/design-system/page.tsx)** (linie 1219–1358) — strona dokumentacji designu, niski wpływ na produkcję.

### 5. `react-doctor/nextjs-no-img-element` — 15 wystąpień
Tagi `<img>` zamiast `next/image`. Strata: brak automatycznej optymalizacji WebP/AVIF, lazy loading, srcset.

**⚠️ Uwaga:** Większość obrazów w projekcie używa już `responsiveImg()` helpera z manifestem 106 wpisów (work z 2026-05-08). Te wystąpienia to:
- [src/app/page.tsx:49,71](src/app/page.tsx) — strona główna
- [src/components/catalog/ColorChip.tsx:61,77](src/components/catalog/ColorChip.tsx) — **już używa `responsiveImg()`** (świadoma decyzja, false positive)
- [src/layouts/qx/GalleryQX.tsx:84,107](src/layouts/qx/GalleryQX.tsx) — **już używa `responsiveImg()`**
- [src/layouts/qx/PackshotsQX.tsx:203,220](src/layouts/qx/PackshotsQX.tsx) — **już używa `responsiveImg()`**
- [src/layouts/qx/OverviewQX.tsx:57](src/layouts/qx/OverviewQX.tsx) — **już używa `responsiveImg()`**
- [src/layouts/qx/MaterialsQX.tsx:308](src/layouts/qx/MaterialsQX.tsx)
- [src/layouts/qx/FinishesQX.tsx:317](src/layouts/qx/FinishesQX.tsx)
- [src/app/design-system/page.tsx](src/app/design-system/page.tsx) — 3 wystąpienia (strona designu)

**Rekomendacja:** Zostawić `responsiveImg()` — celowo używamy własnego helpera dla pełnej kontroli nad srcSet. Sprawdzić tylko [src/app/page.tsx](src/app/page.tsx) i komponenty, które jeszcze nie korzystają z helpera.

### 6. `knip/exports` — 15 wystąpień
Nieużywane eksporty (np. `loadCatalogMeta`).

**Pliki:**
- [src/lib/catalog-loader.ts](src/lib/catalog-loader.ts)
- [src/lib/schemas/hero.ts](src/lib/schemas/hero.ts)
- [src/lib/schemas/packshots.ts](src/lib/schemas/packshots.ts)
- [src/lib/schemas/index.ts](src/lib/schemas/index.ts)
- [src/lib/agent-skills.ts](src/lib/agent-skills.ts)
- [src/lib/motion.ts](src/lib/motion.ts)

### 7. `react-doctor/design-no-redundant-size-axes` — 13 wystąpień
`w-N h-N` → użyć skrótu `size-N` (Tailwind v3.4+).

**Pliki:**
- [src/app/design-system/page.tsx](src/app/design-system/page.tsx) — 4
- [src/layouts/qx/FinishesQX.tsx](src/layouts/qx/FinishesQX.tsx) — 4
- [src/components/catalog/Lightbox.tsx](src/components/catalog/Lightbox.tsx) — 3
- [src/components/catalog/ColorChip.tsx](src/components/catalog/ColorChip.tsx) — 2

### 8. `react-doctor/use-lazy-motion` — 12 wystąpień
Importować `m` z `LazyMotion` zamiast `motion` — oszczędność ~30KB w bundlu.

**Pliki:** wszystkie pliki layoutu QX + CatalogNav + Lightbox.

```tsx
// Zamiast:
import { motion } from "framer-motion"
// Użyć:
import { LazyMotion, m, domAnimation } from "framer-motion"
```

### 9. `react-doctor/js-combine-iterations` — 7 wystąpień
`.filter().map()` iteruje tablicę dwukrotnie. Połączyć w jeden przebieg z `.reduce()` lub `for...of`.

- [src/app/agent-markdown/route.ts:25](src/app/agent-markdown/route.ts#L25)
- [src/lib/catalog-loader.ts:133](src/lib/catalog-loader.ts#L133)
- [src/layouts/qx/FinishesQX.tsx:32](src/layouts/qx/FinishesQX.tsx#L32)
- [src/layouts/qx/MaterialsQX.tsx:61](src/layouts/qx/MaterialsQX.tsx#L61)
- [src/app/design-system/page.tsx:777](src/app/design-system/page.tsx#L777)
- [scripts/__tests__/preset-parity.test.ts:23](scripts/__tests__/preset-parity.test.ts#L23)

### 10. `react-doctor/no-array-index-as-key` — 6 wystąpień
Używanie `index` z `.map()` jako `key` powoduje bugi przy reorderingu/filtrowaniu listy.

- [src/components/catalog/renderQxText.tsx:13](src/components/catalog/renderQxText.tsx#L13)
- [src/components/catalog/Lightbox.tsx:100](src/components/catalog/Lightbox.tsx#L100)
- [src/layouts/qx/FinishesQX.tsx:155](src/layouts/qx/FinishesQX.tsx#L155)
- [src/layouts/qx/OverviewQX.tsx:42](src/layouts/qx/OverviewQX.tsx#L42)
- [src/layouts/qx/ProductCodesQX.tsx:54](src/layouts/qx/ProductCodesQX.tsx#L54)
- [src/layouts/qx/HeroQX.tsx:369](src/layouts/qx/HeroQX.tsx#L369)

### 11. `react-doctor/design-no-bold-heading` — 4 wystąpienia
`font-bold` na `<h1>` zgniata kształty znaków przy display sizes. Użyć `font-semibold` (600) lub `font-medium` (500).

- [src/app/not-found.tsx:7](src/app/not-found.tsx#L7)
- [src/layouts/qx/ProductCodesQX.tsx:143,156,170](src/layouts/qx/ProductCodesQX.tsx)

**⚠️ Uwaga (kontekst z poprzedniej sesji):** Lato w projekcie ma wagi 300/400/700/900. Brak wagi 500/600. Aby naprawić, należy:
- Albo dodać wagi 500/600 do konfiguracji Lato w [src/app/layout.tsx](src/app/layout.tsx)
- Albo zostawić `font-bold` (700) na `<h1>` jako świadomą decyzję

### 12. `react-doctor/prefer-use-effect-event` — 4 wystąpienia
Funkcje (np. `onClose`) używane w `addEventListener` powinny być opakowane w `useEffectEvent` (React 19+), żeby effect nie re-synchronizował się przy każdym renderze rodzica.

- [src/components/catalog/Lightbox.tsx:52](src/components/catalog/Lightbox.tsx#L52) (×2)
- [src/layouts/qx/HeroQX.tsx:269](src/layouts/qx/HeroQX.tsx#L269) (×2)

### 13. `react-doctor/js-tosorted-immutable` — 3 wystąpienia
`[...array].sort()` → użyć `array.toSorted()` (ES2023, immutable bez spread).

- [src/lib/catalog-loader.ts:227](src/lib/catalog-loader.ts#L227)
- [scripts/__tests__/preset-parity.test.ts:50,51](scripts/__tests__/preset-parity.test.ts)

### 14. `react-doctor/no-giant-component` — 3 wystąpienia
Komponenty zbyt duże (rozważ rozbicie):

- [src/components/catalog/CatalogNav.tsx:31](src/components/catalog/CatalogNav.tsx#L31) — **352 linie**
- [src/app/design-system/page.tsx:536](src/app/design-system/page.tsx#L536)
- [src/layouts/qx/HeroQX.tsx:97](src/layouts/qx/HeroQX.tsx#L97)

### 15. `react-doctor/async-await-in-loop` — 2 wystąpienia
`await` w pętli `for…of` blokuje sekwencyjnie. Niezależne operacje → `Promise.all()`.

- [scripts/__tests__/overview-min-size.test.ts:36](scripts/__tests__/overview-min-size.test.ts#L36)
- [src/lib/catalog-loader.ts:178](src/lib/catalog-loader.ts#L178)

### 16. `jsx-a11y/no-redundant-roles` — 2 wystąpienia
Element `<nav>` ma już domyślną rolę `navigation`. Atrybut redundantny.

- [src/components/catalog/CatalogNav.tsx:201,297](src/components/catalog/CatalogNav.tsx)

### 17. `react-doctor/server-hoist-static-io` — 2 wystąpienia
`readdir()` w GET handler czyta te same pliki przy każdym requeście. Hoist do module scope.

- [src/app/api/catalogs/route.ts:18](src/app/api/catalogs/route.ts#L18) (×2)

### 18. `react-doctor/js-set-map-lookups` — 2 wystąpienia
`array.includes()` w pętli to O(n). Konwersja na `Set` daje O(1).

- [src/lib/design-tokens.test.ts:17,28](src/lib/design-tokens.test.ts)

### 19. Pojedyncze ostrzeżenia (1 wystąpienie każde)

| Reguła | Lokalizacja | Opis |
|---|---|---|
| `js-flatmap-filter` | [src/app/agent-markdown/route.ts:128](src/app/agent-markdown/route.ts#L128) | `.map().filter(Boolean)` → `.flatMap()` |
| `design-no-vague-button-label` | [src/test/a11y-helpers.test.tsx:7](src/test/a11y-helpers.test.tsx#L7) | Vague label "OK" (plik testowy) |
| `no-cascading-set-state` | [src/components/catalog/CatalogNav.tsx:53](src/components/catalog/CatalogNav.tsx#L53) | 3 setState w jednym useEffect → useReducer |
| `nextjs-missing-metadata` | [src/app/page.tsx:1](src/app/page.tsx#L1) | Brak `metadata`/`generateMetadata` (SEO) |
| `async-defer-await` | [src/lib/catalog-loader.ts:538](src/lib/catalog-loader.ts#L538) | `await` przed early-return |
| `js-hoist-regexp` | [src/lib/design-tokens.test.ts:37](src/lib/design-tokens.test.ts#L37) | `new RegExp()` w pętli |
| `rerender-state-only-in-handlers` | [src/layouts/qx/HeroQX.tsx:118](src/layouts/qx/HeroQX.tsx#L118) | `isHovered` jako `useState`, nie używany w renderze → `useRef` |
| `no-inline-bounce-easing` | [src/layouts/qx/HeroQX.tsx:281](src/layouts/qx/HeroQX.tsx#L281) | `animate-bounce` → ease-out cubic-bezier |
| `rerender-memo-with-default-value` | [src/layouts/qx/CatalogPageQX.tsx:27](src/layouts/qx/CatalogPageQX.tsx#L27) | Default `[]` → module-level constant |

---

## Plan naprawczy (priorytet wpływu)

### 🔥 Wysoki priorytet (szybkie wygrane, duży zysk)

1. **`use-lazy-motion`** (12 plików) — globalna zamiana `motion` → `m` z `LazyMotion`. Oszczędza ~30 KB w bundlu produkcyjnym. Jednorazowy refactor.
2. **`no-render-in-render`** (59 wystąpień) — wydzielenie inline funkcji renderujących do nazwanych komponentów. Naprawia rekoncyliację, eliminuje niepotrzebne re-renderingi.
3. **`server-hoist-static-io`** (2 wystąpienia) — hoist `readdir()` w [src/app/api/catalogs/route.ts:18](src/app/api/catalogs/route.ts#L18). Każdy GET czyta dysk od nowa.
4. **`nextjs-missing-metadata`** ([src/app/page.tsx](src/app/page.tsx)) — dodać `export const metadata` dla SEO strony głównej.

### 🟡 Średni priorytet (jakość, łatwo)

5. **`design-no-em-dash-in-jsx-text`** (16) — strona designu i [PackshotsQX.tsx:318](src/layouts/qx/PackshotsQX.tsx#L318). Zamiana em-dash → przecinek/dwukropek.
6. **`design-no-redundant-size-axes`** (13) — `w-N h-N` → `size-N`.
7. **`no-array-index-as-key`** (6) — sprawdzić każde wystąpienie i podstawić stabilny `id`/`slug`.
8. **`knip/exports` + `knip/types`** (38 łącznie) — usunięcie martwego kodu w `src/lib/`.
9. **`design-no-bold-heading`** (4) — wymaga decyzji: dodać waga 500/600 do Lato czy zostawić `font-bold` świadomie?
10. **`prefer-use-effect-event`** (4) — refactor handlerów `onClose`/keypress w Lightbox + HeroQX.

### 🟢 Niski priorytet (kosmetyka, mikro-optymalizacje)

11. **`js-tosorted-immutable`** (3) — `array.toSorted()` zamiast `[...array].sort()`.
12. **`js-combine-iterations`** (7) — łączenie `.filter().map()`.
13. **`async-await-in-loop`** (2) — `Promise.all()` w `catalog-loader.ts`.
14. **`no-side-tab-border`** (16) — wyłącznie strona [design-system](src/app/design-system/page.tsx). Decyzja stylistyczna; strona dokumentacji wewnętrzna.
15. **`nextjs-no-img-element`** (15) — większość to false positives (świadomy `responsiveImg()`). Sprawdzić tylko [src/app/page.tsx](src/app/page.tsx) i pozostałe non-helperowe.
16. **`no-giant-component`** (3) — refactor `CatalogNav.tsx` (352 linie) na mniejsze komponenty (np. `<NavBranches />`, `<NavLinks />`).
17. **`no-redundant-roles`** (2) — usunąć `role="navigation"` z `<nav>` w `CatalogNav.tsx`.
18. **`jsx-a11y/alt-text`** + **`design-no-vague-button-label`** ([src/test/a11y-helpers.test.tsx](src/test/a11y-helpers.test.tsx)) — naprawić w pliku testowym.

---

## Uwagi kontekstowe

- **`responsiveImg()` jako świadoma decyzja:** Większość ostrzeżeń `nextjs-no-img-element` w komponentach QX/Color/Gallery to false positives — używamy własnego helpera nad manifestem 106 wpisów. Audyt nie wykrywa tej abstrakcji.
- **Strona [design-system](src/app/design-system/page.tsx):** ~32 ostrzeżeń koncentruje się tutaj (em-dash, side-tab-border, w-N h-N). To wewnętrzna strona dokumentacji designu — nie produkcyjny content. Niski priorytet.
- **Plik testowy [a11y-helpers.test.tsx](src/test/a11y-helpers.test.tsx):** zawiera 1 błąd + 2 ostrzeżenia, ale to plik testowy z celowo "wadliwym" kodem (test fixtures). Niski wpływ.
- **Brak React Compiler:** Włączenie React Compiler wyeliminowałoby wiele problemów z re-renderingami automatycznie. Warto rozważyć w kolejnym sprincie.

## Wynik docelowy

Naprawa 🔥 wysokiego priorytetu (~67 wystąpień) plus zignorowanie false positives `responsiveImg()` powinno podnieść wynik z **78** do **85+**.

---

*Pełna diagnostyka zapisana lokalnie w `/var/folders/.../react-doctor-*.txt`*
*Wynik online: https://www.react.doctor/share?p=metro-catalogs&s=78&e=1&w=213&f=33*
