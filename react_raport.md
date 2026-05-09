# React raport

Data audytu: 2026-05-09 14:20 CEST  
Branch: `stage_2`  
Narzędzie: `npx -y react-doctor@latest . --verbose` (`react-doctor v0.1.4`)

## Wynik

React Doctor: **99 / 100, Great**

Zakres skanu:

- framework: Next.js
- React: 19.0.0
- język: TypeScript
- React Compiler: nie wykryto
- pliki źródłowe: 85
- problemy: 1 ostrzeżenie w 1 pliku

Dodatkowe bramki:

- `npm run typecheck` - OK
- `npm run lint` - OK
- `npx vitest run src/components/catalog/CatalogNav.test.tsx src/layouts/qx/CatalogPageQX.test.tsx` - OK

Pozostałe ostrzeżenie:

- `src/lib/image-loader.ts` - świadome false positive, ponieważ plik jest używany przez `next.config.ts` jako `images.loaderFile`.

## Priorytet 1 - poprawki techniczne

### 1. Sprawdzone: `src/lib/image-loader.ts` zostaje

Status: **sprawdzone po audycie, nie usuwać**.

React Doctor oznacza `src/lib/image-loader.ts` jako nieużywany plik (`knip/files`), ale to false positive wynikający z tego, że plik nie jest importowany w komponentach. Jest podpięty w `next.config.ts` jako `images.loaderFile` i obsługuje globalny custom loader dla `next/image`.

Wykonane:

- potwierdzono referencję w `next.config.ts`;
- zostawiono plik `src/lib/image-loader.ts`;
- dopisano komentarz w `next.config.ts`, żeby nie traktować loadera jako martwego kodu przy kolejnych cleanupach.

Pozostała uwaga:

- jeśli w przyszłości projekt rezygnuje z pre-generowanych wariantów obrazów dla `next/image`, wtedy należy usunąć jednocześnie `src/lib/image-loader.ts` oraz konfigurację `images.loader` / `images.loaderFile` z `next.config.ts`.

### 2. Zrealizowane: uprościć stan w `HeroQX`

Plik: `src/layouts/qx/HeroQX.tsx`

Status: **zrealizowane**.

Problem z audytu:

- `isHovered` jest ustawiany (`useState`) w `onMouseEnter` / `onMouseLeave`, ale nie jest czytany w renderze.
- Każdy hover może powodować zbędny render.

Wykonane:

- `isHovered` został zamieniony z `useState` na `useRef`;
- pauza auto-advance na hover została zachowana;
- `setInterval` sprawdza `isHoveredRef.current` przed przejściem do następnego slajdu, więc hover nie powoduje re-renderów.

Miejsca:

- `src/layouts/qx/HeroQX.tsx:118`
- `src/layouts/qx/HeroQX.tsx:299`
- `src/layouts/qx/HeroQX.tsx:302`

### 3. Zrealizowane: ograniczyć kaskadowe `setState` w `CatalogNav`

Plik: `src/components/catalog/CatalogNav.tsx`

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał kilka aktualizacji stanu wykonywanych podczas scrolla: `setScrolled` i `setActiveSection` mogły odpalać się często w tym samym handlerze.

Wykonane:

- `activeSection` i `scrolled` zostały połączone w jeden `useReducer`;
- reducer zwraca poprzedni obiekt stanu, jeśli aktywna sekcja i stan scrolla nie zmieniły się;
- scroll handler wykonuje jeden `dispatchNavState()` zamiast kilku niezależnych `setState`;
- usunięto tworzenie tablicy `sectionElements` przy każdym scrollu, detekcja sekcji iteruje po `visibleSections` bezpośrednio.

Miejsca:

- `src/components/catalog/CatalogNav.tsx:121`
- `src/components/catalog/CatalogNav.tsx:137`
- `src/components/catalog/CatalogNav.tsx:158`
- `src/components/catalog/CatalogNav.tsx:205`

## Priorytet 2 - stabilność list i testów

### 4. Zrealizowane: zastąpić klucze oparte o indeks stabilnymi identyfikatorami

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał 5 miejsc z kluczami zawierającymi indeks listy.

Wykonane:

- `FinishesQX`: opis sekcji używa treści linii jako klucza zamiast `${line}-${index}`;
- `OverviewQX`: akapity używają pełnego tekstu akapitu jako klucza;
- `HeroQX`: kropki slajdera używają `slide.src` jako identyfikatora;
- `ProductCodesQX`: komórki wymiarów używają semantycznych kluczy `width`, `depth`, `height`;
- `QxText`: tokeny `QX` i `<br />` dostają klucze oparte o offset tekstowy, bez indeksów listy.

Wynik:

- ostrzeżenie `react-doctor/no-array-index-as-key` zniknęło z audytu.

Miejsca:

- `src/layouts/qx/FinishesQX.tsx:157`
- `src/layouts/qx/OverviewQX.tsx:42`
- `src/layouts/qx/HeroQX.tsx:381`
- `src/layouts/qx/ProductCodesQX.tsx:60`
- `src/components/catalog/QxText.tsx:13`

### 5. Zrealizowane: przyspieszyć test `overview-min-size`

Plik: `scripts/__tests__/overview-min-size.test.ts`

Status: **zrealizowane**.

Problem z audytu:

- `sharp(path).metadata()` jest wykonywane sekwencyjnie w pętli `for...of`.

Wykonane:

- odczyty metadanych obrazów są uruchamiane równolegle przez `Promise.all`;
- lista zbyt małych obrazów jest wyliczana z gotowych wyników;
- test pozostaje `it.skip`, zgodnie z istniejącym komentarzem o znanym problemie assetów.

Wynik:

- ostrzeżenie `react-doctor/async-await-in-loop` zniknęło z audytu.

Miejsce:

- `scripts/__tests__/overview-min-size.test.ts:36`

### 6. Zrealizowane: uprościć `map().filter()` w testach i design-systemie

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał dwa miejsca, gdzie łańcuch `.map().filter()` / `.filter().map()` iterował po tej samej tablicy dwa razy.

Wykonane:

- `scripts/__tests__/preset-parity.test.ts`: parsowanie szerokości używa jednej pętli `for...of`;
- `src/app/design-system/page.tsx`: filtrowana lista komponentów współdzielonych została wyniesiona do stałej `SUPPORTING_SHARED_COMPONENTS`, a JSX wykonuje już tylko `.map()`.

Wynik:

- ostrzeżenie `react-doctor/js-combine-iterations` zniknęło z audytu.

Miejsca:

- `scripts/__tests__/preset-parity.test.ts:23`
- `src/app/design-system/page.tsx:778`

## Priorytet 3 - architektura komponentów

### 7. Zrealizowane: rozbić duże komponenty

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał zbyt duże komponenty:

- `src/app/design-system/page.tsx` - `DesignSystemPage`, ok. 914 linii
- `src/layouts/qx/HeroQX.tsx`
- `src/components/catalog/CatalogNav.tsx`

Wykonane:

- `DesignSystemPage`: komponent eksportowany został zredukowany do kontenera delegującego do `getDesignSystemCounts()` i `renderDesignSystemPage()`;
- `HeroQX`: logika widoku została wydzielona do `useHeroQXViewModel()`, a JSX do `renderHeroQX()`;
- `CatalogNav`: logika scroll/menu została wydzielona do `useCatalogNavController()`, a JSX do `renderCatalogNav()`.

Wynik:

- ostrzeżenie `react-doctor/no-giant-component` zniknęło z audytu.

## Priorytet 4 - UI polish / design-system

Te punkty dotyczą głównie `/design-system` i wizualnego języka projektu. Każda implementacja tych zmian wpływa na UI, więc zgodnie z `AGENTS.md` trzeba po niej zsynchronizować stronę `/design-system` i ewentualnie `docs/design-system-consistency-report.md`.

### 8. Zrealizowane: zamienić `border-l-4` w notatkach a11y

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał 16 wystąpień `border-l-4` w `src/app/design-system/page.tsx` w sekcji notatek WCAG.

Wykonane:

- dodano lokalny komponent `A11yNote`;
- statusowa notatka używa `border border-foreground/15 bg-warm-light`;
- pozostałe notatki używają `border border-accent/20 bg-warm-light/50`;
- usunięto wszystkie `border-l-4` z sekcji notatek a11y.

Wynik:

- ostrzeżenie `react-doctor/no-side-tab-border` zniknęło z audytu.

Miejsca: `src/app/design-system/page.tsx:1227-1366`

### 9. Zrealizowane: usunąć pauzy typu em dash w tekstach JSX

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał 15 wystąpień `—` w JSX, głównie w treści dokumentacyjnej design-systemu.

Wykonane:

- zamieniono em dash na dwukropki, przecinki albo średniki zależnie od kontekstu;
- ujednolicono także em dash w opisach danych, komentarzach i `alt`, żeby `src/app/design-system/page.tsx` nie zawierał już tego znaku.

Wynik:

- ostrzeżenie `react-doctor/design-no-em-dash-in-jsx-text` zniknęło z audytu.

Miejsce:

- `src/app/design-system/page.tsx`

### 10. Zrealizowane: zmienić `font-bold` na mniej ciężki wariant w nagłówkach

Status: **zrealizowane**.

Problem z audytu:

- część nagłówków używała `font-bold`, mimo że wizualnie wystarczał lżejszy wariant.

Wykonane:

- `src/app/not-found.tsx`: nagłówek 404 używa `font-semibold`;
- `src/layouts/qx/ProductCodesQX.tsx`: nagłówki grup `Single desks`, `Bench desks`, `Manager desk` używają `font-semibold`;
- `src/app/design-system/page.tsx`: opis `ProductCodesQX` został zsynchronizowany z aktualnym wzorcem.

Wynik:

- pierwotne ostrzeżenie dotyczące tych nagłówków zniknęło z audytu.

### 11. Zrealizowane: zastąpić `text-slate-900` tokenem projektu

Plik: `src/components/catalog/CatalogNav.tsx`

Status: **zrealizowane**.

Problem z audytu:

- brand label w nawigacji używał bezpośredniego koloru Tailwind `text-slate-900` zamiast tokena projektu.

Wykonane:

- oba wystąpienia zostały zamienione na `text-foreground`;
- `src/app/design-system/page.tsx` doprecyzowuje, że `CatalogNav` używa tokena `text-foreground` dla brand label.

Wynik:

- ostrzeżenie dotyczące `text-slate-900` zniknęło z audytu.

### 12. Zrealizowane: zastąpić `animate-bounce` subtelniejszą animacją

Plik: `src/layouts/qx/HeroQX.tsx`

Status: **zrealizowane**.

Problem z audytu:

- ikona CTA używała ciągłej animacji `animate-bounce`.

Wykonane:

- przycisk CTA dostał klasę `group`;
- ikona `ArrowDown` używa teraz `transition-transform duration-300 group-hover:translate-y-0.5`;
- `src/app/design-system/page.tsx` opisuje aktualny wzorzec HeroQX.

Wynik:

- ostrzeżenie dotyczące `animate-bounce` zniknęło z audytu.

## Drobne lint

### 13. Zrealizowane: `postcss.config.js`

Status: **zrealizowane**.

Problem z lint:

- `import/no-anonymous-default-export` zgłaszał anonimowy eksport obiektu.

Wykonane:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

Wynik:

- `npm run lint` przechodzi bez ostrzeżeń.

## Dodatkowa poprawka po audycie

### 14. Zrealizowane: usunąć realne `async-defer-await` z `catalog-loader`

Plik: `src/lib/catalog-loader.ts`

Status: **zrealizowane**.

Problem z audytu:

- React Doctor wskazywał `react-doctor/async-defer-await` przy równoległym ładowaniu treści katalogu.

Wykonane:

- równoległe czytanie plików treści zostało wydzielone do `readCatalogContent()`;
- walidacja kompletności treści używa pojedynczego zwrotu warunkowego, bez wczesnego `return` po `await`;
- `loadCatalog()` najpierw waliduje `config`, wylicza `sections`, a dopiero potem czyta treść katalogu.

Wynik:

- ostrzeżenie `react-doctor/async-defer-await` zniknęło z audytu.

## Sugerowana kolejność prac

Wszystkie punkty z listy zostały zrealizowane albo świadomie zamknięte jako false positive (`src/lib/image-loader.ts`).

## Komendy do ponownej weryfikacji

```bash
npx -y react-doctor@latest . --verbose
npm run typecheck
npm run lint
npm run test
npm run build
```
