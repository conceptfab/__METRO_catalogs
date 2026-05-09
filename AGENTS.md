<claude-mem-context>
# Memory Context

# [__METRO_catalogs] recent context, 2026-05-09 2:15pm GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (15,798t read) | 556,812t work | 97% savings

### May 8, 2026
S1363 Code review of stage_2 branch — check improvements, dead code, optimizations — write conclusions in raport.md; extended with detailed ColorChip performance analysis (May 8 at 11:49 PM)
S1364 Code review: find improvements, dead code, optimizations — write conclusions in raport.md (Polish: "kod działa prawidłowo, sprawdź co można poprawić, martwy kod, optymalizacje") (May 8 at 11:57 PM)
S1365 react-doctor audit of metro-catalogs project with results saved to react_raport.md (May 8 at 11:57 PM)
### May 9, 2026
S1366 Execute React audit fixes from react_raport.md — planning phase with scope clarification before implementation (May 9 at 10:18 AM)
S1367 Execute high-priority React audit fixes from react_raport.md on __METRO_catalogs project (branch stage_2) (May 9 at 10:19 AM)
S1368 react-doctor audit after recent fixes — score comparison and remaining issues analysis (May 9 at 10:24 AM)
S1369 react-doctor audit of __METRO_catalogs project — create remediation plan and save to react_raport.md / plan_poprawek.md (May 9 at 10:26 AM)
S1370 Execute plan_poprawek.md — a multi-task cleanup and quality improvement plan for the metro-catalogs Next.js project on the stage_2 branch (May 9 at 10:33 AM)
2677 10:40a 🔄 HeroQX.tsx fully migrated; OverviewQX.tsx read with 2 call sites identified
2678 " 🔄 OverviewQX and GalleryQX fully migrated to QxText component
2679 10:44a 🔄 FeaturesQX: Extracted FeatureVideo render function into standalone component
2680 10:45a 🔄 FeaturesQX FeatureVideo extraction committed to stage_2 branch
2681 " 🔄 ColorChip: Tailwind h-11 w-11 consolidated to size-11 shorthand
2682 " 🔄 Tailwind size-* shorthand applied across ColorChip, Lightbox, and FinishesQX
2683 " 🔄 Tailwind size-* shorthand cleanup extended to FinishesQX zoom icon and design-system page indicators
2684 11:00a 🔵 Knip audit revealed 40+ unused exports, types, and devDependencies
2685 " 🔵 Knip false positives identified for several "unused" exports
2686 11:01a 🔵 schemas/index.ts barrel file is entirely unused — no imports reference it
2687 " 🔵 loadCatalogMeta is a lightweight catalog list-view loader with no external consumers
2688 11:02a 🔄 loadCatalogMeta de-exported — made internal helper to getCatalogList
2689 " 🔵 agent-skills.ts internal exports are building blocks for public route functions
2690 " 🔄 Removed unnecessary export keywords from ColorChip, motion, and agent-skills modules
2691 " 🔄 sha256Digest also de-exported from agent-skills.ts — fully private module
2692 " ✅ TypeCheck, tests, and build all pass after knip de-export cleanup
2693 " ✅ Committed knip de-export cleanup to stage_2 branch
2694 " 🔴 a11y-helpers test fixed to use createElement for intentional missing-alt test case
2695 11:03a ✅ Committed a11y-helpers test fix to stage_2 branch
2696 " ✅ react-doctor score is 89/100 after stage_2 cleanup work
2697 11:04a ✅ stage_2 branch: 16 commits completing plan_poprawek.md cleanup tasks
S1371 react-doctor code audit of metro-catalogs project (May 9 at 11:04 AM)
2698 11:05a 🔵 react-doctor audit of metro-catalogs: score 89/100, 97 issues across 21 files
2699 11:06a 🔵 Knip dead-code investigation: CatalogMeta used internally but not imported externally; schema exports genuinely unused
2700 11:08a 🔵 Knip JSON reveals 19 unused types in catalog.ts and most flagged img tags are framer-motion m.img (not migratable)
2701 " 🔵 metro-catalogs uses a custom responsive image pipeline via responsiveImg() that replaces next/image functionality
2702 " 🔵 parseHeroContent and parsePackshotsContent ARE consumed by catalog-loader.ts; only the raw schema exports are truly dead
2703 11:09a 🔴 Deleted dead schemas barrel file src/lib/schemas/index.ts
2704 11:10a 🔵 Deleting schemas/index.ts breaks catalog-loader.ts import — import path './schemas' now has no index to resolve
2705 11:11a 🔴 Fixed catalog-loader.ts import after schemas barrel deletion — now imports directly from individual schema files
2706 11:13a 🔄 Made heroContentSchema module-private in schemas/hero.ts; removed unused export
2707 " 🔄 All Zod schema objects and derived types made module-private in hero.ts and packshots.ts
2708 " 🔄 Started removing unused export keywords from catalog.ts types — CatalogMeta made module-private
2709 " 🔄 Mass de-export of unused types in catalog.ts — 19 types made module-private
2710 11:17a 🔄 PackshotsQX migrated from native img to Next.js Image component
2711 11:18a 🔵 responsiveImg helper still used in FinishesQX and MaterialsQX after PackshotsQX migration
2712 " 🔵 design-system page uses raw img tags and lacks next/image import
2713 " 🔄 design-system page fully migrated to next/image with explicit aspect ratios
S1372 react-doctor audit (`/react-doctor zrob audyt kodu`) — full code quality remediation of metro-catalogs Next.js app (May 9 at 11:19 AM)
2714 11:25a 🔵 Lightbox broken on packshot images
2715 " 🔵 Responsive image manifest structure for catalog images
2716 11:26a 🔵 PackshotsQX lightbox only wired on desktop, not mobile
2717 " 🔵 Lightbox render condition explicitly excludes mobile in PackshotsQX
2718 11:27a 🔵 QX packshot files confirmed present with responsive variants
2719 11:28a 🔵 QX and QS packshots confirmed present in responsive-image-manifest.json
2720 " 🔵 QX catalog SSR HTML contains no packshot image URLs in JSON data
2721 " 🔵 QX packshot images correctly SSR-rendered with full responsive srcsets
2722 " 🔵 All QX packshot static files served correctly via dev server HTTP 200
2723 11:29a 🔵 PackshotsQX.tsx has no uncommitted changes — bug exists in committed code
2724 11:30a 🔵 Most recent PackshotsQX.tsx commit introduced image-loader utility refactor
2725 " 🔵 Commit 5f74d97 modified Lightbox.tsx, PackshotsQX.tsx, and packshots schema — prime regression candidate
2726 " 🔵 Custom image-loader breaks SVG images — missing width implementation causes Next.js warnings

Access 557k tokens of past work via get_observations([IDs]) or mem-search skill.
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
