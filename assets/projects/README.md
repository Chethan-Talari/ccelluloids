# Project Folder Structure

Create folders inside `assets/projects` using this structure:

```text
assets/projects/
  commercial/
    saree-brand-campaign/
      cover.jpg
      meta.txt
      photos/
        01.jpg
        02.jpg
      videos/
        teaser.mp4
  product/
    aquapure-product-shoot/
      cover.jpg
      meta.txt
      photos/
  fashion/
    editorial-model-shoot/
      cover.jpg
      meta.txt
      photos/
  events/
    cultural-event-coverage/
      cover.jpg
      meta.txt
      photos/
  documentary/
    independent-documentary-project/
      cover.jpg
      meta.txt
      photos/
      videos/
  street/
    bangalore-streets-series/
      cover.jpg
      meta.txt
      photos/
```

## Rules

- Category folder names become gallery categories.
- Project folder names become project titles automatically.
- `cover.jpg` is used for the category card and the project card.
- Put all stills inside `photos/` or `Photos/`.
- Put all motion clips inside `videos/`.
- Keep file names ordered like `01.jpg`, `02.jpg`, `03.jpg`.

## Optional `meta.txt`

```text
title=Saree Brand Campaign
date=Jul 10, 2025
chip=Brand & Commercial
description=Commercial brand storytelling
client=Varnika Silks
project=Commercial Shoot
brand_model=Varnika Silks
agency=Brandshark
featured=true
```

Set `featured=true` on the project(s) you want to show in the homepage Featured Projects section.

## Categories To Use

- `commercial`
- `product`
- `fashion`
- `events`
- `documentary`
- `street`

After adding or changing folders, run:

```bash
./scripts/sync-projects.sh
```

## Ordering Categories And Projects

Use `assets/projects/order.txt` to control the order shown on the website.

Keep category names above the section blocks:

```text
Commercials
Products
Events
Street
Models
Documentaries
```

Then control project order inside each category:

```text
[Commercials]
Kosala
Luxora
MyBra
```

Rules:

- Names must match the folder names exactly.
- Projects or categories not listed in `order.txt` will still appear after the listed items.
- Run `./scripts/sync-projects.sh` after editing `order.txt`.
