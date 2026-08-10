# DADAN Design System — Single Source of Truth

The DADAN Design System is the authoritative visual and component language for the DADAN digital platform. Built on **Next.js 15**, **Tailwind CSS v4**, and **CSS Custom Properties**, it establishes consistent design tokens, unified UI primitives, and clear layout standards.

---

## Table of Contents

1. [Foundations & Design Tokens](#1-foundations--design-tokens)
   - [Color Palette](#color-palette)
   - [Semantic Color Tokens](#semantic-color-tokens)
   - [Typography Scale](#typography-scale)
   - [Spacing & Container Guidelines](#spacing--container-guidelines)
   - [Border Radius & Elevation](#border-radius--elevation)
   - [Z-Index & Transitions](#z-index--transitions)
2. [Core Primitives & Components](#2-core-primitives--components)
   - [Button](#button)
   - [Input](#input)
   - [Alert](#alert)
   - [Badge](#badge)
   - [Modal](#modal)
   - [ArrowLink](#arrowlink)
   - [PieceCard](#piececard)
   - [StatusPill](#statuspill)
3. [Layout Primitives](#3-layout-primitives)
   - [Container](#container)
   - [SectionHead](#sectionhead)
   - [SplitHeroLayout](#splitherolayout)
   - [AccountLayout](#accountlayout)
4. [Building New Features](#4-building-new-features)

---

## 1. Foundations & Design Tokens

Design tokens live centrally in [`apps/web/styles/theme.css`](file:///Users/mustafakhaled/Documents/my-projects/Danan-main/apps/web/styles/theme.css) inside the Tailwind CSS `@theme` block and `:root` variables.

### Color Palette

Extracted from the brand reference palette, providing 8 complete scales (50–950):

| Scale | Hex Range (50 → 950) | Primary Usage |
|-------|----------------------|---------------|
| **Brown** | `#FCF8FB` → `#141210` | Dark neutrals, deep background surfaces |
| **Warm Gray** | `#FBF7F7` → `#2A1612` | Terracotta / Salmon brand accents |
| **Earth / Olive** | `#FBF8F3` → `#251B12` | Warm section backgrounds & sidebars |
| **Teal / Green** | `#E7FEFA` → `#0A2925` | Success indicators & secondary brand accents |
| **Amber** | `#FFF6EB` → `#3D2200` | Warning & pending status states |
| **Cyan** | `#E6FFF2` → `#013524` | Informational status indicators |
| **Red** | `#FEF5F4` → `#4D0705` | Error states & destructive actions |
| **Neutral Gray** | `#F8F9FA` → `#13161C` | Dark footer surfaces & standard borders |

### Semantic Color Tokens

Never hardcode HEX values in components. Always reference semantic utility classes or CSS custom properties:

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
--color-ds-border:       #D4D4D4;
--color-ds-border-light: #E8E4DC;
```

### Typography Scale

DADAN uses **EB Garamond** for luxury headings and **Manrope** for clean body text, with **Amiri** for Arabic support.

| Token | Class | Size | Font Family | Usage |
|-------|-------|------|-------------|-------|
| `display` | `.ds-display` | 4.5rem (72px) | EB Garamond | Hero headlines |
| `h1` | `.ds-h1` | 3.0rem (48px) | EB Garamond | Page titles |
| `h2` | `.ds-h2` | 2.25rem (36px) | EB Garamond | Major section headings |
| `h3` | `.ds-h3` | 1.75rem (28px) | EB Garamond | Sub-section headings |
| `h4` | `.ds-h4` | 1.5rem (24px) | EB Garamond | Card titles & modal titles |
| `body-lg` | `.ds-body-lg` | 1.125rem (18px) | Manrope | Large intro copy |
| `body` | `.ds-body` | 0.9375rem (15px) | Manrope | Default body text |
| `body-sm` | `.ds-body-sm` | 0.8125rem (13px) | Manrope | Secondary body & table content |
| `caption` | `.ds-caption` | 0.6875rem (11px) | Manrope | Badges & tiny labels |
| `overline` | `.ds-overline` | 0.75rem (12px) | Manrope | Uppercase tracked labels |

### Spacing & Container Guidelines

Container widths are strictly controlled via [`<Container size="..." />`](file:///Users/mustafakhaled/Documents/my-projects/Danan-main/apps/web/components/ui/container.tsx):

- **Default**: `max-w-7xl` (1280px) for general content
- **Narrow**: `max-w-4xl` (896px) for forms, articles, checkout
- **Wide**: `max-w-[1440px]` for full header & banner sections

Horizontal padding follows standard responsiveness: `px-4 sm:px-8`.

### Border Radius & Elevation

- `--radius-sm` (4px): Form inputs, badges, select dropdowns
- `--radius-md` (6px): Buttons, standard cards, alerts
- `--radius-lg` (8px): Modals, hero card containers, popovers
- `--radius-xl` (12px): Featured navigation cards

---

## 2. Core Primitives & Components

All primitives reside in [`apps/web/components/ui/`](file:///Users/mustafakhaled/Documents/my-projects/Danan-main/apps/web/components/ui/) and are exported via `index.ts`.

### Button

Unified button component replacing old ad-hoc buttons:

```tsx
import { Button } from "@/components/ui";

// Variants: primary | secondary | teal | outline | ghost | destructive
// Sizes: sm | md | lg
<Button variant="primary" size="md" arrow>
  Explore All Pieces
</Button>
```

### Input

Standardized form input with label, status validation (error, success, warning), helper text, and trailing icon:

```tsx
import { Input } from "@/components/ui";

<Input
  label="Recipient House ID"
  placeholder="Enter 6-character code"
  error={errors.recipientHouseId}
  fullWidth
/>
```

### Alert

Notification banner with 4 semantic variants:

```tsx
import { Alert } from "@/components/ui";

<Alert variant="warning" dismissible>
  A transfer is currently in progress.
</Alert>
```

### Badge

Status indicator with mono typography:

```tsx
import { Badge } from "@/components/ui";

<Badge variant="success">APPROVED</Badge>
```

### Modal

Accessible dialog component with backdrop, ESC dismissal, and focus trap:

```tsx
import { Modal, Button } from "@/components/ui";

<Modal
  open={isOpen}
  title="Certificate of Authenticity"
  onClose={() => setIsOpen(false)}
  footer={<Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>}
>
  <p>Certificate details here...</p>
</Modal>
```

---

## 3. Layout Primitives

### SectionHead

Section title header with subtitle and optional call-to-action link:

```tsx
import { SectionHead } from "@/components/ui";

<SectionHead
  title="Curated Collections"
  subtitle="Discover hand-crafted pieces designed with heritage and trust"
  href="/beta/collections"
  link="View All"
/>
```

---

## 4. Building New Features

When creating a new feature or page:

1. **Import Primitives**: Always import UI primitives (`Button`, `Input`, `Container`, `SectionHead`, etc.) from `@/components/ui`.
2. **Use Design Tokens**: Use Tailwind DS utility classes (`bg-ds-surface`, `text-ds-text`, `text-ds-text-secondary`, `border-ds-border`, `font-heading`, `font-body`) instead of raw hex codes.
3. **Responsive Padding**: Wrap page sections in `<Container>` to guarantee consistent alignment.
4. **Form Pattern**: Combine `<Input>` with `<Button variant="primary">` for clean, standard form layouts.
