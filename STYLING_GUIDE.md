# Siege of Neverwinter - Styling Guide

## Overview

This document describes the responsive layout and styling implementation for the Siege of Neverwinter application, including D&D theming, visual feedback, and WCAG AA accessibility compliance.

## Design System

### Color Palette

The application uses a D&D-inspired dark theme with warm tones and gold accents:

#### Primary Colors
- **Primary**: `#a01010` (Dark red, enhanced for contrast)
- **Secondary**: `#2c1810` (Dark brown)
- **Accent**: `#e5c158` (Gold, WCAG AA compliant)

#### Background Colors
- **Dark**: `#1a1410` (Main background)
- **Medium**: `#2d2520` (Module backgrounds)
- **Light**: `#3d3530` (Headers, cards)
- **Lighter**: `#4d4540` (Hover states)

#### Text Colors (WCAG AA Compliant)
- **Light**: `#f5f5f5` (Primary text, 14:1 contrast ratio)
- **Medium**: `#d0d0d0` (Secondary text, 10:1 contrast ratio)
- **Dim**: `#a0a0a0` (Tertiary text, 6:1 contrast ratio)

#### Status Colors (All WCAG AA Compliant)
- **Success**: `#5cb85c` (5.5:1 contrast ratio)
- **Warning**: `#ffa726` (8:1 contrast ratio)
- **Danger**: `#f55a4e` (5:1 contrast ratio)
- **Info**: `#42a5f5` (5.5:1 contrast ratio)

### Typography

- **Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Base Font Size**: 16px (1rem)
- **Line Height**: 1.6
- **Heading Sizes**: Responsive using `clamp()` for fluid typography

### Spacing System

Consistent spacing using CSS custom properties:
- `--spacing-xs`: 0.25rem (4px)
- `--spacing-sm`: 0.5rem (8px)
- `--spacing-md`: 1rem (16px)
- `--spacing-lg`: 1.5rem (24px)
- `--spacing-xl`: 2rem (32px)

### Border Radius

- `--radius-sm`: 4px (Small elements)
- `--radius-md`: 6px (Medium elements)
- `--radius-lg`: 8px (Large modules)

## Responsive Breakpoints

### Large Desktop (1600px+)
- 4-column grid layout
- Map module spans 2 columns and 2 rows
- Initiative, Monster, and AI modules span 2 rows

### Desktop (1200px - 1599px)
- 3-column grid layout
- Map module spans 2 columns and 2 rows
- Optimal for standard desktop monitors

### Tablet Landscape (900px - 1199px)
- 2-column grid layout
- Map module spans 2 columns
- Reduced header padding

### Tablet Portrait (600px - 899px)
- Single column layout
- All modules stack vertically
- Header controls wrap to new line
- Reduced button sizes

### Mobile (max 599px)
- Single column layout
- Minimal padding and spacing
- Header stacks vertically
- Full-width campaign selector
- Compact module headers

## Visual Feedback

### Hover Effects
- **Buttons**: Gradient shift, shadow increase, 1px upward translation
- **Modules**: Border color change, shadow enhancement, 2px upward translation
- **List Items**: Background gradient shift, left border accent, 2px right translation
- **Badges**: Glow effect increase, scale transformation

### Focus Indicators
- 2px solid accent color outline
- 2px offset for clear visibility
- Applied to all interactive elements
- WCAG 2.1 compliant

### Active States
- Ripple effect on button clicks
- Immediate visual feedback
- Smooth transitions

### Loading States
- Spinning loader with accent color
- Centered with descriptive text
- Smooth animation

### Error/Success States
- Color-coded backgrounds with gradients
- Icon indicators (⚠, ✓, ℹ)
- Clear border and shadow
- Left padding for icon space

## Animations

### Fade In
- Applied to module grid on load
- 0.5s duration, ease-in timing

### Pulse
- Applied to active initiative item
- 2s duration, infinite loop
- Glow effect variation

### Spin
- Applied to loading indicators
- 1s duration, linear timing

### Badge Enter
- Applied to new badges
- 0.3s duration, ease-out timing
- Scale and opacity transition

### Glow
- Applied to important elements
- 2s duration, infinite loop
- Shadow intensity variation

## Accessibility Features

### WCAG AA Compliance
- All text meets 4.5:1 minimum contrast ratio
- Large text meets 3:1 minimum contrast ratio
- Interactive elements have 3:1 contrast with surroundings
- Color is not the only means of conveying information

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Clear focus indicators on all focusable elements
- Logical tab order throughout the application

### Screen Reader Support
- Semantic HTML structure
- ARIA labels on all interactive elements
- Skip to main content link
- `.sr-only` class for screen reader-only content

### Reduced Motion
- Respects `prefers-reduced-motion` media query
- Animations reduced to minimal duration
- No motion for users who prefer reduced motion

### High Contrast Mode
- Respects `prefers-contrast: high` media query
- Enhanced borders and text colors
- Increased contrast ratios

## D&D Theming

### Visual Elements
- Gradient backgrounds for depth
- Gold accent color for important elements
- Warm color palette inspired by medieval fantasy
- Subtle glow effects for magical feel
- Text shadows for depth and readability

### Module Design
- Bordered cards with gradient backgrounds
- Animated top border on hover
- Draggable headers with move cursor
- Collapsible content sections

### Combat Elements
- Color-coded combatant types (PC/NPC/Monster)
- Left border accent for quick identification
- Active combatant pulse animation
- Condition badges with glow effects

### Interactive Elements
- Ripple effect on button clicks
- Smooth hover transitions
- Scale transformations on badges
- Shadow depth changes

## Custom Scrollbars

- Thin scrollbar width (8px)
- Accent color thumb
- Dark background track
- Rounded corners
- Hover state for thumb

## Print Styles

- Hides interactive elements (buttons, toggles)
- Black borders for modules
- White background
- Black text
- Page break avoidance for modules

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- CSS Custom Properties
- CSS Gradients
- CSS Animations
- Media Queries

## Performance Considerations

- Hardware-accelerated transforms
- Efficient CSS selectors
- Minimal repaints and reflows
- Optimized animations
- Lazy loading for heavy content

## Usage Examples

### Adding a New Button
```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-success">Save</button>
```

### Creating a Status Badge
```html
<span class="type-badge type-pc">PC</span>
<span class="type-badge type-npc">NPC</span>
<span class="type-badge type-monster">Monster</span>
```

### Displaying Conditions
```html
<span class="condition-badge" title="Poisoned: Disadvantage on attack rolls and ability checks">
    Poisoned
</span>
```

### Error Messages
```html
<div class="error">
    An error occurred while saving your data.
</div>
```

### Loading State
```html
<div class="loading">
    Loading campaign data...
</div>
```

## Testing

A contrast test file is available at `client/styles/contrast-test.html` to verify WCAG AA compliance for all color combinations.

## Future Enhancements

- Dark/light theme toggle
- Custom color schemes
- Font size adjustment
- Animation speed control
- Additional accessibility options
