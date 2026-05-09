<claude-mem-context>
# Memory Context

# [__METRO_catalogs] recent context, 2026-05-09 11:08am GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (16,893t read) | 450,000t work | 96% savings

### May 8, 2026
S1362 Code review of working codebase (stage_2 branch) — check for improvements, dead code, optimizations — write conclusions in raport.md (May 8 at 11:17 PM)
S1363 Code review of stage_2 branch — check improvements, dead code, optimizations — write conclusions in raport.md; extended with detailed ColorChip performance analysis (May 8 at 11:49 PM)
S1364 Code review: find improvements, dead code, optimizations — write conclusions in raport.md (Polish: "kod działa prawidłowo, sprawdź co można poprawić, martwy kod, optymalizacje") (May 8 at 11:57 PM)
S1365 react-doctor audit of metro-catalogs project with results saved to react_raport.md (May 8 at 11:57 PM)
### May 9, 2026
S1366 Execute React audit fixes from react_raport.md — planning phase with scope clarification before implementation (May 9 at 10:18 AM)
S1367 Execute high-priority React audit fixes from react_raport.md on __METRO_catalogs project (branch stage_2) (May 9 at 10:19 AM)
2651 10:22a ✅ catalogs API memoization committed — commit 78ef8a4
2652 10:23a 🔵 src/app/page.tsx has no page-level metadata export — nextjs-missing-metadata audit finding
2653 " 🔵 layout.tsx already has full metadata — page.tsx fix needs page-specific override only
2654 " 🟣 Page-level metadata added to src/app/page.tsx — nextjs-missing-metadata audit fixed
2655 " 🟣 Home page metadata committed — commit abf7ce3 on stage_2
2656 10:24a 🔵 Production build succeeds — bundle sizes and remaining img warnings confirmed
2657 " 🟣 React audit session complete — 3 commits on stage_2, all tests green
S1368 react-doctor audit after recent fixes — score comparison and remaining issues analysis (May 9 at 10:24 AM)
2658 10:25a 🔵 metro-catalogs stage_2 branch recent commit history
2659 " 🔵 react-doctor audit: metro-catalogs scores 81/100 with 199 issues across 32 files
S1369 react-doctor audit of __METRO_catalogs project — create remediation plan and save to react_raport.md / plan_poprawek.md (May 9 at 10:26 AM)
2660 10:26a 🔵 CatalogNav.tsx inline render function patterns identified for refactor
2661 10:27a 🔵 renderQxText is a ReactNode utility function, not a component — root cause of no-render-in-render violations
2662 " 🔵 Inline render arrow functions confined to CatalogNav.tsx and FeaturesQX.tsx; all other violations are renderQxText() call sites
2663 " 🔵 FeaturesQX renderFeatureVideo is a ref-dependent inline render function; catalog components have test coverage via Vitest
2664 10:28a 🔵 loadCatalogMeta is exported but only used internally in catalog-loader.ts — safe to unexport
2665 " 🔵 renderQxText used in 15 source files — broad impact for QxText component conversion
2666 10:32a ✅ react-doctor audit plan created: plan_poprawek.md (stage_2)
S1370 Execute plan_poprawek.md — a multi-task cleanup and quality improvement plan for the metro-catalogs Next.js project on the stage_2 branch (May 9 at 10:33 AM)
2667 10:38a 🔵 METRO Catalogs project on stage_2 branch with recent perf optimizations
2668 " 🟣 QxText component test suite created
2669 " 🔵 TDD red phase confirmed: QxText component does not yet exist
2670 10:39a 🟣 QxText React component created as typed wrapper around renderQxText logic
2671 " 🔵 renderQxText used in 14 files across catalog and QX layouts — full migration scope identified
2672 " 🔄 SectionHeading.tsx migrated from renderQxText import to QxText component
2673 " 🔄 SectionHeading and MaterialsOptionGroup fully migrated from renderQxText to QxText component
2674 10:40a 🔄 CatalogNav.tsx fully migrated to QxText component across all 4 nav contexts
2675 " 🔄 DimensionsQX.tsx fully migrated to QxText component
2676 " 🔄 FeaturesQX.tsx fully migrated; HeroQX.tsx read for migration with 3 call sites identified
2677 " 🔄 HeroQX.tsx fully migrated; OverviewQX.tsx read with 2 call sites identified
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
2698 11:05a 🔵 react-doctor audit of metro-catalogs: score 89/100, 97 issues across 21 files
S1371 react-doctor code audit of metro-catalogs project (May 9 at 11:06 AM)
2699 11:06a 🔵 Knip dead-code investigation: CatalogMeta used internally but not imported externally; schema exports genuinely unused
2700 11:08a 🔵 Knip JSON reveals 19 unused types in catalog.ts and most flagged img tags are framer-motion m.img (not migratable)

Access 450k tokens of past work via get_observations([IDs]) or mem-search skill.
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
