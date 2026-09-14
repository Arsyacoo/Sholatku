# Sholatku Store Assets

`sholatku-app-icon-512.png` is the canonical raster source for the final Sholatku Android brand. It is a byte-for-byte
copy of the developer-provided `.local/android/sholatku-final-icon.png` source.

Source SHA-256: `da3c90d50ae7c97bd037d5a65b291a4f6c4c064997b5ad4fb173aba5ea236b8b`

## Source rules

- Preserve the dark teal rounded-square background, gold crescent, gold star, proportions, and composition.
- Do not add text, a device frame, a launcher label, or a new logo interpretation.
- The source is raster-only, so no replacement SVG or vector redraw is kept in this directory.
- The 512x512 PNG is the Play Store export and remains unmasked apart from the rounded-square transparency already
  present in the supplied artwork.

## Android adaptations

- Legacy `mipmap-*` icons use the supplied raster resized to Android density dimensions without stretching.
- Adaptive icons use the same crescent-star pixels as a transparent foreground and the source's dark teal as the
  background. Android applies its own launcher mask; the supplied rounded-square canvas is not nested into the adaptive
  foreground.
- The monochrome layer is a single-color silhouette of the same crescent and star, preserving their placement and
  negative space.
- Splash resources use the same crescent-star mark centered on the source-derived dark teal background.

These assets are local preparation only. No Play Console upload is performed by the repository build.
