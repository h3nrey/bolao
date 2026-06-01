# UI Style Guide
### AI Angular Application — Sofascore-Inspired Design System

---

## Overview

This design system is built for high-density, data-driven interfaces. Inspired by Sofascore's sharp, no-fluff visual language — where information density meets visual clarity. The aesthetic is bold, angular, and sports-tech, utilizing a refined, modern border radius (4px - 8px) to combine structural precision with visual premium.

**Icon Library:** [Lucide Icons](https://lucide.dev)  
**Primary Brand Color:** Red  
**Design Philosophy:** Subtle 4px-8px curves, vibrant saturation, dense information hierarchy

---

## Color System

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#E8001D` | CTAs, active states, AI highlights |
| `--color-primary-dark` | `#B8001A` | Hover on primary, pressed states |
| `--color-primary-light` | `#FF1A35` | Badges, pulse dot, hover accents |
| `--color-primary-subtle` | `#3D0008` | Solid dark-red backgrounds for AI-tagged zones |

### Neutral Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-base` | `#0D0D0F` | App background |
| `--color-bg-surface` | `#14151A` | Cards, panels, containers |
| `--color-bg-elevated` | `#1C1D24` | Reserved for dropdowns, tooltips, modals, and snackbars only |
| `--color-bg-hover` | `#22232D` | Row hovers, interactive highlights |
| `--color-border` | `#2A2B36` | Dividers, card borders |
| `--color-border-strong` | `#3D3E4D` | Focus rings, active borders |

### Text Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#F0F0F5` | Primary content, headings |
| `--color-text-secondary` | `#9B9BAD` | Labels, metadata, timestamps |
| `--color-text-muted` | `#5C5C72` | Disabled states, placeholders |
| `--color-text-inverse` | `#0D0D0F` | Text on primary/colored backgrounds |

### Semantic Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#00D68F` | Positive AI responses, wins, gains |
| `--color-warning` | `#FFB800` | Caution states, partial matches |
| `--color-error` | `#E8001D` | Errors (same as primary) |
| `--color-info` | `#0A84FF` | Informational, AI processing |
| `--color-ai-accent` | `#BF5AF2` | AI-specific actions, model badges |

### Score/Data Accents (Sofascore-Style)

| Token | Hex | Usage |
|---|---|---|
| `--color-win` | `#00D68F` | Positive deltas |
| `--color-loss` | `#E8001D` | Negative deltas |
| `--color-draw` | `#9B9BAD` | Neutral/tied states |
| `--color-live` | `#FF1A35` | Live indicators, real-time data |

---

## Typography

### Font Stack

```css
--font-display: 'DM Mono', 'Roboto Mono', monospace;    /* Scores, stats, live data */
--font-body:    'Barlow', 'Inter Tight', sans-serif;     /* Body, UI labels */
--font-ui:      'Barlow Condensed', sans-serif;          /* Compact UI, table headers */
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `--text-display` | `32px` | `700` | `1.1` | Page titles, hero stats |
| `--text-heading-1` | `24px` | `700` | `1.2` | Section headers |
| `--text-heading-2` | `18px` | `600` | `1.3` | Card headers, widget titles |
| `--text-heading-3` | `14px` | `700` | `1.4` | Table headers, group labels |
| `--text-body` | `14px` | `400` | `1.5` | General content |
| `--text-body-sm` | `12px` | `400` | `1.5` | Secondary content, captions |
| `--text-label` | `11px` | `600` | `1` | Labels, badges (uppercase) |
| `--text-stat` | `28px` | `700` | `1` | Score displays, key metrics |
| `--text-mono` | `13px` | `400` | `1.4` | IDs, code, timestamps |

### Text Rules

- **Headings** — always uppercase for `--text-heading-3` and smaller when used as labels
- **Stats** — use `--font-display` (monospace) for numeric data to ensure column alignment
- **Letter-spacing** — add `0.08em` to uppercase label variants only
- Never mix more than 2 font families in a single view

---

## Spacing System

Base unit: `4px`

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon internal padding, tiny gaps |
| `--space-2` | `8px` | Compact item spacing |
| `--space-3` | `12px` | Cell padding, inline gaps |
| `--space-4` | `16px` | Card padding, section gaps |
| `--space-5` | `20px` | Component spacing |
| `--space-6` | `24px` | Section padding |
| `--space-8` | `32px` | Large section gaps |
| `--space-10` | `40px` | Page section separators |
| `--space-12` | `48px` | Hero/display spacing |

---

## Border Radius

This system favors a **refined, modern border radius (4px - 8px)** to maintain sharp precision while providing a premium, polished sports-tech finish.

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Small interactive elements, badges, chips, buttons, inputs |
| `--radius-md` | `6px` | Default cards, panels, containers, item rows |
| `--radius-lg` | `8px` | Larger containers, modals, primary layout wrappers |
| `--radius-full` | `9999px` | Avatar images, toggle pills only |

> **Rule:** Default to `--radius-md` (6px) for cards, containers, and panels. Use `--radius-lg` (8px) for major layout wrappers or modals, and `--radius-sm` (4px) for smaller controls. Never use completely rounded `12px+` layout corners.

---

## Elevation & Shadows

Elevation is expressed through **background stepping** (darker → lighter surfaces), never through glow or colored shadow effects. Shadows are structural only — black-based, directional, and subtle.

| Token | Value | Usage |
|---|---|---|
| `--shadow-none` | `none` | Flat, surface-level elements |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.5)` | Cards lifted from base |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.65)` | Dropdowns, popovers |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.75)` | Modals, command palettes |

> **Rule:** All shadow values use pure black (`rgba(0,0,0,...)`) only. No colored shadows, no glow effects, no `box-shadow` with hue. Use border or background changes to signal active or highlighted states instead.

---

## Component Library

### Buttons

#### Variants

```
PRIMARY       — bg: --color-primary, text: white, hover: darken 8%
SECONDARY     — bg: --color-bg-elevated, border: --color-border-strong, text: --color-text-primary
GHOST         — bg: transparent, text: --color-text-secondary, hover: --color-bg-hover
DESTRUCTIVE   — bg: --color-error (same as primary in this system)
AI            — bg: --color-ai-accent, text: white
```

#### Sizes

| Size | Height | Padding X | Font | Radius |
|---|---|---|---|---|
| `sm` | `28px` | `10px` | `12px / 600` | `--radius-sm` |
| `md` | `36px` | `16px` | `13px / 600` | `--radius-sm` |
| `lg` | `44px` | `24px` | `14px / 700` | `--radius-sm` |

#### Icon Buttons

- Always use Lucide icons
- Icon size: `16px` for sm/md, `18px` for lg
- Gap between icon and label: `--space-2`
- Icon-only buttons must have `aria-label`

```html
<!-- Lucide icon usage pattern in Angular -->
<button class="btn btn-primary">
  <lucide-icon name="zap" [size]="16" />
  Generate
</button>

<button class="btn btn-ghost icon-only" aria-label="Filter results">
  <lucide-icon name="sliders-horizontal" [size]="16" />
</button>
```

---

### Inputs & Form Controls

```
Height:          36px (md), 28px (sm)
Border:          1px solid --color-border
Border-radius:   --radius-sm (3px)
Background:      --color-bg-surface
Text:            --color-text-primary
Placeholder:     --color-text-muted
Focus border:    --color-primary
Focus shadow:    0 0 0 2px rgba(232,0,29,0.25)
```

#### Lucide Icons in Inputs

Prefix and suffix icons use `--color-text-secondary` at `16px`.

```html
<div class="input-wrapper">
  <lucide-icon name="search" [size]="16" class="input-prefix" />
  <input type="text" placeholder="Search players, teams..." />
  <lucide-icon name="x" [size]="14" class="input-suffix input-clear" />
</div>
```

---

### Cards & Panels

```
Background:    --color-bg-surface
Border:        1px solid --color-border
Border-radius: 0px (--radius-none)
Padding:       --space-4 (16px)
```

Cards use a **left accent border** to signal state:

```css
/* Default */
border-left: 2px solid transparent;

/* Active / selected */
border-left: 2px solid var(--color-primary);

/* AI-generated content */
border-left: 2px solid var(--color-ai-accent);

/* Success state */
border-left: 2px solid var(--color-success);
```

---

### Data Tables

Sofascore-style dense tables are the backbone of this system.

```
Row height:      40px (default), 32px (compact)
Header height:   36px
Header font:     --text-heading-3, uppercase, --color-text-secondary
Cell font:       --text-body (14px)
Row separator:   1px solid --color-border
Hover bg:        --color-bg-hover
Selected bg:     rgba(232,0,29,0.08) with left border --color-primary
```

```html
<!-- Table header with sort icon -->
<th class="table-header sortable">
  <span>Rating</span>
  <lucide-icon name="chevrons-up-down" [size]="12" />
</th>

<!-- Live row indicator -->
<td class="cell-status">
  <lucide-icon name="circle" [size]="8" class="icon-live" />
  <span>LIVE</span>
</td>
```

---

### Badges & Tags

Sharp-cornered pill-shaped tags for categorization.

| Variant | Background | Text | Usage |
|---|---|---|---|
| `default` | `--color-bg-elevated` | `--color-text-secondary` | Generic labels |
| `primary` | `--color-primary` | white | Primary classification |
| `live` | `--color-live` | white | Real-time content |
| `ai` | `rgba(191,90,242,0.15)` | `--color-ai-accent` | AI-generated content |
| `success` | `rgba(0,214,143,0.15)` | `--color-success` | Positive outcomes |
| `warning` | `rgba(255,184,0,0.15)` | `--color-warning` | Caution |

```
Height:        20px (sm), 24px (md)
Padding X:     6px (sm), 10px (md)
Border-radius: --radius-xs (2px)
Font:          --text-label, uppercase, letter-spacing: 0.06em
```

```html
<span class="badge badge-live">
  <lucide-icon name="radio" [size]="10" />
  Live
</span>

<span class="badge badge-ai">
  <lucide-icon name="sparkles" [size]="10" />
  AI
</span>
```

---

### Icons (Lucide)

#### Standard Sizes

| Size | Usage |
|---|---|
| `12px` | Table sort arrows, inline micro-icons |
| `14px` | Badge icons, button suffixes |
| `16px` | Default UI icons (buttons, inputs, rows) |
| `18px` | Navigation icons |
| `20px` | Card header actions |
| `24px` | Empty states, feature icons |
| `32px` | Illustration icons, onboarding |

#### Stroke Width

| Context | Stroke |
|---|---|
| Default UI | `1.5` |
| Emphasis / CTA | `2` |
| Deemphasized / muted | `1` |

#### Common Icon Mapping

| Action / Concept | Lucide Icon Name |
|---|---|
| AI / Generate | `sparkles` |
| AI Model | `brain-circuit` |
| Search | `search` |
| Filter | `sliders-horizontal` |
| Sort | `chevrons-up-down` |
| Live / Real-time | `radio` |
| Trend Up | `trending-up` |
| Trend Down | `trending-down` |
| Player | `user` |
| Team | `users` |
| Match / Event | `calendar` |
| Stats | `bar-chart-2` |
| Heatmap | `grid-2x2` |
| Settings | `settings-2` |
| Notification | `bell` |
| Alert | `triangle-alert` |
| Success | `circle-check` |
| Error | `circle-x` |
| Info | `info` |
| Close | `x` |
| Menu | `menu` |
| More options | `ellipsis` |
| Export | `download` |
| Share | `share-2` |
| Bookmark | `bookmark` |
| Pin | `pin` |
| Refresh | `rotate-cw` |
| Loading | `loader-circle` |

```ts
// Angular usage
import { LucideAngularModule, Sparkles, BrainCircuit } from 'lucide-angular';

@NgModule({
  imports: [
    LucideAngularModule.pick({ Sparkles, BrainCircuit })
  ]
})
```

---

### Navigation

#### Top Bar

```
Height:        56px
Background:    --color-bg-surface
Border-bottom: 1px solid --color-border
Padding X:     --space-6
```

Layout: `[Logo] [Primary Nav] [Spacer] [Search] [User Actions]`

#### Sidebar

```
Width:         240px (expanded), 56px (collapsed)
Background:    --color-bg-base
Border-right:  1px solid --color-border
```

Nav items:

```
Height:        40px
Padding X:     --space-4
Icon:          16px, --color-text-secondary
Label:         --text-body, --color-text-secondary

Active state:
  Background:  rgba(232,0,29,0.10)
  Left border: 2px solid --color-primary
  Icon:        --color-primary
  Label:       --color-text-primary, weight 600
```

---

### Score / Stat Display

Core Sofascore pattern — dense numeric display.

```
Score value:   --text-stat (28px), --font-display, --color-text-primary
Score label:   --text-label, --color-text-secondary, uppercase
Delta (pos):   --color-win, prepend "▲" or use trending-up icon
Delta (neg):   --color-loss, prepend "▼" or use trending-down icon
Delta (neu):   --color-draw
```

```html
<div class="stat-block">
  <span class="stat-value">94.2</span>
  <span class="stat-label">AI Rating</span>
  <span class="stat-delta positive">
    <lucide-icon name="trending-up" [size]="12" />
    +2.1
  </span>
</div>
```

---

### Live Indicator

```
Dot size:    8px circle
Color:       --color-live (#FF1A35)
Animation:   pulse — opacity oscillates 1 → 0.3 at 1s ease-in-out infinite
Label:       --text-label, uppercase, --color-live, letter-spacing: 0.08em
```

```css
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.icon-live {
  color: var(--color-live);
  animation: live-pulse 1s ease-in-out infinite;
}
```

---

### AI Component Patterns

#### AI Response Container

```
Background:    --color-ai-surface  (#16101E)
Border:        1px solid --color-ai-accent  (#BF5AF2)
Border-left:   3px solid --color-ai-accent
Border-radius: 0
Padding:       --space-4
```

Header with model badge:

```html
<div class="ai-response">
  <div class="ai-header">
    <lucide-icon name="brain-circuit" [size]="16" class="color-ai" />
    <span class="ai-label">AI Analysis</span>
    <span class="badge badge-ai">GPT-4o</span>
  </div>
  <div class="ai-body"><!-- content --></div>
</div>
```

#### AI Loading State

Use `loader-circle` icon with `spin` animation:

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.icon-loading {
  animation: spin 0.8s linear infinite;
  color: var(--color-ai-accent);
}
```

#### AI Confidence Indicator

Horizontal bar, no border-radius, color-coded by threshold:

```
> 80%:  --color-success
50–80%: --color-warning
< 50%:  --color-loss
```

```html
<div class="confidence-bar">
  <div class="confidence-fill" [style.width]="score + '%'" [class]="confidenceClass"></div>
</div>
<span class="confidence-label">87% Confidence</span>
```

---

## Motion & Animation

Transitions are fast and purposeful. No decorative slow fades.

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | `80ms` | Hover bg, color changes |
| `--duration-fast` | `120ms` | Button press, state changes |
| `--duration-normal` | `200ms` | Panel transitions, reveals |
| `--duration-slow` | `300ms` | Modal enter/exit, page transitions |

```css
--easing-default: cubic-bezier(0.2, 0, 0, 1);
--easing-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
```

Rules:
- Hover states: `--duration-instant` with `--easing-default`
- Element enter: slide + fade combo, `--duration-normal`
- No animations over `400ms` except intentional loading states
- Respect `prefers-reduced-motion`

---

## Angular-Specific Guidelines

### CSS Variables in Angular

Define all tokens in `styles.scss` on `:root`, not in component styles.

```scss
// styles.scss
:root {
  --color-primary: #E8001D;
  --color-bg-base: #0D0D0F;
  // ...
}
```

### Component Architecture

```
SharedModule
  ├── ButtonComponent      (btn, btn-primary, btn-ghost...)
  ├── BadgeComponent       (badge, badge-live, badge-ai...)
  ├── IconComponent        (wraps LucideAngularModule)
  ├── StatBlockComponent   (score, delta, label)
  ├── LiveIndicator        (pulse dot + label)
  ├── AiResponseCard       (ai-response pattern)
  └── DataTableComponent   (sortable, row selection, live rows)
```

### Class Naming Convention (BEM-style)

```
Block:     .stat-block
Element:   .stat-block__value, .stat-block__label
Modifier:  .stat-block--compact, .stat-block--highlighted
```

### Lucide in Angular

```ts
import { LucideAngularModule } from 'lucide-angular';
import { Sparkles, BrainCircuit, TrendingUp, Radio } from 'lucide-angular';

// In module:
LucideAngularModule.pick({ Sparkles, BrainCircuit, TrendingUp, Radio })

// In template:
<lucide-icon name="sparkles" [size]="16" [strokeWidth]="1.5" />
```

---

## Accessibility

- All interactive elements: minimum `36px` touch target
- Focus rings: `2px solid --color-primary` with `2px offset`
- Color contrast: minimum `4.5:1` for body text, `3:1` for UI components
- Never use color alone to convey meaning — always pair with an icon or label
- All Lucide icons in buttons must have `aria-label` if icon-only
- Live data regions: wrap in `aria-live="polite"`

---

## Hard Prohibitions

These are non-negotiable constraints. No exceptions, no overrides per-component.

### No Glow Effects

`box-shadow` with a spread or colored hue is banned across the entire system. Glow creates visual noise, conflicts with the sharp angular aesthetic, and degrades readability on dark backgrounds.

```css
/* ❌ NEVER — any colored or spread shadow */
box-shadow: 0 0 12px rgba(232, 0, 29, 0.4);
box-shadow: 0 0 20px #E8001D;
box-shadow: 0 4px 16px rgba(191, 90, 242, 0.5);
filter: drop-shadow(0 0 8px var(--color-primary));

/* ✅ ALLOWED — structural black shadow only */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.65);

/* ✅ PREFERRED — use borders and background shifts for emphasis */
border: 1px solid var(--color-primary);
background: var(--color-bg-hover);
```

To signal active, focused, or highlighted state, use:
- A solid `border` or `border-left` with a system color
- A background step up (`--color-bg-hover`) for common hover/selected states
- A colored `outline` for focus rings — but pure solid, not blurred

### Reserved High-Emphasis Surfaces

Do not use high-emphasis dark fills as generic decoration. These colors are reserved:

| Color | Allowed use | Avoid in |
|---|---|---|
| `#1C1D24` / `--color-bg-elevated` | Dropdowns, tooltips, modals, snackbars, popovers | Match cards, date chips, status badges, empty states, normal row/card hovers |
| `#2A0008` / red danger surface | Destructive snackbars, blocking error alerts, critical confirmation panels | Live badges, normal status chips, date labels, cards, table rows |

For ordinary chips and labels, use `#14151A` with `#2A2B36` and text `#9B9BAD`. Use semantic color mainly on the icon, left accent border, or text when the state truly needs emphasis.

### No Low-Opacity Colors

Semi-transparent colors (`rgba` with opacity below `0.9`, or hex with alpha like `#FF1A3514`) are banned for all foreground elements, backgrounds, and overlays — except `rgba(0,0,0,...)` shadows.

Colors must be **opaque and intentional**. If a color needs to feel "lighter" or "subtler", derive a proper solid color instead.

```css
/* ❌ NEVER — transparent or washed-out color values */
background: rgba(232, 0, 29, 0.08);
background: rgba(191, 90, 242, 0.15);
color: rgba(240, 240, 245, 0.5);
border-color: rgba(232, 0, 29, 0.3);
background: #FF1A3514;

/* ✅ CORRECT — use neutral solid surfaces for common UI */
background: #14151A;             /* default surface */
background: #22232D;             /* hover surface */
color: var(--color-text-muted);  /* #5C5C72 — a real opaque muted tone */
border-color: var(--color-border); /* #2A2B36 — solid border */
```

**Why:** Low-opacity colors look washed out, shift appearance unpredictably over different backgrounds, and contradict the vibrant, fully-saturated intent of this system. Every color in the UI must be a declared token with a solid hex value.

#### Solid Color Replacements

When tempted to use a transparent color, use these solid equivalents instead:

| Avoid | Use instead | Token |
|---|---|---|
| `rgba(232,0,29,0.08)` — ghost red bg | `#1A0005` | `--color-primary-surface` |
| `rgba(232,0,29,0.15)` — light red bg | `#14151A` + red text/icon/border | common UI |
| `rgba(232,0,29,0.15)` — blocking destructive bg | `#2A0008` | destructive snackbar / critical alert only |
| `rgba(191,90,242,0.10)` — ghost purple | `#16101E` | `--color-ai-surface` |
| `rgba(191,90,242,0.15)` — light purple | `#1E1428` | `--color-ai-subtle` |
| `rgba(0,214,143,0.10)` — ghost green | `#0A1E18` | `--color-success-surface` |
| `rgba(255,184,0,0.12)` — ghost amber | `#1E1800` | `--color-warning-surface` |

Add these to your `:root` token definitions and use them instead of inline `rgba`.

---

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use refined border-radius (4px-8px) on cards and panels | Use raw `0px` or extreme `12px+` layout corners |
| Use Lucide at `16px` default size | Mix icon libraries |
| Saturate colors fully — this system is vibrant | Use washed-out or pastel tones |
| Left-border accents to signal state | Top or full borders for state |
| Monospace font for numeric data | Use proportional fonts for scores |
| `4px` max radius on buttons/inputs | Use `12px+` radius on interactive elements |
| Uppercase small labels with letter-spacing | Lowercase micro-labels |
| Fast transitions (`80–200ms`) | Slow decorative fades (`>400ms`) |
| Purple (`--color-ai-accent`) for AI features | Red for AI (red = primary action) |
| Use solid derived colors for subtle backgrounds | Use `rgba` with low opacity for backgrounds |
| Use `border` / `background` step to signal state | Use `box-shadow` glow for emphasis |
| Use `rgba(0,0,0,...)` shadows only | Use colored or spread `box-shadow` |

---

*Version 1.0 — AI Angular Application Design System*
