# SOLID SCHOOL DANCE — Assets Specification & Directory Structure

To ensure production-grade editorial aesthetics without broken images, all assets follow strict typographic and high-contrast editorial art direction rules.

## 1. Directory Structure

```
assets/
├── fonts/
│   ├── CYGroteskSTD-Bold.woff2       # Weight: 700
│   └── CYGroteskSTD-Black.woff2      # Weight: 900
├── images/
│   ├── hero/
│   │   ├── hero-dancer-bleed.webp    # High contrast, motion blur, full body jump/freeze (aspect 4:5 or 3:4)
│   │   └── hero-poster.webp          # Video fallback poster
│   ├── styles/
│   │   ├── hip-hop.webp              # Grayscale raw movement, cypher dynamic shot
│   │   ├── house.webp                # Footwork motion blur, club strobe lighting
│   │   ├── breaking.webp             # Freeze/power move floor silhouette
│   │   ├── contemporary.webp         # Floorwork / line extension, dramatic shadow
│   │   ├── jazz.webp                 # Editorial isolations, high shutter speed
│   │   ├── k-pop.webp                # Precision sync angle, harsh flash
│   │   ├── afro.webp                 # Grounded bounce, polyrhythmic gesture
│   │   └── heels.webp                # Architecture line, sharp silhouette
│   ├── school/
│   │   ├── studio-floor.webp         # Raw concrete / sprung floor, warehouse windows
│   │   └── studio-cypher.webp        # Circle in dim space, chalk on floor
│   ├── teachers/
│   │   ├── tarak.webp                # Raw high-contrast editorial portrait, direct gaze
│   │   ├── maya.webp                 # Motion portrait, angular posture
│   │   ├── yassine.webp              # Candid rehearsal portrait, harsh contrast
│   │   ├── selma.webp                # Studio light cut, intense expression
│   │   └── karim.webp                # Street cypher portrait
│   └── community/
│   │   ├── community-01.webp         # Backstage prep, tape on hands
│   │   ├── community-02.webp         # Late night jam session, motion streak
│   │   └── community-03.webp         # Circle after the battle, sweat & laughter
└── video/
    └── hero-reel.mp4                 # Optional muted 10s loop of raw dance rehearsals
```

## 2. Image Art Direction & Processing Rules
- **Tone & Filter**: Black & White (Grayscale 100%), High contrast (`contrast(1.35) brightness(0.9)`), no glossy corporate smiles.
- **Lighting**: Raw editorial, single hard source, motion blur, silhouettes, sweat, and floor marks.
- **Fallbacks**: If any asset fails or is missing, custom CSS handles the fallback seamlessly using a moss background (`#0B1A0A`), 1px acid gridlines, and ghosted giant typographic labels so the layout remains striking.
- **Fonts**: Primary typeface `CY Grotesk STD` Bold (700) & Black (900) woff2. Fallback to Google Fonts variable font `Archivo` (weight 100-900, width 62-125) plus system fallbacks (`Helvetica Neue, Arial`).
