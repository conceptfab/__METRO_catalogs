tool-free assembly - out
add spawy
dodac inne animacje
dodac kolory do packshotów

## Responsive images — known issues (2026-05-06)

- [ ] Replace `public/catalogs/QX/overview/packshot.webp` (1000×1500) and `QS/overview/packshot.webp` with ≥1500px-wide assets (DPR=2 needs 1440px). After replacement: re-enable test in `scripts/__tests__/overview-min-size.test.ts` (`it.skip` → `it`) and run `npm run thumbnails:force` to regenerate variants. See [docs/responsive-images-audit-2026-05-06.md](docs/responsive-images-audit-2026-05-06.md) §3 "Overview".
