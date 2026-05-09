# React raport

Data audytu: 2026-05-09 13:47 CEST  
Branch: `stage_2`  
Narzędzie: `npx -y react-doctor@latest . --verbose` (`react-doctor v0.1.4`)

## Wynik

React Doctor: **94 / 100, Great**

Zakres skanu:

- framework: Next.js
- React: 19.0.0
- język: TypeScript
- React Compiler: nie wykryto
- pliki źródłowe: 85
- problemy: 43 ostrzeżenia w 7 plikach

Dodatkowe bramki:

- `npm run typecheck` - OK
- `npm run lint` - OK z 1 ostrzeżeniem: `postcss.config.js:1` (`import/no-anonymous-default-export`)

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

### 7. Rozbić duże komponenty

React Doctor wskazuje:

- `src/app/design-system/page.tsx` - `DesignSystemPage`, ok. 914 linii
- `src/layouts/qx/HeroQX.tsx`
- `src/components/catalog/CatalogNav.tsx`

Rekomendacja:

- `DesignSystemPage`: wydzielić sekcje strony (`FoundationsSection`, `TypographySection`, `ComponentsSection`, `PatternsSection`, `A11ySection`) do lokalnych komponentów w tym samym pliku albo do katalogu `src/app/design-system/_components`.
- `HeroQX`: wydzielić `HeroCtaButton`, `HeroSliderControls`, `HeroSlideDots`.
- `CatalogNav`: wydzielić logikę scroll-spy do hooka, np. `useCatalogScrollSpy`, a rendering desktop/mobile do mniejszych komponentów.

To są poprawki utrzymaniowe, nie pilne błędy. Najlepiej robić je po zamknięciu tematów z Priorytetu 1.

## Priorytet 4 - UI polish / design-system

Te punkty dotyczą głównie `/design-system` i wizualnego języka projektu. Każda implementacja tych zmian wpływa na UI, więc zgodnie z `AGENTS.md` trzeba po niej zsynchronizować stronę `/design-system` i ewentualnie `docs/design-system-consistency-report.md`.

### 8. Zamienić `border-l-4` w notatkach a11y

React Doctor wskazuje 16 wystąpień `border-l-4` w `src/app/design-system/page.tsx` w sekcji notatek WCAG.

Rekomendacja:

- zastąpić gruby jednostronny border subtelniejszym wzorcem, np. `border border-foreground/10` + mały nagłówek statusu, albo `shadow-[inset_2px_0_0_var(--accent)]`;
- najlepiej stworzyć jeden komponent `A11yNote`, żeby usunąć powtarzanie klas.

Miejsca: `src/app/design-system/page.tsx:1227-1366`

### 9. Usunąć pauzy typu em dash w tekstach JSX

React Doctor wskazuje 15 wystąpień `—` w JSX. To głównie treść dokumentacyjna design-systemu.

Rekomendacja:

- zamienić na przecinki, dwukropki, średniki lub nawiasy;
- przy okazji ujednolicić styl opisów w `/design-system`.

Przykładowe miejsca:

- `src/app/design-system/page.tsx:129`
- `src/app/design-system/page.tsx:568`
- `src/app/design-system/page.tsx:733`
- `src/app/design-system/page.tsx:962`
- `src/app/design-system/page.tsx:986`
- `src/app/design-system/page.tsx:1009`
- `src/app/design-system/page.tsx:1235`
- `src/app/design-system/page.tsx:1394`

### 10. Zmienić `font-bold` na mniej ciężki wariant w nagłówkach

Miejsca:

- `src/app/not-found.tsx:7`
- `src/layouts/qx/ProductCodesQX.tsx:143`
- `src/layouts/qx/ProductCodesQX.tsx:156`
- `src/layouts/qx/ProductCodesQX.tsx:170`

Rekomendacja:

- dla nagłówków użyć `font-semibold` albo istniejącej klasy tokenowej (`qx-emphasis-title`, jeśli pasuje semantycznie i wizualnie);
- w `ProductCodesQX` sprawdzić spójność z dokumentacją tabel kodów w `/design-system`.

### 11. Zastąpić `text-slate-900` tokenem projektu

Plik: `src/components/catalog/CatalogNav.tsx`

Miejsca:

- `src/components/catalog/CatalogNav.tsx:233`
- `src/components/catalog/CatalogNav.tsx:332`

Rekomendacja:

- użyć `text-foreground`, `text-primary` albo innego istniejącego tokena Tailwind z `tailwind.config.ts`;
- nie wprowadzać nowej arbitralnej wartości, jeśli istniejący token wystarcza.

### 12. Zastąpić `animate-bounce` subtelniejszą animacją

Plik: `src/layouts/qx/HeroQX.tsx:288`

Rekomendacja:

- usunąć `animate-bounce` z ikony CTA albo zamienić na delikatną animację opartą o istniejące presety motion;
- jeśli powstanie nowy preset animacji, dopisać go do design-systemu.

## Drobne lint

### 13. `postcss.config.js`

ESLint zgłasza:

```text
postcss.config.js
  1:1  warning  Assign object to a variable before exporting as module default  import/no-anonymous-default-export
```

Rekomendacja:

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

## Sugerowana kolejność prac

1. Usunąć albo świadomie podpiąć `src/lib/image-loader.ts`.
2. Usunąć martwy hover state z `HeroQX`.
3. Dodać guardy przed zbędnymi `setState` w `CatalogNav`.
4. Naprawić stabilne klucze list w komponentach QX i `QxText`.
5. Poprawić testy (`Promise.all`, uproszczenie iteracji).
6. Zrobić UI polish w `/design-system`: `border-l-4`, em dash, `font-bold`, `text-slate-900`, `animate-bounce`.
7. Rozbić największe komponenty dopiero po zamknięciu powyższych punktów.

## Komendy do ponownej weryfikacji

```bash
npx -y react-doctor@latest . --verbose
npm run typecheck
npm run lint
npm run test
npm run build
```
