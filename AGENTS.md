<claude-mem-context>
# Memory Context

# [__METRO_catalogs] recent context, 2026-05-08 10:51pm GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (17,683t read) | 280,094t work | 94% savings

### May 8, 2026
S1348 User asked whether image optimization and thumbnail generation will happen automatically, since they plan to frequently add and change graphics — context: reviewing plan_implementacji.md for METRO Catalogs project (May 8 at 6:00 PM)
S1349 User asked whether image optimization and thumbnail generation will be automatic on Vercel (deploy pipeline), since they plan to frequently add and change graphics (May 8 at 6:12 PM)
S1350 User asked about automatic image optimization on Vercel — session evolved into actually updating package.json to add recompress:gallery to prebuild for hands-off automation (May 8 at 6:13 PM)
S1351 User asked about automatic image optimization — session evolved into updating package.json prebuild pipeline and clarifying cross-platform tooling preferences (May 8 at 6:17 PM)
S1352 User asked about automatic image optimization — session delivered a complete image pipeline overhaul with a new orchestrator script and verified it working (May 8 at 6:18 PM)
S1353 User asked whether image optimization/thumbnails are automatic — session completed a full image pipeline overhaul with new orchestrator, verified working, and finalized package.json scripts (May 8 at 6:23 PM)
S1354 User asked how to run the image pipeline — answered with the single command and force variant (May 8 at 6:24 PM)
S1355 Recovery from session data loss + npm install failure — restore image pipeline (process-images.mjs + package.json + node_modules) (May 8 at 6:24 PM)
S1357 Tasks 1–3 complete on stage_2: gallery recompression, thumbnail cleanup, shadcn/ui pruning — design-system page accidentally deleted and user scripts accidentally reverted, then both fixed (May 8 at 6:29 PM)
2503 10:38p 🔵 Comprehensive Dead Code Audit Completed by Subagent
2504 " 🔵 Middleware Implements Content-Negotiated Markdown Serving for AI Agents
2507 10:39p 🔵 Comprehensive Optimization Audit Completed — 14 Findings Across All Code Areas
2508 " 🔵 Pre-Existing 1310-Line Implementation Plan Found in plan_implementacji.md
2506 " 🔵 TIOCSTI definitively blocked on macOS for both O_WRONLY and O_RDWR tty access
2509 " 🔵 Dead shadcn/ui Components Already Removed — Only 2 of Expected 43 Remain
2510 " 🔵 TooltipProvider Wraps Entire App But No Tooltip Components Are Actually Used
2511 " 🔵 Catalog Page is a Clean Async Server Component with Parallel Data Loading
2512 " ✅ Pi-hole config script copied to macOS clipboard via pbcopy for manual paste
2513 " 🔵 SSH to Pi-hole succeeded interactively — user micz authenticated with password, Pi is Debian bookworm aarch64
2531 10:40p 🔵 Dead UI Component Chain: tooltip → utils → cn()
2532 " 🔵 Dual Font Token System Aliases to Single Font (Lato)
2533 " 🔵 __METRO_catalogs Project: Agent/Machine-Readable API Infrastructure
2514 " 🔵 Third SSH session to Pi appeared on ttys011 — also Codex-spawned; Claude Code process has no controlling tty
2515 " 🟣 AppleScript automation used to paste Pi-hole script into Codex app and press Enter
2516 10:41p 🔵 osascript keystroke injection blocked — Accessibility permission not granted (error 1002)
2517 10:42p 🟣 osascript keystroke injection succeeded — Pi-hole script pasted and executed in Codex SSH window
2518 " 🔵 osascript paste delivered wrong clipboard content — "micz@pi:~$" pasted instead of Pi-hole script
2519 " 🔵 Clipboard race condition persists — second pbcopy+osascript attempt again pasted wrong content
2520 " 🔵 Codex app has single window named "Codex" — paste target confirmed
2521 " 🔵 Codex window geometry mapped; cliclick not available for mouse automation
2522 10:43p ✅ Clipboard race fix attempted: printf+pbcopy separated from osascript; mouse click at (420, 1240) before paste
2523 " 🔵 osascript with mouse click at coordinates hung indefinitely — killed after 15s with pkill
2524 " ✅ Clipboard verified correct ("echo CODEX_FOCUS_TEST") then paste sent as separate osascript call
2525 " 🔵 Click at (420, 1240) hits Codex "Ustawienia" settings button — wrong target for terminal paste
2526 10:44p 🔵 Screen coordinate (900, 300) hits Claude Code Electron window, not Codex — windows overlap
2527 " 🔵 Full screen coordinate map: Claude Code Electron dominates center; Codex terminal not reachable by coordinate click
2528 10:45p ✅ Pivoted to Antigravity (VS Code) integrated terminal — used View→Terminal menu to focus then paste
2529 " 🔵 lsof confirms: Codex owns both ttys009 and ttys011 — app terminal snapshot is from ttys011 (Codex SSH session)
2530 10:46p 🔵 Codex confirmed frontmost app; window object not text-coercible — Cmd+V pastes to wrong Codex panel
2534 " 🔵 Codex accessibility tree is opaque — one nested unnamed group, terminal panel not addressable via AppleScript
2536 " ✅ Code Audit Report Written to raport.md
2535 " 🔵 AppleScript "my" function calls broken in Polish-locale macOS; Codex window intermittently loses index 1 accessibility
2537 10:47p 🔵 "first window" works for Codex but "window 1" index fails inside recursive handlers — AppleScript indexing quirk
2538 " 🔵 Codex window count dropped to 0 — window no longer accessible via System Events
2539 " 🔵 Coordinate scan at x=300 hangs osascript repeatedly; Pi-hole config confirmed still unmodified
2540 10:48p ✅ Pi-hole script re-copied to clipboard and Cmd+V+Return sent to Codex — another delivery attempt
2541 " 🔵 PackshotsQX Inline Lightbox z-index Bug: z-[60] Below z-modal=80
2542 " ✅ raport.md Refined: Sprint C/D Split, New Sections 4.6 and 4.7 Added
2543 " 🔵 Combined pbcopy+osascript paste still delivers wrong clipboard content — same "micz@pi:~$" error in terminal
2544 10:49p 🔵 click at {330, 1180} hangs osascript — bottom-left Codex area consistently blocks System Events clicks
2545 " 🔵 macOS Keychain has no saved password for 192.168.1.2 — sshpass automation not possible without password retrieval
S1358 Code review audit of METRO Catalogs project (branch stage_2) — identify dead code, optimization opportunities, and write findings to raport.md (May 8 at 10:49 PM)
2546 " 🔵 No SSH keypair and no Keychain password for Pi-hole — SSH key setup is the only remaining automated access path
2547 " 🔵 Codex has a focused text field accessible via AXFocusedUIElement — direct keyboard input target identified
2548 10:50p 🔵 Codex menu bar revealed: View→"Toggle Terminal" available; AXFocusedUIElement is stable text field
2549 " 🟣 BREAKTHROUGH: "echo CODEX_FOCUS_OK" reached Pi-hole SSH terminal via View→Toggle Terminal + Cmd+V
2550 " 🔵 After Toggle Terminal, AXFocusedUIElement shifts to "text area" — confirmed SSH terminal input is now focused
2551 " 🔵 Swift with CoreGraphics available — CGEvent keyboard injection possible as fallback
2552 10:51p 🔵 Swift CGEvent click at (330, 1180) focuses "group" not terminal; bare Cmd+V without Toggle Terminal misses SSH panel
2553 " ✅ Ctrl+C sent to Codex SSH terminal to clear stuck "echo CODEX_FOCUS_OK" state

Access 280k tokens of past work via get_observations([IDs]) or mem-search skill.
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
