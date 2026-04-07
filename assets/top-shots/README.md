# Top Shots

Add your top 10 photos to this folder using these names:

```text
01.jpg
02.jpg
03.jpg
04.jpg
05.jpg
06.jpg
07.jpg
08.jpg
09.jpg
10.jpg
```

The homepage also checks `.JPG`, `.jpeg`, `.JPEG`, `.png`, `.PNG`, `.webp`, and `.WEBP` for the same numbers.

## Crop Control

Edit `crops.json` to choose which part of each photo is previewed.

Examples:

```json
{
  "01": "50% 20%",
  "02": "center top",
  "03": "35% 45%"
}
```

Use the first value for horizontal position and the second value for vertical position.

- `50% 50%` means center.
- `50% 20%` moves the crop upward.
- `50% 80%` moves the crop downward.
- `25% 50%` moves the crop left.
- `75% 50%` moves the crop right.
