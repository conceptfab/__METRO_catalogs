Jak dodać kolejne katalogi
Dodaj ID do public/catalogs/index.json.
Skopiuj public/catalogs/QX/ jako <NEW_ID>/.
Edytuj <NEW_ID>/config.json: meta.layoutType na "qx", "type2" lub "type3".
Type 2/3 dziś pokażą placeholder — gdy będziesz miał wizję, projektujesz w src/layouts/type2/CatalogPageType2.tsx (i tworzysz dodatkowe komponenty sekcji w tym samym folderze). Reszta katalogów nie zostanie tknięta.
Zapisałem też feedback memory: następnym razem po twojej akceptacji designu od razu lecę z kodem — bez specu w docsach, bez review gate'ów.