# Asset Map

Use these folders and filenames when you add or replace assets:

## Brand
- `signature.png`
  - Square brand emblem used in the top navigation.
- `Black-logo.png`
  - Primary dark logo used in footers and loading state.
- `white-logo.png`
  - Light logo used on the home hero.

## Icons
- `assets/icons/whatsapp.svg`
- `assets/icons/email.svg`
- `assets/icons/instagram.svg`
- `assets/icons/youtube.svg`
- `assets/icons/behance.svg`
- `assets/icons/linkedin.svg`

Replace those files if you want different icon artwork, but keep the same names to avoid editing templates.

## Trusted By logos
- Current page markup uses:
  - `client1.png`
  - `client2.png`
  - `client3.png`
  - `client4.jpeg`
  - `client5.png`
  - `client6.png`
  - `client7.jpg`
  - `client8.png`

If you add more logos, place the new files in the project root for now and add new `<img>` tags in `about.html`.
The layout will automatically arrange them in repeating `4,3,4,3...` rows.

## Gallery / project content
- Category + project content lives in:
  - `assets/projects/<category>/<project>/cover.jpg`
  - `assets/projects/<category>/<project>/photos/01.jpg`
  - `assets/projects/<category>/<project>/photos/02.jpg`

Example:
- `assets/projects/commercial/saree-brand-campaign/cover.jpg`
- `assets/projects/commercial/saree-brand-campaign/photos/01.jpg`

After adding project folders, run:

```bash
./scripts/sync-projects.sh
```

That rebuilds `assets/projects/projects.json` for the gallery and category pages.
