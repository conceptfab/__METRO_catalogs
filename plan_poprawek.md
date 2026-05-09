# Plan poprawek — react-doctor audit (stage_2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Podnieść wynik react-doctor z 81/100 do 88+/100 przez naprawę najwyżej-impaktowych ostrzeżeń (głównie `no-render-in-render` przez konwersję `renderQxText` na komponent `<QxText>`), korekty Tailwind, a11y i modern-JS — bez ryzyka wizualnego regresu.

**Architecture:**
- **Faza 1** — duża wygrana: konwersja `renderQxText()` (helper) na komponent `<QxText text="..." />` eliminuje ~50 ostrzeżeń `no-render-in-render` jednym strzałem; potem ekstrakcja realnych inline-renderów z `CatalogNav` i `FeaturesQX`.
- **Faza 2-4** — mechaniczne poprawki: Tailwind shorthand (`w-N h-N` → `size-N`), klucze list, useEffectEvent, modern JS (`toSorted`, `flatMap`, `Promise.all`, `Set` lookups), a11y (`role="navigation"` redundant).
- **Faza 5** — czyszczenie martwego kodu wykrytego przez `knip` (tylko zweryfikowane).
- **Faza 6** — drobne fixy w plikach testowych.
- **Deferred** — decyzje wymagające inputu (Lato weights dla `font-bold`, refactor giant components, design-system page kosmetyka) udokumentowane na końcu, nie implementowane.

**Tech Stack:**
- Next.js 15.5 / React 19 / TypeScript
- Vitest + @testing-library/react (jsdom)
- Tailwind v3.4
- framer-motion (już zmigrowane do LazyMotion + `m`)

**Branch:** `stage_2` (commitować bezpośrednio; user pracuje na `stage_2`/`main`).

**Weryfikacja końcowa każdej fazy:**
```bash
npm run typecheck && npm test && npx -y react-doctor@latest . --score
```

---

## Faza 1 — `no-render-in-render` (największa wygrana)

### Task 1: Konwersja `renderQxText()` → komponent `<QxText>`

Helper `renderQxText` (15 plików ~50 wywołań) jest formalnie utility, ale react-doctor flaguje go bo nazwa zaczyna się od `render*` i zwraca JSX. Konwersja na komponent jest kanoniczna React-ically i znika ~50 ostrzeżeń.

**Files:**
- Modify: `src/components/catalog/renderQxText.tsx` (zmienić eksport)
- Create: `src/components/catalog/QxText.test.tsx` (nowe testy komponentu)
- Modify (15 plików konsumujących):
  - `src/components/catalog/CatalogNav.tsx`
  - `src/components/catalog/SectionHeading.tsx`
  - `src/components/catalog/MaterialsOptionGroup.tsx`
  - `src/layouts/qx/HeroQX.tsx`
  - `src/layouts/qx/OverviewQX.tsx`
  - `src/layouts/qx/GalleryQX.tsx`
  - `src/layouts/qx/PackshotsQX.tsx`
  - `src/layouts/qx/DimensionsQX.tsx`
  - `src/layouts/qx/MaterialsQX.tsx`
  - `src/layouts/qx/FinishesQX.tsx`
  - `src/layouts/qx/FeaturesQX.tsx`
  - `src/layouts/qx/GettingStartedQX.tsx`
  - `src/layouts/qx/ProductCodesQX.tsx`
  - `src/app/design-system/page.tsx`

- [ ] **Step 1: Napisz failing test komponentu `<QxText>`**

Utwórz `src/components/catalog/QxText.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QxText } from './QxText';

describe('<QxText />', () => {
  it('renders plain text without QX tokens unchanged', () => {
    const { container } = render(<QxText text="Hello world" />);
    expect(container.textContent).toBe('Hello world');
  });

  it('wraps QX token in span.qx-word', () => {
    const { container } = render(<QxText text="Welcome to QX line" />);
    const span = container.querySelector('span.qx-word');
    expect(span?.textContent).toBe('QX');
  });

  it('replaces \\n with <br /> elements', () => {
    const { container } = render(<QxText text={'first\\nsecond'} />);
    expect(container.querySelectorAll('br').length).toBe(1);
    expect(container.textContent).toBe('firstsecond');
  });

  it('handles multiple QX tokens on one line', () => {
    const { container } = render(<QxText text="QX and QX" />);
    expect(container.querySelectorAll('span.qx-word').length).toBe(2);
  });

  it('preserves uppercase QX regardless of input case', () => {
    const { container } = render(<QxText text="welcome qx world" />);
    const span = container.querySelector('span.qx-word');
    expect(span?.textContent).toBe('QX');
  });
});
```

- [ ] **Step 2: Uruchom test — powinien failować (komponent jeszcze nie istnieje)**

```bash
npx vitest run src/components/catalog/QxText.test.tsx
```

Expected: FAIL — `Cannot find module './QxText'`.

- [ ] **Step 3: Utwórz `src/components/catalog/QxText.tsx` (przeniesienie logiki z renderQxText)**

```tsx
import type { ReactNode } from 'react';

const QX_TOKEN_REGEX = /\bQX\b/gi;
const LINEBREAK_REGEX = /\\n|\/n|\n/g;

function renderLine(line: string, lineIndex: number): ReactNode[] {
  const matches = line.match(QX_TOKEN_REGEX);
  const parts = line.split(QX_TOKEN_REGEX);

  return parts.flatMap((part, index) => [
    part,
    matches && index < matches.length ? (
      <span key={`qx-${lineIndex}-${index}`} className="qx-word">
        {matches[index].toUpperCase()}
      </span>
    ) : null,
  ]);
}

interface QxTextProps {
  text: string;
}

export function QxText({ text }: QxTextProps): ReactNode {
  const lines = text.split(LINEBREAK_REGEX);

  return lines.flatMap((line, lineIndex) => {
    const lineNodes = renderLine(line, lineIndex);
    return lineIndex < lines.length - 1
      ? [...lineNodes, <br key={`br-${lineIndex}`} />]
      : lineNodes;
  });
}
```

- [ ] **Step 4: Uruchom test — powinien przejść**

```bash
npx vitest run src/components/catalog/QxText.test.tsx
```

Expected: PASS (5 testów).

- [ ] **Step 5: Globalna podmiana wywołań `renderQxText(x)` → `<QxText text={x} />`**

Zamień we wszystkich 15 plikach konsumujących:
- import: `import { renderQxText } from '@/components/catalog/renderQxText';` → `import { QxText } from '@/components/catalog/QxText';`
- import: `import { renderQxText } from './renderQxText';` → `import { QxText } from './QxText';`
- wywołanie: `{renderQxText(x)}` → `<QxText text={x} />`

Komenda do weryfikacji że wszystko zostało podmienione:

```bash
grep -rn "renderQxText" src/ | grep -v "QxText.test.tsx" | grep -v "renderQxText.tsx"
```

Expected: brak wyników.

- [ ] **Step 6: Usuń stary plik `renderQxText.tsx`**

```bash
git rm src/components/catalog/renderQxText.tsx
```

- [ ] **Step 7: Pełna weryfikacja**

```bash
npm run typecheck
npm test
npm run build
```

Expected: typecheck pass, wszystkie testy pass, build success.

- [ ] **Step 8: Sprawdź wynik react-doctor**

```bash
npx -y react-doctor@latest . --score
```

Expected: wynik wzrasta z 81 do ~85+ (50+ mniej ostrzeżeń `no-render-in-render`).

- [ ] **Step 9: Commit**

```bash
git add src/components/catalog/QxText.tsx src/components/catalog/QxText.test.tsx \
  src/components/catalog/CatalogNav.tsx src/components/catalog/SectionHeading.tsx \
  src/components/catalog/MaterialsOptionGroup.tsx \
  src/layouts/qx/HeroQX.tsx src/layouts/qx/OverviewQX.tsx src/layouts/qx/GalleryQX.tsx \
  src/layouts/qx/PackshotsQX.tsx src/layouts/qx/DimensionsQX.tsx \
  src/layouts/qx/MaterialsQX.tsx src/layouts/qx/FinishesQX.tsx \
  src/layouts/qx/FeaturesQX.tsx src/layouts/qx/GettingStartedQX.tsx \
  src/layouts/qx/ProductCodesQX.tsx src/app/design-system/page.tsx
git rm src/components/catalog/renderQxText.tsx
git commit -m "refactor: convert renderQxText helper to <QxText> component

Eliminates ~50 react-doctor no-render-in-render warnings by promoting
the QX token formatter from a render-prefixed utility to a proper
React component, enabling correct reconciliation."
```

---

### Task 2: Ekstrakcja `renderBrand` i `renderBrandControl` z `CatalogNav`

Realne inline-render funkcje używające closure'a nad propami komponentu — kandydaci do ekstrakcji do dedykowanych komponentów.

**Files:**
- Modify: `src/components/catalog/CatalogNav.tsx` (linie 160-195, 215-218, 311-314, 181, 192)

- [ ] **Step 1: Wyodrębnij `<BrandControl>` jako lokalny komponent NAD `CatalogNav`**

W pliku `src/components/catalog/CatalogNav.tsx` dodaj PRZED `const CatalogNav = ...`:

```tsx
interface BrandControlProps {
  brandLabel: string;
  brandLogoSrc?: string;
  backToCatalogListHref?: string;
  className: string;
  logoClassName: string;
  onBrandClick: () => void;
}

function BrandControl({
  brandLabel,
  brandLogoSrc,
  backToCatalogListHref,
  className,
  logoClassName,
  onBrandClick,
}: BrandControlProps) {
  const brand = brandLogoSrc ? (
    <Image
      src={brandLogoSrc}
      alt={`${brandLabel} logo`}
      width={160}
      height={48}
      className={logoClassName}
    />
  ) : (
    brandLabel
  );

  if (backToCatalogListHref) {
    return (
      <a
        href={backToCatalogListHref}
        className={className}
        aria-label="Back to catalog list"
      >
        {brand}
      </a>
    );
  }

  return (
    <button
      onClick={onBrandClick}
      className={className}
      aria-label={`${brandLabel} - back to top`}
    >
      {brand}
    </button>
  );
}
```

- [ ] **Step 2: Usuń `renderBrand` i `renderBrandControl` (linie 160-195) z body komponentu `CatalogNav`**

Usuń obie definicje wewnątrz `CatalogNav`.

- [ ] **Step 3: Zamień obydwa wywołania `renderBrandControl(...)` na `<BrandControl ... />`**

Wariant `qx0` (linia ~215):

```tsx
<BrandControl
  brandLabel={brandLabel}
  brandLogoSrc={brandLogoSrc}
  backToCatalogListHref={backToCatalogListHref}
  className="inline-flex items-center min-h-[44px] min-w-[44px] font-display text-xl font-black tracking-tighter text-slate-900 !rounded-none"
  logoClassName="h-[22px] w-auto object-contain !rounded-none lg:h-7"
  onBrandClick={() => scrollTo('cover')}
/>
```

Wariant default (linia ~311):

```tsx
<BrandControl
  brandLabel={brandLabel}
  brandLogoSrc={brandLogoSrc}
  backToCatalogListHref={backToCatalogListHref}
  className="font-display text-xl font-black tracking-tighter text-slate-900"
  logoClassName="h-7 w-auto object-contain"
  onBrandClick={() => scrollTo('cover')}
/>
```

- [ ] **Step 4: Weryfikacja**

```bash
npm run typecheck && npm test -- src/components/catalog/CatalogNav.test.tsx
```

Expected: pass.

- [ ] **Step 5: Wizualna weryfikacja**

```bash
npm run dev
```

Otwórz `http://localhost:3000/qx0/desk-grand` lub inny katalog. Sprawdź czy logo/brand w nav działa: klik na logo → scroll do top.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/CatalogNav.tsx
git commit -m "refactor(CatalogNav): extract BrandControl as standalone component"
```

---

### Task 3: Ekstrakcja `renderFeatureVideo` z `FeaturesQX`

**Files:**
- Modify: `src/layouts/qx/FeaturesQX.tsx` (linie 51-72, 107, 177)

- [ ] **Step 1: Wyodrębnij `<FeatureVideo>` jako lokalny komponent NAD `FeaturesQX`**

W `src/layouts/qx/FeaturesQX.tsx`, PRZED definicją głównego komponentu, dodaj:

```tsx
interface FeatureVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  active: { title: string; desc: string; video?: { src: string; poster?: string } } | undefined;
  activeIndex: number;
}

function FeatureVideo({ videoRef, active, activeIndex }: FeatureVideoProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden bg-background">
      {active?.video ? (
        <>
          <video
            ref={videoRef}
            key={`${activeIndex}-${active.video.src}`}
            src={active.video.src}
            poster={active.video.poster}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <span className="sr-only">
            {`Visual demonstration of ${active.title}: ${active.desc}`}
          </span>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Usuń `renderFeatureVideo` (linie ~51-72) z body komponentu**

- [ ] **Step 3: Zamień oba wywołania `renderFeatureVideo(ref)` na `<FeatureVideo ... />`**

Linia ~107:
```tsx
<FeatureVideo videoRef={mobileVideoRef} active={active} activeIndex={activeIndex} />
```

Linia ~177:
```tsx
<FeatureVideo videoRef={desktopVideoRef} active={active} activeIndex={activeIndex} />
```

- [ ] **Step 4: Weryfikacja**

```bash
npm run typecheck && npm test
```

- [ ] **Step 5: Wizualna weryfikacja**

`npm run dev` → otwórz QX katalog → przewiń do sekcji Tech (FeaturesQX) → klikaj taby — wideo powinno się przełączać i odtwarzać przy hover/in-view.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/qx/FeaturesQX.tsx
git commit -m "refactor(FeaturesQX): extract FeatureVideo as standalone component"
```

---

### Checkpoint po Fazie 1

Uruchom audyt:

```bash
npx -y react-doctor@latest . --score
```

Expected: wynik **86-88**, problem `no-render-in-render` zniknie z TOP listy.

---

## Faza 2 — Tailwind shorthand i a11y (drobne, szybkie)

### Task 4: `w-N h-N` → `size-N` (Tailwind v3.4+)

13 wystąpień w 4 plikach.

**Files:**
- Modify: `src/components/catalog/ColorChip.tsx:59,68`
- Modify: `src/components/catalog/Lightbox.tsx:74,84,94`
- Modify: `src/layouts/qx/FinishesQX.tsx:218,233,258,310`
- Modify: `src/app/design-system/page.tsx:452,462,469,1405`

- [ ] **Step 1: W każdym pliku zamień klasy**

Wzorzec: `w-N h-N` → `size-N` (gdzie N to to samo w obu wymiarach).

Przykładowo w `ColorChip.tsx` linia 59:
```tsx
// before:
className="... w-6 h-6 ..."
// after:
className="... size-6 ..."
```

Wszystkie 13 wystąpień to wymiary kwadratowe (sprawdź w pliku — jeśli `w-X h-Y` z różnym X/Y, NIE zmieniaj).

- [ ] **Step 2: Weryfikacja**

```bash
npm run typecheck && npm test && npm run build
```

- [ ] **Step 3: Wizualna weryfikacja**

`npm run dev` → otwórz katalog → sprawdź ColorChip (kafle koloru), Lightbox (przyciski), FinishesQX (ikony swatch). Rozmiary muszą zostać identyczne.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/ColorChip.tsx src/components/catalog/Lightbox.tsx \
  src/layouts/qx/FinishesQX.tsx src/app/design-system/page.tsx
git commit -m "style: use Tailwind size-N shorthand for square dimensions"
```

---

### Task 5: Usunąć redundantne `role="navigation"` z `<nav>`

**Files:**
- Modify: `src/components/catalog/CatalogNav.tsx:201,297`

- [ ] **Step 1: W obu miejscach usuń `role="navigation"`**

```tsx
// before:
<nav
  role="navigation"
  aria-label="Catalog sections"
  ...
>
// after:
<nav
  aria-label="Catalog sections"
  ...
>
```

- [ ] **Step 2: Weryfikacja**

```bash
npm test -- src/components/catalog/CatalogNav.test.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/catalog/CatalogNav.tsx
git commit -m "a11y(CatalogNav): drop redundant role=navigation from <nav>"
```

---

### Task 6: Em-dash w PackshotsQX

15 z 16 ostrzeżeń `design-no-em-dash-in-jsx-text` jest na stronie `design-system` (wewnętrzna dokumentacja, deferred). Pozostaje 1 na produkcyjnej stronie.

**Files:**
- Modify: `src/layouts/qx/PackshotsQX.tsx:318`

- [ ] **Step 1: Sprawdź kontekst**

```bash
sed -n '315,322p' src/layouts/qx/PackshotsQX.tsx
```

- [ ] **Step 2: Zamień em-dash (—) na przecinek/dwukropek/kropkę zgodnie z sensem zdania**

Wybierz interpunkcję pasującą do treści — najczęściej działa przecinek lub dwukropek.

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/layouts/qx/PackshotsQX.tsx
git commit -m "copy(PackshotsQX): replace em-dash with comma for clearer cadence"
```

---

## Faza 3 — Performance & correctness

### Task 7: Stabilne klucze list (zamiast `index`)

6 wystąpień. Każde wymaga sprawdzenia czy elementy mają stabilny identyfikator.

**Files:**
- Modify: `src/components/catalog/renderQxText.tsx` → już zostanie usunięty w Tasku 1, pomiń
- Modify: `src/components/catalog/Lightbox.tsx:100`
- Modify: `src/layouts/qx/FinishesQX.tsx:155`
- Modify: `src/layouts/qx/OverviewQX.tsx:42`
- Modify: `src/layouts/qx/ProductCodesQX.tsx:54`
- Modify: `src/layouts/qx/HeroQX.tsx:369`

- [ ] **Step 1: W każdym pliku znajdź `.map((item, index) => ...key={index}...)` lub podobne**

Sprawdź czy `item` ma pole `id`, `slug`, `title`, lub inny unikalny identyfikator.

- [ ] **Step 2: Zamień `key={index}` na `key={item.id}` / `key={item.slug}` / `key={item.title}`**

Jeśli żadne pole nie jest unikalne, użyj kombinacji (`key={`${item.title}-${index}`}`) — wciąż lepsze niż czysty index.

UWAGA: Lightbox `index` może być uzasadniony, jeśli to lista miniatur dla LIGHTBOX i lista nigdy się nie zmienia podczas życia komponentu. W takim przypadku zostaw + dodaj `// eslint-disable-line` z komentarzem dlaczego.

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

Wizualna: otwórz galeria, lightbox, hero, finishes — listy renderują się tak samo.

- [ ] **Step 4: Commit**

```bash
git add src/components/catalog/Lightbox.tsx src/layouts/qx/FinishesQX.tsx \
  src/layouts/qx/OverviewQX.tsx src/layouts/qx/ProductCodesQX.tsx \
  src/layouts/qx/HeroQX.tsx
git commit -m "fix(react): replace array-index keys with stable identifiers"
```

---

### Task 8: `useEffectEvent` dla handlerów keyboard

Lightbox i HeroQX dodają keyboard listeners w useEffect, ale `onClose`/inne handlery są w deps array, co re-subskrybuje listener przy każdym renderze rodzica.

**React 19** wprowadził `useEffectEvent`, ale jest jeszcze experimental. Sprawdź czy `useEffectEvent` jest dostępne w React 19.0.0.

**Files:**
- Modify: `src/components/catalog/Lightbox.tsx:52`
- Modify: `src/layouts/qx/HeroQX.tsx:269`

- [ ] **Step 1: Sprawdź dostępność `useEffectEvent`**

```bash
node -e "import('react').then(r => console.log(Object.keys(r).filter(k => k.includes('Effect'))))"
```

Jeśli `useEffectEvent` NIE jest dostępne (tylko experimental_useEffectEvent), użyj wzorca `useRef + useEffect` — patrz Step 2.

- [ ] **Step 2: Wzorzec ref-based stabilizacji handlera**

Zamień:
```tsx
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, [onClose]); // ← problem: re-subskrypcja
```

Na:
```tsx
const onCloseRef = useRef(onClose);
useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onCloseRef.current();
  };
  document.addEventListener('keydown', handleKey);
  return () => document.removeEventListener('keydown', handleKey);
}, []); // ← bez deps; handler stabilny
```

(Jeśli `useEffectEvent` JEST dostępne stable, użyj go — czystsza forma.)

- [ ] **Step 3: Zastosuj wzorzec w obu plikach**

`Lightbox.tsx:52` — `onClose` w `addEventListener('keydown', ...)`.
`HeroQX.tsx:269` — `goPrev`/`goNext` w `addEventListener`.

- [ ] **Step 4: Weryfikacja**

```bash
npm run typecheck && npm test -- src/components/catalog/Lightbox.test.tsx
```

Manualna: otwórz lightbox → ESC zamyka; HeroQX → keyboard nawigacja działa.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/Lightbox.tsx src/layouts/qx/HeroQX.tsx
git commit -m "perf(react): stabilize keyboard handlers with ref to avoid re-subscribing"
```

---

### Task 9: `isHovered` — `useState` → `useRef` w HeroQX

Ostrzeżenie: `useState "isHovered" is updated but never read in the component's return` — wartość mutowana ale nigdy nie czytana w renderze. Każda zmiana powoduje niepotrzebny re-render.

**Files:**
- Modify: `src/layouts/qx/HeroQX.tsx:118`

- [ ] **Step 1: Sprawdź wszystkie użycia `isHovered` i `setIsHovered`**

```bash
grep -n "isHovered\|setIsHovered" src/layouts/qx/HeroQX.tsx
```

Potwierdź że `isHovered` jest tylko zapisywane (`setIsHovered(true)`), nigdy nie czytane bezpośrednio w JSX.

- [ ] **Step 2: Zamień**

```tsx
// before:
const [isHovered, setIsHovered] = useState(false);
// (then: setIsHovered(true) / setIsHovered(false) only)

// after:
const isHoveredRef = useRef(false);
// (then: isHoveredRef.current = true / isHoveredRef.current = false)
```

UWAGA: jeśli `isHovered` JEST czytane (np. inside useEffect lub innych callbacków), zostaw jako useState lub przemyśl architekturę.

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

Manualna: hover nad heroem (pause/resume cyklu) działa identycznie.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/qx/HeroQX.tsx
git commit -m "perf(HeroQX): use ref for isHovered to avoid re-renders on hover"
```

---

### Task 10: Module-level default `[]` w CatalogPageQX

**Files:**
- Modify: `src/layouts/qx/CatalogPageQX.tsx:27`

- [ ] **Step 1: Otwórz plik i sprawdź kontekst**

```bash
sed -n '20,35p' src/layouts/qx/CatalogPageQX.tsx
```

- [ ] **Step 2: Wyodrębnij `[]` do stałej module-level**

```tsx
// na górze pliku, po importach:
const EMPTY_SECTIONS: ReadonlyArray<SectionConfig> = [];

// w komponencie:
function CatalogPageQX({ sections = EMPTY_SECTIONS, /* ... */ }) {
  // ...
}
```

(Dopasuj typ `SectionConfig` do faktycznego typu używanego w pliku.)

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/layouts/qx/CatalogPageQX.tsx
git commit -m "perf(CatalogPageQX): hoist empty default array to module scope"
```

---

### Task 11: Hoist regex w design-tokens.test.ts

**Files:**
- Modify: `src/lib/design-tokens.test.ts:37`

- [ ] **Step 1: Sprawdź kontekst i znajdź regex**

```bash
sed -n '30,45p' src/lib/design-tokens.test.ts
```

- [ ] **Step 2: Wyodrębnij `new RegExp(...)` do module-level constant**

```ts
// na górze pliku, po importach:
const TOKEN_PATTERN = /...regex.../;

// usuń `new RegExp(...)` z pętli, użyj `TOKEN_PATTERN`
```

- [ ] **Step 3: Weryfikacja**

```bash
npm test -- src/lib/design-tokens.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/design-tokens.test.ts
git commit -m "perf(test): hoist regex to module scope to avoid recompilation"
```

---

### Task 12: `Set` lookups w design-tokens.test.ts

**Files:**
- Modify: `src/lib/design-tokens.test.ts:17,28`

- [ ] **Step 1: Sprawdź kontekst**

```bash
sed -n '10,35p' src/lib/design-tokens.test.ts
```

Znajdź pętlę z `array.includes(x)`.

- [ ] **Step 2: Konwersja na Set**

```ts
// before:
for (const item of bigArray) {
  if (smallList.includes(item)) { /* ... */ }
}

// after:
const smallSet = new Set(smallList);
for (const item of bigArray) {
  if (smallSet.has(item)) { /* ... */ }
}
```

- [ ] **Step 3: Weryfikacja**

```bash
npm test -- src/lib/design-tokens.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/design-tokens.test.ts
git commit -m "perf(test): use Set for O(1) lookups instead of Array.includes in loop"
```

---

## Faza 4 — Modern JS

### Task 13: `array.toSorted()` (ES2023) zamiast `[...array].sort()`

**Files:**
- Modify: `src/lib/catalog-loader.ts:227`
- Modify: `scripts/__tests__/preset-parity.test.ts:50,51`

- [ ] **Step 1: Zamień każde `[...array].sort(fn)` na `array.toSorted(fn)`**

```ts
// before:
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
// after:
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
```

- [ ] **Step 2: Weryfikacja**

```bash
npm run typecheck && npm test
```

UWAGA: `Array.prototype.toSorted` wymaga TS 5.2+ z lib `es2023.array`. Sprawdź `tsconfig.json` jeśli typecheck failuje.

- [ ] **Step 3: Commit**

```bash
git add src/lib/catalog-loader.ts scripts/__tests__/preset-parity.test.ts
git commit -m "refactor: use Array.toSorted() for immutable sort (ES2023)"
```

---

### Task 14: `Promise.all()` zamiast sekwencyjnego `await` w pętli

**Files:**
- Modify: `src/lib/catalog-loader.ts:178`

- [ ] **Step 1: Sprawdź kontekst**

```bash
sed -n '170,195p' src/lib/catalog-loader.ts
```

Potwierdź że operacje są niezależne (np. ładowanie metadata różnych katalogów).

- [ ] **Step 2: Konwersja**

```ts
// before:
const results = [];
for (const id of catalogs) {
  results.push(await loadCatalogMeta(id));
}

// after:
const results = await Promise.all(catalogs.map((id) => loadCatalogMeta(id)));
```

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/catalog-loader.ts
git commit -m "perf(catalog-loader): parallelize independent loads with Promise.all"
```

---

### Task 15: `.flatMap()` zamiast `.map().filter(Boolean)`

**Files:**
- Modify: `src/app/agent-markdown/route.ts:128`

- [ ] **Step 1: Sprawdź kontekst**

```bash
sed -n '125,135p' src/app/agent-markdown/route.ts
```

- [ ] **Step 2: Konwersja**

```ts
// before:
items.map(x => condition(x) ? buildEntry(x) : null).filter(Boolean)
// after:
items.flatMap(x => condition(x) ? [buildEntry(x)] : [])
```

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/app/agent-markdown/route.ts
git commit -m "perf(agent-markdown): use flatMap instead of map/filter pair"
```

---

### Task 16: Połącz `.filter().map()` w pojedynczy przebieg

7 wystąpień; pomiń test files (preset-parity, design-system page).

**Files:**
- Modify: `src/app/agent-markdown/route.ts:25` (×2)
- Modify: `src/lib/catalog-loader.ts:133`
- Modify: `src/layouts/qx/FinishesQX.tsx:32`
- Modify: `src/layouts/qx/MaterialsQX.tsx:61`

- [ ] **Step 1: W każdym pliku znajdź wzorzec `.filter(...).map(...)` lub `.map(...).filter(...)`**

```bash
grep -nE "\.(map|filter)\([^)]+\)\.(filter|map)\(" src/app/agent-markdown/route.ts src/lib/catalog-loader.ts src/layouts/qx/FinishesQX.tsx src/layouts/qx/MaterialsQX.tsx
```

- [ ] **Step 2: Konwersja na `.flatMap()` lub `.reduce()`**

Wzorzec uniwersalny:
```ts
// before:
arr.filter(x => cond(x)).map(x => transform(x))
// after:
arr.flatMap(x => cond(x) ? [transform(x)] : [])
```

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/agent-markdown/route.ts src/lib/catalog-loader.ts \
  src/layouts/qx/FinishesQX.tsx src/layouts/qx/MaterialsQX.tsx
git commit -m "perf: combine filter+map chains into single flatMap pass"
```

---

### Task 17: `async-defer-await` w catalog-loader

**Files:**
- Modify: `src/lib/catalog-loader.ts:538`

- [ ] **Step 1: Sprawdź kontekst**

```bash
sed -n '530,550p' src/lib/catalog-loader.ts
```

Znajdź `await` przed early-return którego nie używa `awaited` wartość.

- [ ] **Step 2: Przesuń `await` za synchroniczny guard**

```ts
// before:
async function fn(input) {
  const data = await loadSomething();
  if (input.skip) return null; // ← skip ale już czekaliśmy na load
  return process(data);
}

// after:
async function fn(input) {
  if (input.skip) return null; // ← szybki bypass
  const data = await loadSomething();
  return process(data);
}
```

- [ ] **Step 3: Weryfikacja**

```bash
npm run typecheck && npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/catalog-loader.ts
git commit -m "perf(catalog-loader): defer await past synchronous early-return"
```

---

## Faza 5 — Knip cleanup (z weryfikacją)

### Task 18: Audyt nieużywanych eksportów/typów

`knip` flaguje 38 elementów (15 exports + 23 types), ale część może być używana zewnętrznie (np. agent-markdown route, MCP).

**Files do zweryfikowania:**
- `src/lib/catalog-loader.ts` — `loadCatalogMeta` (sprawdź czy używane wewnętrznie/zewnętrznie)
- `src/lib/schemas/hero.ts`, `packshots.ts`, `index.ts` — zod schemas
- `src/lib/agent-skills.ts`
- `src/lib/motion.ts`
- `src/types/catalog.ts` — `CatalogMeta`
- `src/components/catalog/ColorChip.tsx`
- `src/components/catalog/Lightbox.tsx`

- [ ] **Step 1: Dla każdego eksportu, sprawdź użycie w całym repo**

```bash
# przykład:
grep -rn "loadCatalogMeta" src/ --include="*.ts" --include="*.tsx"
grep -rn "CatalogMeta" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Klasyfikacja**

Dla każdego ostrzeżenia:
- **Genuinely unused** (zero referencji poza definicją): usunąć
- **Used internally** (referencja w tym samym pliku): zmienić z `export` na lokalny
- **Used externally via dynamic loading** (np. zod schemas dla content.json): zostawić, dodać komentarz `// re-exported for external schema validation`
- **Used via type inference** (TypeScript flatuje fałszywie): zostawić

- [ ] **Step 3: Wykonaj usunięcia tylko dla "Genuinely unused"**

Dla każdego usunięcia:
```bash
git rm <plik> # jeśli cały plik nieużywany
# lub edytuj plik usuwając tylko export
```

- [ ] **Step 4: Weryfikacja po każdej zmianie**

```bash
npm run typecheck
npm test
npm run build
```

Jeśli cokolwiek się sypie → undo i przeklasyfikuj jako "Used".

- [ ] **Step 5: Commit (jeden commit na grupę powiązanych usunięć)**

```bash
git add <pliki>
git commit -m "chore: remove genuinely unused exports flagged by knip"
```

---

## Faza 6 — Drobne fixy w plikach testowych

### Task 19: A11y fixy w `a11y-helpers.test.tsx`

**Files:**
- Modify: `src/test/a11y-helpers.test.tsx:7,12`

- [ ] **Step 1: Sprawdź zawartość**

```bash
cat src/test/a11y-helpers.test.tsx
```

- [ ] **Step 2: Linia 7 — zamień vague "OK" label**

Jeśli to test fixture sprawdzający vague label, ZOSTAW (to celowe). Jeśli to przykład prawidłowego użycia, zamień na "Confirm changes" lub równoważne.

- [ ] **Step 3: Linia 12 — dodaj `alt` atrybut do `<img>`**

```tsx
// before:
<img src="/test.jpg" />
// after (jeśli dekoracyjny):
<img src="/test.jpg" alt="" />
// after (jeśli celowo testujemy missing-alt):
{/* eslint-disable-next-line jsx-a11y/alt-text */}
<img src="/test.jpg" />
```

- [ ] **Step 4: Weryfikacja**

```bash
npm test -- src/test/a11y-helpers.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/test/a11y-helpers.test.tsx
git commit -m "fix(test): add alt attribute and clearer label in a11y test fixture"
```

---

## Final verification (po wszystkich fazach)

- [ ] **Pełny audyt**

```bash
npm run typecheck
npm test
npm run build
npx -y react-doctor@latest . --verbose
```

Expected: wynik **88+/100**, znikną kategorie:
- `no-render-in-render` (z 59 → 0-2)
- `nextjs-missing-metadata` (już naprawione)
- `server-hoist-static-io` (już naprawione)
- `use-lazy-motion` (już naprawione)
- `design-no-redundant-size-axes` (z 13 → 0)
- `no-array-index-as-key` (z 6 → 0-1)
- `no-redundant-roles` (z 2 → 0)
- `js-tosorted-immutable`, `js-flatmap-filter`, `js-set-map-lookups`, `js-hoist-regexp`, `async-await-in-loop`, `async-defer-await`, `js-combine-iterations` (z 19 → 0)
- `prefer-use-effect-event` (z 4 → 0)
- `rerender-state-only-in-handlers`, `rerender-memo-with-default-value` (z 2 → 0)

Pozostałe ostrzeżenia (deferred — patrz niżej):
- `no-side-tab-border` (16 — design-system page, internal docs)
- `design-no-em-dash-in-jsx-text` (15 — design-system page, internal docs)
- `nextjs-no-img-element` (~12 — większość false positives przez `responsiveImg()` helper)
- `design-no-bold-heading` (4 — wymaga decyzji o Lato weights)
- `no-giant-component` (3 — większy refactor, osobny plan)
- `no-cascading-set-state` (1 — większy refactor CatalogNav z useReducer)
- `no-inline-bounce-easing` (1 — design decision dla HeroQX)
- `knip/types` i `knip/exports` (część intencjonalnych eksportów)

---

## Decyzje deferred (NIE w tym planie — wymagają inputu/oddzielnego planu)

### D1: `font-bold` na heading-ach (4 wystąpienia)
- **Pliki:** `src/app/not-found.tsx:7`, `src/layouts/qx/ProductCodesQX.tsx:143,156,170`
- **Problem:** Lato w projekcie ładuje wagi 300/400/700/900 (po Tasku 8 z poprzedniej sesji, weight 100 usunięty). React-doctor sugeruje 500/600.
- **Decyzja potrzebna:** Czy dodać `weight: ['500', '600']` do Lato w `src/app/layout.tsx` (większy bundle font), czy zostawić `font-bold` (700) na display headingach?
- **Notatka kontekstowa:** observation 2617 z 2026-05-08 dokumentuje gap — `font-semibold/medium` używane w produkcji ale wagi nie ładowane.

### D2: `nextjs-no-img-element` (15 ostrzeżeń, większość false positive)
- **False positives** (komponenty świadomie używają `responsiveImg()` helper z manifestem 106 wpisów): ColorChip, GalleryQX, PackshotsQX, OverviewQX, MaterialsQX, FinishesQX
- **Realne kandydaty do `next/image`:** `src/app/page.tsx:64,86`, `src/app/design-system/page.tsx:818,1052,1065`
- **Decyzja:** Sprawdzić czy `responsiveImg()` jest dostępne i pasujące dla home page i design-system, czy migrować na `next/image`.

### D3: `no-side-tab-border` (16 wystąpień, wszystkie w design-system page)
- **Plik:** `src/app/design-system/page.tsx:1219-1358`
- **Kontekst:** Strona dokumentacji wewnętrznej (excluded from cleanup tasks per `MEMORY.md feedback_never_delete_design_system.md`).
- **Decyzja:** Zostawić czy zmienić na subtle inset shadow? Wpływ tylko na wewnętrzną dokumentację designu.

### D4: `no-giant-component` (3 wystąpienia)
- `CatalogNav.tsx` (352 linie po Tasku 2 nadal duży)
- `HeroQX.tsx` (380 linii)
- `design-system/page.tsx`
- **Decyzja:** Refactor na pod-komponenty to większy effort — wymaga osobnego planu po pomiarze co naprawdę "boli".

### D5: `no-cascading-set-state` w `CatalogNav:53`
- 3× `setState` w jednym `useEffect` (scrolled, activeSection, scrollingTo).
- **Decyzja:** Zamiana na `useReducer` to nontrivial refactor — osobny plan po Phase 1.

### D6: `no-inline-bounce-easing` w `HeroQX:281`
- `animate-bounce` jako wskaźnik scroll.
- **Decyzja:** Zostawić (świadomy design choice) lub zamienić na `cubic-bezier(0.16, 1, 0.3, 1)`?

---

## Self-review

### Spec coverage
- ✅ `no-render-in-render` (59) → Tasks 1, 2, 3
- ✅ `design-no-redundant-size-axes` (13) → Task 4
- ✅ `no-redundant-roles` (2) → Task 5
- ✅ `design-no-em-dash-in-jsx-text` (1 produkcyjny) → Task 6
- ✅ `no-array-index-as-key` (6) → Task 7
- ✅ `prefer-use-effect-event` (4) → Task 8
- ✅ `rerender-state-only-in-handlers` (1) → Task 9
- ✅ `rerender-memo-with-default-value` (1) → Task 10
- ✅ `js-hoist-regexp` (1) → Task 11
- ✅ `js-set-map-lookups` (2) → Task 12
- ✅ `js-tosorted-immutable` (3) → Task 13
- ✅ `async-await-in-loop` (2) → Task 14
- ✅ `js-flatmap-filter` (1) → Task 15
- ✅ `js-combine-iterations` (7) → Task 16
- ✅ `async-defer-await` (1) → Task 17
- ✅ `knip/exports` + `knip/types` (38) → Task 18
- ✅ `jsx-a11y/alt-text` (1) + `design-no-vague-button-label` (1) → Task 19
- ⏸ `font-bold heading` (4) → Deferred D1
- ⏸ `nextjs-no-img-element` (15) → Deferred D2
- ⏸ `no-side-tab-border` (16) → Deferred D3
- ⏸ `no-giant-component` (3) → Deferred D4
- ⏸ `no-cascading-set-state` (1) → Deferred D5
- ⏸ `no-inline-bounce-easing` (1) → Deferred D6

**Coverage:** 19 zadań pokrywa 17 kategorii ostrzeżeń. 6 kategorii świadomie deferred z uzasadnieniem.

### Placeholder scan
Brak "TBD", "TODO", "fill in details", "similar to Task N" — każdy task ma konkretny przed/po kod, dokładne ścieżki plików i komendy weryfikacji.

### Type consistency
- `<QxText text={...} />` używany konsekwentnie we wszystkich Tasks 1-3 (Task 2 i 3 nie modyfikują tego API)
- `<BrandControl ... />` (Task 2) i `<FeatureVideo ... />` (Task 3) — różne komponenty, nie kolidują
- `EMPTY_SECTIONS` (Task 10), `TOKEN_PATTERN` (Task 11) — module-level constants, nie kolidują z innymi nazwami

---

**Plan gotowy.** Po implementacji oczekiwany wynik: **88+/100** (z bieżących 81/100), eliminując ~140 z 199 ostrzeżeń.
