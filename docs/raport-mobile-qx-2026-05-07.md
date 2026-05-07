# Raport mobile QX i QS

Data: 2026-05-07
Zakres: wyłącznie widoki mobilne stron `/catalog/QX` i `/catalog/QS`
Testowane głównie: viewport 390 x 844; pomocniczo węższe i szersze warianty mobilne.

## Najważniejsze wnioski

### 1. Typografia sekcji jest za duża dla mobile

Tokeny QX ustawiają nagłówki sekcji na `46px` i `50px` line-height. Na telefonie większość nagłówków zajmuje 2-3 linie i dominuje pierwszy ekran sekcji.

Zalecenie: dodać mobile tokeny dla QX, np. `34-38px` z ciaśniejszym line-height, a `46px` zostawić od `sm` lub `md`.

### 2. Hero wymaga osobnego układu mobilnego

Na mobile obraz hero ma dużo pustej przestrzeni u góry, kluczowy produkt ucieka w prawo, a długi tekst hero wypełnia dużą część ekranu.

Zalecenie: ustawić mobile-specific `object-position` lub osobny wariant obrazu oraz skrócić albo inaczej złamać tekst hero.

### 3. Sekcja modeli jest zdecydowanie za długa

Przy szerokości około 390px sekcja `packshots` ma około `6763px` wysokości. Sama ta sekcja zajmuje bardzo duży fragment scrolla.

Zalecenie: na mobile rozważyć karuzelę modeli, kompaktowe karty 2-kolumnowe, grupowanie/accordion albo wzorzec `featured + pokaż wszystkie`.

### 4. Packshoty mogą powodować layout shift

Obrazy packshotów są renderowane jako `h-auto w-full` i `loading="lazy"` bez stałego kontenera lub jawnego `aspect-ratio`. W testach kotwice potrafiły początkowo lądować w złym miejscu, dopóki media się nie ułożyły.

Zalecenie: zarezerwować proporcje kontenerów lub użyć wymiarów/aspect-ratio dla packshotów.

### 5. Konfiguratory materiałów są poprawne dotykowo, ale ciężkie w scrollu

Kafelki materiałów mają około `7.25rem x 9.75rem`, przez co na telefonie układają się głównie w 2 kolumnach. Sekcje `finishes` i `materials` mają ponad 2200px wysokości każda.

Zalecenie: przygotować wariant mobile, np. poziomy scroll swatchy, mniejsze kafelki 3-kolumnowe albo przełącznik `swatch / preview`.

### 6. Rytm między sekcjami jest zbyt przypadkowy

Główne odstępy między sekcjami na mobile to tylko `mt-2`. W praktyce separację robi zawartość sekcji, więc przejścia są miejscami mało czytelne.

Zalecenie: dodać mobile spacing token dla katalogu, np. większy top padding sekcji i kontrolowany odstęp końcowy zamiast polegać na treści.

### 7. Logo w nawigacji ma za mały target dotykowy

Brand button wizualnie opiera się na logo o wysokości około `22px`. Sam target powinien mieć co najmniej `44px` wysokości.

Zalecenie: zostawić logo małe wizualnie, ale nadać przyciskowi `min-h-[44px] min-w-[44px]`.

### 8. Sekcja Dimensions nie wykorzystuje mobile dobrze

Długi opis spycha rysunek techniczny nisko, a obraz ma negatywny margines. W efekcie mobile widok jest mniej informacyjny niż powinien.

Zalecenie: skrócić opis, pokazać 2-3 kluczowe specyfikacje nad rysunkiem, a dopiero niżej pełną tabelę.

### 9. Product codes są czytelne, ale długie

Tabele mieszczą się na mobile, ale pełna lista wymaga długiego przewijania.

Zalecenie: dodać mobilne accordiony lub tabs dla `Single desks`, `Bench desks`, `Manager desk`, żeby użytkownik nie musiał przewijać całej listy naraz.

### 10. W aplikacji nadal są pliki PNG

W repo nadal występują pliki `.png`, obecnie przede wszystkim w `public/catalogs/QS/materials/`. To są m.in. warstwy konfiguratora materiałów i ich warianty responsive.

Zalecenie: wszystkie pliki PNG powinny zostać przekonwertowane do WebP. Przy tej migracji krytyczne jest zachowanie przezroczystości, czyli kanału alpha. Po poprawnej konwersji pliki PNG powinny zostać usunięte z repo, a odwołania w danych, manifestach i loaderze powinny wskazywać wyłącznie na `.webp`.

Docelowa zasada: w aplikacji mają prawo być tylko pliki `.webp` dla obrazów rastrowych katalogów. Nie zostawiamy równoległych plików `.png` po konwersji.

## Priorytet prac

P1:
- mobile typografia QX/QS
- hero crop/text, z osobnym wariantem dla QS
- packshots layout i CLS, szczególnie QX

P2:
- kompaktowy konfigurator materiałów
- większy target logo
- lepszy rytm sekcji
- migracja PNG do WebP z zachowaniem przezroczystości

P3:
- mobile UX dla Dimensions
- mobile UX dla Product Codes

## Weryfikacja QS

QS w większości wymaga tych samych zmian co QX. Potwierdzenie z kodu:

- `public/catalogs/QS/config.json` ma `layoutType: "qx"` i `theme: "qx0"`
- routing ładuje ten sam `CatalogPageQX` dla layoutu `qx`
- design system opisuje, że QS dziedziczy layouty QX 1:1

Oznacza to, że większość problemów mobile wynika ze wspólnych komponentów i tokenów, a nie z pojedynczego katalogu.

### Metryki QS

Viewport: 390 x 844

- cała strona: około `18490px` wysokości
- `finishes`: około `2303px`
- `packshots`: około `3507px`
- `dimensions`: około `1286px`
- `materials`: około `2222px`
- `features`: około `1094px`
- `getting-started`: około `2372px`
- `codes`: około `2125px`
- packshoty: 9 elementów
- przyciski materiałów/wykończeń: 30 elementów

Dla porównania QX ma 18 packshotów, a sekcja `packshots` ma około `6763px`, więc problem długości modeli jest w QX dużo mocniejszy.

### Co jest identyczne lub prawie identyczne

Typografia sekcji:
QS używa tych samych tokenów QX, więc nagłówki na mobile również mają około `46px` i `50px` line-height. Zalecenie obniżenia skali typograficznej powinno objąć oba katalogi.

Konfiguratory materiałów:
QS używa tego samego `MaterialsOptionGroup`, z tymi samymi dużymi kafelkami i układem 2-kolumnowym na mobile. Zalecenie kompaktowego wariantu mobile dotyczy obu katalogów.

Rytm sekcji:
QS używa tego samego `CatalogPageQX` i odstępu `mt-2` między sekcjami na mobile. Zalecenie mobile spacing token dotyczy obu katalogów.

Nawigacja:
QS używa tego samego `CatalogNav`, więc target dotykowy logo również wymaga poprawy. Dodatkowo render pokazuje, że etykieta dostępności logo pozostaje `METRO QX - back to top`, mimo że użytkownik jest na QS. To jest osobny błąd treści dostępności do poprawienia przy okazji prac nad nav.

Dimensions:
QS ma ten sam wzorzec sekcji i podobny długi opis. Zalecenie skrócenia opisu i lepszego ułożenia specyfikacji nad rysunkiem dotyczy obu katalogów.

Product Codes:
QS ma 8 tabel i 32 wiersze, czyli prawie tyle co QX. Zalecenie accordion/tabs dla mobile dotyczy obu katalogów.

Assety PNG:
QS nadal zawiera PNG w `public/catalogs/QS/materials/`, w tym pliki `metro RAL ...`, `metro U...` i `metro W...` oraz ich warianty `-400w`, `-800w`, `-1200w`, `-1600w`. Ponieważ są to warstwy konfiguratora, konwersja musi zachować przezroczystość. Po migracji PNG powinny zostać usunięte, a aplikacja powinna odwoływać się tylko do WebP.

### Co wymaga innego potraktowania w QS

Hero:
QS ma już osobny override mobile `.catalog-id-qs .hero-content-wrapper`, który kotwiczy tekst u góry. Nie należy kopiować poprawki hero 1:1 z QX. QS wymaga osobnego ustawienia kadrowania, pozycji tekstu i ewentualnie krótszego mobile copy.

Packshots:
QS ma 9 packshotów, QX ma 18. Ten sam wzorzec nadal jest zbyt długi i podatny na layout shift, ale priorytet dla QS jest niższy. Dla QS wystarczy prawdopodobnie kompaktowa siatka lub lżejsze grupowanie, podczas gdy QX bardziej potrzebuje karuzeli, accordionu lub wzorca `featured + pokaż wszystkie`.

### Decyzja

QS powinien wejść do tego samego pakietu poprawek mobile co QX, ale:

- poprawki typografii, spacingu, konfiguratorów, nav, Dimensions i Product Codes powinny być wspólne dla `catalog-qx0`
- hero powinno mieć wariant katalogowy: QX i QS osobno
- packshots powinny mieć wspólny wzorzec mobile, ale QX jest wyższym priorytetem ze względu na dwukrotnie większą liczbę elementów
- migracja assetów powinna doprowadzić do stanu, w którym katalogi nie zawierają PNG; WebP musi zachować alpha tam, gdzie PNG był przezroczystą warstwą konfiguratora

## Dodatkowa przestrzeń do optymalizacji

Poniższe punkty wykraczają poza sam układ mobilny, ale mają bezpośredni wpływ na szybkość, wagę strony i płynność na telefonach.

### 1. Zmniejszenie JS przez odchudzenie sekcji client-side

Wiele sekcji QX/QS działa jako `use client`, mimo że część z nich jest prawie statyczna. Warto zostawić client-side tylko tam, gdzie jest realna interakcja: hero slider, configurator, lightbox/tabs. Statyczne sekcje można rozważyć jako server components albo mniejsze komponenty z wyspami interakcji.

Potencjalny efekt: mniejszy bundle, krótsza hydracja i płynniejsze wejście na stronie mobilnej.

### 2. Optymalizacja video w Features

Animacja w `FeaturesQX` jest już lepiej ustawiona na mobile, ale same pliki video nadal mogą być ciężkie.

Zalecenia:

- przygotować osobne, mniejsze warianty video dla mobile
- rozważyć `preload="metadata"` na mobile zamiast pełnego `preload="auto"`
- uruchamiać odtwarzanie dopiero, gdy sekcja jest widoczna
- rozważyć krótsze loop-y zoptymalizowane do WebM/MP4 według realnej wagi i kompatybilności

### 3. Packshoty: progressive display

QX ma 18 modeli, więc nawet po usunięciu lightboxa na mobile strona nadal renderuje długą listę obrazów. Największy zysk UX i performance może dać ograniczenie początkowo renderowanej listy.

Opcje:

- pierwsze kilka modeli + `show more`
- accordion po typie modelu
- karuzela/horizontal scroll na mobile
- wzorzec `featured + pokaż wszystkie`

### 4. `content-visibility` dla ciężkich sekcji

Warto przetestować `content-visibility: auto` dla sekcji daleko poniżej folda, np. `packshots`, `materials`, `codes`. Trzeba to zrobić ostrożnie, z kontrolą kotwic i scroll-margin, bo katalog intensywnie korzysta z nawigacji po sekcjach.

Potencjalny efekt: niższy koszt początkowego renderowania długiej strony.

### 5. Font loading

Font jest ładowany przez `@import` z Google Fonts w CSS. Lepszym kierunkiem jest `next/font` albo lokalny font.

Potencjalny efekt:

- mniej blokowania renderu
- stabilniejsze metryki tekstu
- mniejsze ryzyko layout shift
- lepsza kontrola nad preloadem

### 6. Image pipeline jako reguła CI

Po migracji PNG do WebP warto dodać test lub skrypt, który failuje build, jeśli w `public/catalogs` pojawi się `.png`, `.jpg` lub `.jpeg`.

Cel: utrzymać zasadę, że aplikacja używa tylko WebP dla obrazów rastrowych katalogów i nie dopuszcza regresji przy kolejnych podmianach assetów.

### 7. Zawężenie loadera i generatora miniaturek do WebP

Po pełnej migracji assetów warto usunąć fallbacki na PNG/JPG z pipeline'u:

- `catalog-loader` nadal dopuszcza `.png`, `.jpg`, `.jpeg`
- `generate-thumbnails` nadal obsługuje `.png`, `.jpg`, `.jpeg`

Docelowo kod powinien wymuszać WebP, zamiast wspierać stare formaty.

### 8. Mobile table UX

Product Codes mieszczą się technicznie, ale poznawczo są ciężkie. Accordiony lub tabs po grupach dadzą większy zysk niż dalsze ściskanie tabel.

### 9. A11y polish w nav

W QS wykryto etykietę dostępności `METRO QX - back to top`. Przy okazji prac nad mobile nav warto poprawić:

- brand label per katalog
- logo per katalog, jeśli katalog ma osobne logo
- minimalny target dotykowy 44px
- poprawny `aria-label` dla aktualnego katalogu

### Priorytet optymalizacji

Największy spodziewany zwrot:

1. image/video pipeline
2. redukcja client-side JS
3. progressive display dla packshotów
4. mobile typography/spacing

## Uwagi wdrożeniowe

Przy wdrożeniu zmian UI trzeba zaktualizować żywy design system zgodnie z `AGENTS.md`:

- `src/app/design-system/page.tsx`
- `src/app/globals.css`
- `tailwind.config.ts`, jeśli pojawią się nowe tokeny
- `docs/design-system-consistency-report.md`, jeśli decyzje będą systemowe
