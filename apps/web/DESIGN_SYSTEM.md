# DADAN Design System — Single Source of Truth

The DADAN Design System is the authoritative visual and component language for the DADAN digital platform. Built on **Next.js 15**, **Tailwind CSS v4**, and **CSS Custom Properties**, it establishes consistent design tokens, unified UI primitives, and clear layout standards.

---

## Table of Contents

1. [Foundations & Design Tokens](#1-foundations--design-tokens)
   - [Color Palette Matrix (8 Complete Scales)](#color-palette-matrix)
   - [Semantic Color Tokens](#semantic-color-tokens)
   - [Typography Scale & Classes Matrix](#typography-scale--classes-matrix)
   - [Spacing & Container Guidelines](#spacing--container-guidelines)
   - [Border Radius & Elevation](#border-radius--elevation)
   - [Z-Index & Transitions](#z-index--transitions)
2. [Core Primitives & Components](#2-core-primitives--components)
   - [Button](#button)
   - [Input](#input)
   - [Alert](#alert)
   - [Badge & StatusPill](#badge--statuspill)
   - [Modal](#modal)
   - [ArrowLink](#arrowlink)
   - [PieceCard](#piececard)
3. [Layout Primitives](#3-layout-primitives)
   - [Container](#container)
   - [SectionHead](#sectionhead)
   - [SplitHeroLayout](#splitherolayout)
   - [AccountLayout](#accountlayout)
   - [AdminLayout](#adminlayout)
4. [Building New Features](#4-building-new-features)

---

## 1. Foundations & Design Tokens

Design tokens live centrally in [`apps/web/styles/theme.css`](file:///Users/mustafakhaled/Documents/my-projects/Danan-main/apps/web/styles/theme.css) inside the Tailwind CSS `@theme` block and `:root` variables.

### Color Palette Matrix

Extracted from the brand reference palette, providing 8 complete scales (50–950):

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | Usage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Brown / Taupe** | `#FCFBFB` | `#F6F5F4` | `#EAE7E4` | `#D9D3CD` | `#B7ADA4` | `#897F79` | `#69615C` | `#524B48` | `#393431` | `#292523` | `#141210` | Dark neutrals, deep canvas |
| **Terracotta / Clay** | `#FBF7F7` | `#F6EFED` | `#EEDEDB` | `#E2C7C2` | `#D6A198` | `#BF7266` | `#985B50` | `#7A493F` | `#5D372F` | `#4A2A24` | `#2A1612` | Primary brand accent |
| **Sand / Ochre** | `#FBF8F3` | `#F7EFE4` | `#EFDEC7` | `#E4C79C` | `#C9AC7F` | `#A18762` | `#846C4E` | `#6A543D` | `#52402E` | `#423324` | `#251B12` | Warm surfaces & sidebars |
| **Danan Teal** | `#E7FEFA` | `#C7FCF3` | `#82FAE9` | `#5FE9D7` | `#55D3C1` | `#4CBEAE` | `#3C9A8D` | `#2A7168` | `#1F5750` | `#184742` | `#0A2925` | Success indicators, brand teal |
| **Amber / Gold** | `#FFF6EB` | `#FFECD2` | `#FFDCAB` | `#FFC66D` | `#FAAF07` | `#E9A306` | `#CA8A04` | `#A06602` | `#7F4C01` | `#693D01` | `#3D2200` | Warning & pending states |
| **Mint / Emerald** | `#E6FFF2` | `#C5FFE2` | `#86FFC9` | `#0FF8AF` | `#0DE8A3` | `#0CDC9A` | `#1EC58B` | `#059669` | `#037351` | `#025C40` | `#013524` | Active indicators |
| **Crimson / Ruby** | `#FEF5F4` | `#FEE9E6` | `#FCD5D0` | `#FBB6AE` | `#FF8E82` | `#F7554D` | `#DC2626` | `#B41D1B` | `#951612` | `#7E110D` | `#4D0705` | Error states, delete actions |
| **Slate / Navy-Gray** | `#F8F9FA` | `#F1F2F4` | `#E1E4E8` | `#CCD2D9` | `#A5AFBD` | `#778699` | `#5D697A` | `#4B5563` | `#353D48` | `#272D35` | `#13161C` | Dark footer surfaces & borders |

---

### Semantic Color Tokens

Never hardcode HEX values in components. Always reference semantic utility classes:

```css
/* Primary Action (Terracotta/Salmon) */
--color-ds-primary:            #B56B5D;
--color-ds-primary-hover:      #A05C50;
--color-ds-primary-foreground: #FFFFFF;

/* Secondary Action (Dark Brown) */
--color-ds-secondary:            #2D2321;
--color-ds-secondary-hover:      #1A1412;
--color-ds-secondary-foreground: #FFFFFF;

/* Accent (Teal) */
--color-ds-teal:            #4CBEAE;
--color-ds-teal-hover:      #3FA899;

/* Surfaces */
--color-ds-background:      #FFFFFF;
--color-ds-surface:         #F5F5F5;
--color-ds-surface-warm:    #FBF8F3;
--color-ds-surface-rose:    #F6EFED;

/* Text */
--color-ds-text:            #1A1A1A;
--color-ds-text-secondary:  #555555;
--color-ds-text-muted:      #9CA3AF;

/* Borders */
--color-ds-border:          #D4D4D4;
--color-ds-border-light:    #E8E4DC;
```

---

### Typography Scale & Classes Matrix

DADAN uses **EB Garamond** for luxury headings (`font-heading`) and **Manrope** for clean body text (`font-body`), with **Amiri** for Arabic support (`font-arabic`) and **IBM Plex Mono** for serial numbers (`font-mono`).

All headings and body classes feature calibrated tracking (`letter-spacing: -2%` / `-0.02em`).

#### Headings (EB Garamond)
| Level | Size | Regular (400) | Medium (500) | SemiBold (600) |
|---|---|---|---|---|
| **H1** | `48px` (`3.0rem`) | `.text-h1-regular` | `.text-h1-medium` | `.text-h1-semibold` |
| **H2** | `36px` (`2.25rem`) | `.text-h2-regular` | `.text-h2-medium` | `.text-h2-semibold` |
| **H3** | `28px` (`1.75rem`) | `.text-h3-regular` | `.text-h3-medium` | `.text-h3-semibold` |
| **H4** | `24px` (`1.5rem`) | `.text-h4-regular` | `.text-h4-medium` | `.text-h4-semibold` |
| **H5** | `20px` (`1.25rem`) | `.text-h5-regular` | `.text-h5-medium` | `.text-h5-semibold` |
| **H6** | `16px` (`1.0rem`) | `.text-h6-regular` | `.text-h6-medium` | `.text-h6-semibold` |

#### Body (Manrope)
| Level | Size | Regular (400) | Medium (500) | SemiBold (600) |
|---|---|---|---|---|
| **Body SM** | `12px` (`0.75rem`) | `.text-body-sm-regular` | `.text-body-sm-medium` | `.text-body-sm-semibold` |
| **Body MD** | `14px` (`0.875rem`) | `.text-body-md-regular` | `.text-body-md-medium` | `.text-body-md-semibold` |
| **Body LG** | `18px` (`1.125rem`) | `.text-body-lg-regular` | `.text-body-lg-medium` | `.text-body-lg-semibold` |

---

### Spacing & Container Guidelines

Container widths are strictly controlled via [`<Container size="..." />`](file:///Users/mustafakhaled/Documents/my-projects/Danan-main/apps/web/components/ui/container.tsx):

- **Desktop (≥1536px / 1920px screen)**: Fixed `1792px` centered (`2xl:w-[1792px] mx-auto`) with no horizontal padding.
- **Mobile (< 1536px)**: Full width with `15px` horizontal padding (`w-full px-[15px]`).

---

### Border Radius & Elevation

- `--radius-sm` (4px): Form inputs, badges, select dropdowns (`rounded-(--radius-sm)`)
- `--radius-md` (6px): Buttons, standard cards, alerts (`rounded-(--radius-md)`)
- `--radius-lg` (8px): Modals, hero card containers, popovers (`rounded-(--radius-lg)`)
- `--radius-xl` (12px): Featured navigation cards (`rounded-(--radius-xl)`)
- `--radius-full` (9999px): Pills, avatars (`rounded-(--radius-full)`)

---

## 2. Core Primitives & Components

All primitives reside in [`apps/web/components/ui/`](file:///Users/mustafakhaled/Documents/my-projects/Danan-main/apps/web/components/ui/) and are exported via `index.ts`.

### Button
```tsx
import { Button } from "@/components/ui";

// Variants: primary | secondary | teal | outline | ghost | destructive
// Sizes: sm | md | lg
<Button variant="primary" size="md" arrow>
  Explore All Pieces
</Button>
```

### Input
```tsx
import { Input } from "@/components/ui";

<Input
  label="Recipient House ID"
  placeholder="Enter 6-character code"
  error={errors.recipientHouseId}
  fullWidth
/>
```

### PieceCard
```tsx
import { PieceCard } from "@/components/ui";

<PieceCard
  piece={{
    id: "piece-1",
    name: "Al-Ula Ring",
    imageUrl: "/images/ring.png",
    ownedSince: "AUGUST 2024",
  }}
/>
```

---

## 3. Building New Features

1. **Import Primitives**: Always import UI primitives (`Button`, `Input`, `Container`, `SectionHead`, `PieceCard`, etc.) from `@/components/ui`.
2. **Use Design Tokens**: Use Tailwind DS utility classes (`bg-ds-surface`, `text-ds-text`, `text-ds-text-secondary`, `border-ds-border`, `font-heading`, `font-body`) instead of raw hex codes.
3. **Responsive Padding**: Wrap page sections in `<Container>` to guarantee consistent alignment across all resolutions.
