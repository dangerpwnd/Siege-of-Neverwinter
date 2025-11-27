# Accessibility Features

This document describes the accessibility features implemented in the Siege of Neverwinter application.

## Overview

The application has been designed with accessibility in mind, following WCAG 2.1 Level AA guidelines. All features are accessible via keyboard navigation and screen readers.

## Keyboard Navigation

### Global Shortcuts

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements
- **Escape**: Close modals, dialogs, and release focus traps
- **Enter/Space**: Activate buttons and button-like elements
- **Arrow Keys**: Navigate within lists, tabs, and menus

### Skip Navigation

- **Skip to Main Content**: Press Tab when the page loads to reveal a "Skip to main content" link that jumps directly to the main application area

### Module Navigation

- **Tab**: Move between modules and their controls
- **Enter/Space**: Toggle module collapse/expand
- **Arrow Keys**: Navigate within module content (lists, options, etc.)

## Screen Reader Support

### ARIA Labels

All interactive elements have appropriate ARIA labels:

- Buttons include descriptive `aria-label` attributes
- Form inputs have associated labels
- Dynamic content regions have `aria-live` attributes
- Module states are announced with `aria-expanded`
- Lists use proper `role` attributes

### Live Regions

The application uses three types of live regions:

1. **Polite Live Region** (`aria-live="polite"`): For non-urgent updates like status messages
2. **Assertive Live Region** (`aria-live="assertive"`): For urgent updates like errors
3. **Status Region** (`role="status"`): For status updates and confirmations

### Semantic HTML

- Proper heading hierarchy (h1, h2, h3, etc.)
- Semantic elements (`<header>`, `<main>`, `<nav>`, `<section>`)
- Proper form structure with labels
- Lists use `<ul>`, `<ol>`, and `<li>` elements

## Visual Accessibility

### Focus Indicators

- All interactive elements have visible focus indicators
- Focus indicators use high-contrast colors (gold on dark background)
- Focus indicators include both outline and box-shadow for visibility
- 3px outline with 2-3px offset for clear visibility

### Color Contrast

All text and interactive elements meet WCAG AA standards:

- Normal text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

### Color Independence

- Information is not conveyed by color alone
- Icons and text labels accompany color-coded elements
- Status indicators use both color and text/icons

## Keyboard-Only Operation

All functionality is available via keyboard:

### Campaign Controls
- **Tab** to campaign selector, then **Arrow Keys** to choose
- **Tab** to buttons, **Enter** to activate

### Initiative Tracker
- **Tab** to navigate between combatants
- **Enter** to select/edit
- **Arrow Keys** to move through list

### Character/NPC Panels
- **Tab** to navigate between characters
- **Enter** to select character
- **Tab** through stats and controls
- **Enter/Space** to modify values

### Condition Manager
- **Tab** to combatant list
- **Arrow Keys** to select combatant
- **Tab** to condition buttons
- **Enter/Space** to apply/remove conditions

### Monster Database
- **Tab** to search field
- **Arrow Keys** to navigate monster list
- **Enter** to select monster
- **Tab** through stat block

### Siege Mechanics
- **Tab** to navigate metrics
- **Arrow Keys** to adjust sliders
- **Tab** to notes area
- **Enter** to add note

### AI Assistant
- **Tab** to message input
- **Enter** to send message
- **Shift + Enter** for new line in message

### City Map
- **Tab** to navigate locations
- **Enter** to select location
- **Arrow Keys** to navigate plot points

## Screen Reader Announcements

The application announces important events:

### On Page Load
- "Siege of Neverwinter Campaign Manager loaded. Use Tab to navigate between modules."

### Module Actions
- "Initiative module expanded/collapsed"
- "Character panel expanded/collapsed"
- etc.

### Data Changes
- "Combatant added to initiative"
- "Character HP updated"
- "Condition applied"
- "Campaign saved successfully"

### Errors
- Error messages are announced immediately with assertive priority
- "Failed to save campaign"
- "Connection error"

## Alternative Text

All non-text content has text alternatives:

### Icons
- Decorative icons use `aria-hidden="true"`
- Functional icons have `aria-label` attributes
- Icon buttons include text alternatives

### Images
- All images have descriptive `alt` text
- Decorative images use empty `alt=""` or `aria-hidden="true"`

### Visual Indicators
- Type badges (PC/NPC/Monster) include text labels
- Condition badges include condition names
- Status indicators include text descriptions

## Reduced Motion

The application respects the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

## High Contrast Mode

The application supports high contrast mode:

```css
@media (prefers-contrast: high) {
    :root {
        --border-color: #ffffff;
        --text-light: #ffffff;
        --bg-dark: #000000;
    }
}
```

## Focus Management

### Focus Traps
- Modals and dialogs trap focus within them
- **Escape** key releases focus trap
- Focus returns to triggering element when closed

### Focus Restoration
- Focus is restored after closing modals
- Focus is maintained during dynamic content updates
- Focus is moved to new content when appropriate

## Form Accessibility

### Labels
- All form inputs have associated labels
- Labels use `for` attribute or wrap inputs
- Required fields are marked with `aria-required="true"`

### Error Messages
- Errors are associated with inputs via `aria-describedby`
- Error messages have `role="alert"`
- Errors are announced to screen readers

### Validation
- Real-time validation feedback
- Clear error messages
- Visual and programmatic error indicators

## Testing

### Screen Reader Testing
The application has been tested with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS)
- TalkBack (Android)

### Keyboard Testing
- All functionality tested with keyboard only
- Tab order is logical and intuitive
- No keyboard traps

### Automated Testing
- Lighthouse accessibility audit
- axe DevTools
- WAVE Web Accessibility Evaluation Tool

## Known Limitations

1. **City Map**: SVG map may have limited screen reader support. Alternative text descriptions are provided.
2. **Drag and Drop**: Module repositioning requires mouse. Keyboard alternatives are provided via settings.
3. **Real-time Updates**: Some real-time updates may interrupt screen reader announcements.

## Future Improvements

1. Add keyboard shortcuts for common actions
2. Implement voice control support
3. Add customizable color themes for different visual needs
4. Improve screen reader descriptions for complex data
5. Add audio cues for important events

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)

## Feedback

If you encounter any accessibility issues, please report them to the development team. We are committed to making this application accessible to all users.
