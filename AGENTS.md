<claude-mem-context>
# Memory Context

# [__METRO_catalogs] recent context, 2026-05-08 10:48am GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (15,805t read) | 450,729t work | 96% savings

### May 8, 2026
2317 9:59a 🟣 Added HeroTextStyle and HeroMobileContentLayout Interfaces to catalog.ts
2318 " 🔴 GalleryQX Mobile Layout Fixed — Vertical Stack Replaced with Horizontal Scroll Carousel
2319 " 🟣 HeroSlide and HeroSlideDefinition Extended with Mobile and Text Style Override Fields
2325 " 🔴 GalleryQX Mobile Carousel Refined — Natural Image Aspect Ratio on Mobile
2320 10:00a 🟣 normalizeHeroSlides in catalog-loader.ts Wired to Pass textStyle, mobileTextStyle, mobileContentLayout
2321 " 🟣 HeroQX.tsx Renders Per-Slide Text Style and Mobile Layout as CSS Custom Properties
2322 " 🟣 globals.css Hero Text Rules Updated to Consume Per-Slide CSS Custom Properties
2323 " 🔵 TypeScript Compilation Passes Clean After Per-Slide Hero Style Feature
2324 " 🔵 Full Test Suite Passes After Per-Slide Hero Style Feature
2326 10:01a ⚖️ User Preference: Mobile Gallery = Horizontal Swipe (scroll-snap-x), Never Vertical Stack
2327 " ⚖️ User Preference: No Cropping of Rectangular Gallery Images on Mobile
2328 10:02a ✅ QX Slide 0 slider.json Updated with mobileTextStyle for Visual Verification
2329 10:08a 🔵 Mobile hero image pan animations defined in globals.css
2330 10:10a 🟣 Added mobileImageOffsetX field to HeroSlide type for per-slide mobile image shifting
2331 " 🟣 mobileImageOffsetX added to both HeroSlide and HeroSlideDefinition interfaces
2332 " 🟣 catalog-loader.ts passes mobileImageOffsetX through slide normalization pipeline
2333 " 🔵 HeroQX.tsx renders hero image as motion.img with hero-mobile-pan CSS classes
2334 10:11a 🟣 HeroQX.tsx sets --hero-mobile-image-offset-x CSS custom property on hero image element
2335 " 🟣 globals.css consumes --hero-mobile-image-offset-x via calc() in object-position for QX and QS catalogs
2336 " 🟣 QS catalog slide 1 configured with mobileImageOffsetX: "100px" in slider.json
S1328 QS catalog mobile view: shift hero image 100px to the right — applied to both slides (May 8 at 10:11 AM)
2337 10:12a ✅ QS catalog slide 2 also set to mobileImageOffsetX: "100px"
S1329 QS catalog mobile hero image offset tuning — increased from 100px to 200px on both slides (May 8 at 10:12 AM)
2338 10:13a ✅ QS slider.json mobileImageOffsetX increased from 100px to 200px on both slides
S1330 QS catalog mobile hero image offset — final tuned values: slide 1 = 100px, slide 2 = 200px (May 8 at 10:13 AM)
2339 " ✅ QS slider.json slide 1 reverted to 100px, slide 2 remains at 200px
S1331 Sprawdzenie aktualności design systemu — audit page.tsx vs rzeczywisty stan kodu po zmianach z 8 maja 2026 (May 8 at 10:14 AM)
2340 10:17a 🔵 Design System Location in __METRO_catalogs
2341 10:18a 🔵 __METRO_catalogs Design System Structure
2342 " 🔵 METRO Design System — Dormant Token Audit (2026-05-06)
2343 " 🔵 QX Catalog Layout Architecture — 11 Sections with 3 Reveal Presets
2344 " 🔵 METRO Design System Planned Backlog — 10 Categories, ~50 Items
S1332 Design system audit — checking and updating design-system/page.tsx to reflect current QX component implementations (May 8 at 10:19 AM)
2345 10:23a ✅ Design system page updated with accurate QX layout descriptions
2346 " ✅ Design system tooling docs updated for responsive-image and catalog-loader
2347 " ✅ Design system page footer timestamp bumped to 2026-05-08; TypeScript clean
S1333 Increase mobile hero text font weight in METRO catalogs project (May 8 at 10:24 AM)
2348 10:37a 🔵 GalleryQX mobile view has unexpected image cropping
2349 " 🔵 GalleryQX mobile crop caused by overflow-hidden + items-center on flex scroll container
2350 " 🔵 GalleryQX mobile crop: object-cover is desktop-only, overflow-hidden is the culprit
2351 10:38a 🔵 __METRO_catalogs project structure: 3 layout types, gallery exclusive to QX
2352 " 🔴 GalleryQX main image mobile crop fixed: switched to height-driven layout
2353 " 🔵 Hero Text Mobile Font Weight Uses CSS Variable with Default 200
2354 10:39a 🔴 GalleryQX mobile crop fix completed: thumbnails updated, TypeScript clean
2355 " 🔵 Existing memory rule: mobile gallery images must never crop rectangular photos
2356 " 🔴 Mobile Hero Text Font Weight Increased from 200 to 500
2357 " ✅ Memory rule updated: mobile gallery must fit by HEIGHT, not width — h-full w-auto pattern
S1334 Fix GalleryQX mobile gallery image cropping — images must display without crop, fitted by height only (May 8 at 10:39 AM)
S1335 Increase mobile hero text font weight — changed default from 200 (extralight) to 500 (medium) (May 8 at 10:39 AM)
S1336 Mobile hero text font weight tuning — iterated from 200 → 500 → 300 (light), settled on 300 (May 8 at 10:39 AM)
2358 " ✅ Mobile Hero Text Font Weight Adjusted from 500 to 300
2359 10:41a 🔵 globals.css image rules: packshot aspect-ratio and hero object-position only — no gallery rules
2360 " 🔵 Thumbnail generation script imports SECTION_ASPECTS — may bake aspect ratios into generated images
2361 " 🔄 GalleryQX refactored: Lightbox and click-to-open removed, buttons replaced with divs
S1337 Fix GalleryQX mobile gallery crop + remove Lightbox and click-to-open interaction (May 8 at 10:42 AM)
2362 10:42a 🔵 generate-thumbnails.mjs crops gallery images at generation time if SECTION_ASPECTS.gallery is defined
2363 10:43a 🔵 Gallery thumbnails exist for both QX and QS catalogs with mixed width presets
2364 " 🔵 SECTION_ASPECTS.gallery_thumb = 1 — gallery thumbnails pre-cropped to square at generation time
2365 " 🔴 Removed gallery_thumb:1 from SECTION_ASPECTS — thumbnails will no longer be square-cropped at generation
2366 10:45a ✅ Thumbnail regeneration started with --force to rebuild gallery thumbs without square crop

Access 451k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

## Design System — obowiązkowe

Projekt posiada żywy design system pod `/design-system`:

- **Strona przeglądowa:** [src/app/design-system/page.tsx](src/app/design-system/page.tsx) — katalog tokenów (kolory, typografia, spacing), komponentów, wzorców sekcji katalogu QX
- **Tokeny CSS:** [src/app/globals.css](src/app/globals.css) — zmienne `--background`, `--foreground`, `--surface-elevated`, `--warm-light`, `--accent`, klasy `.section_ID`, `.section_Title`, `.sec_main_text`, `.qx-word`, oraz overrides motywu `.catalog-qx0`
- **Tailwind config:** [tailwind.config.ts](tailwind.config.ts) — semantyczne aliasy (`bg-surface-elevated`, `text-on-dark`, `text-foreground`, itd.)
- **Raport spójności:** [docs/design-system-consistency-report.md](docs/design-system-consistency-report.md)

### Zasada: każda zmiana UI kończy się aktualizacją design-systemu

Po każdej zmianie wpływającej na UI (nowy komponent, nowy wzorzec sekcji, nowy token kolorystyczny/typograficzny, nowa klasa utility, nowy preset obrazów, zmiana wymiarów/spacingu, nowa interakcja) **musisz**:

1. Zaktualizować [src/app/design-system/page.tsx](src/app/design-system/page.tsx) — dodać/zaktualizować wpis (token, komponent, wzorzec) tak, żeby strona pokazywała stan faktyczny
2. Jeśli wprowadzasz nowy token — dodać go w [src/app/globals.css](src/app/globals.css) i (jeśli trzeba) w [tailwind.config.ts](tailwind.config.ts), zamiast hardcodować wartości w komponencie
3. Używać istniejących tokenów/klas zamiast magicznych wartości (`bg-warm-light` zamiast `bg-[#f4efe6]`, `section_Title` zamiast custom font-size)
4. Sprawdzić [docs/design-system-consistency-report.md](docs/design-system-consistency-report.md) i odnotować nową decyzję, jeśli jest istotna systemowo

**Nie wolno:** dodawać arbitralnych wartości (`text-[19px]`, `#a3a3a3`, `mt-[37px]`) tam, gdzie istnieje token. Jeśli token nie istnieje, najpierw go zdefiniuj, potem użyj.
