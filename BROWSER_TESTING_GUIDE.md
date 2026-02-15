# Browser Testing Guide

## Overview

This guide provides step-by-step instructions for conducting comprehensive browser compatibility testing for the Siege of Neverwinter application.

## Prerequisites

1. Access to the following browsers:
   - Chrome (latest stable)
   - Firefox (latest stable)
   - Edge (latest stable)
   - Safari (latest stable, macOS required)

2. Test environment setup:
   - Application running locally or on test server
   - Sample campaign data loaded
   - API keys configured (for AI assistant testing)
   - Database initialized with test data

## Quick Start

### Automated Feature Detection

1. Open `client/browser-compatibility-test.html` in each browser
2. Click "Run All Tests" button
3. Review results for:
   - JavaScript ES6+ features
   - CSS Grid and Flexbox support
   - Web APIs (Fetch, localStorage, etc.)
   - SVG rendering
   - Drag and drop functionality

### Manual Testing

1. Open the main application (`client/index.html`)
2. Follow the test cases in `BROWSER_COMPATIBILITY_TEST_PLAN.md`
3. Document results using the provided template

## Testing Workflow

### Phase 1: Automated Tests (5 minutes per browser)

1. Open `browser-compatibility-test.html`
2. Verify all tests pass
3. Take screenshot of results
4. Document any failures

### Phase 2: Core Functionality (15 minutes per browser)

Test each major component:

#### Initiative Tracker
```
1. Add 3 combatants (PC, NPC, Monster) with different initiative values
2. Verify they appear in descending order
3. Click "Next Turn" and verify highlighting
4. Change one combatant's initiative
5. Verify automatic re-sorting
6. Remove a combatant
7. Verify order maintained
```

#### Character Panel
```
1. Select a PC from the initiative tracker
2. Verify AC, HP, and saves display correctly
3. Update HP value
4. Verify change reflects immediately
5. Add a condition (e.g., "poisoned")
6. Verify condition appears in panel and tracker
7. Remove the condition
8. Verify it disappears from both locations
```

#### Monster Database
```
1. Open monster database
2. Search for a monster
3. View stat block
4. Create an instance
5. Verify it appears in initiative tracker
6. Create a second instance of same monster
7. Damage one instance
8. Verify other instance HP unchanged
```

#### City Map
```
1. Open city map
2. Click on a location
3. Verify location info displays
4. Add a plot point
5. Update location status
6. Verify visual indicator changes
7. Reload page and verify persistence
```

#### Layout System
```
1. Switch to 2-column layout
2. Verify modules rearrange
3. Switch to 3-column layout
4. Drag a module to new position
5. Expand a module
6. Verify it spans full column width
7. Shrink the module
8. Reload page and verify layout persists
```

### Phase 3: Visual Inspection (10 minutes per browser)

Check for visual issues:

1. **Layout**
   - Modules align properly in grid
   - No overlapping elements
   - Proper spacing and padding
   - Responsive behavior at different window sizes

2. **Typography**
   - Text is readable
   - Font sizes appropriate
   - Line heights comfortable
   - No text overflow

3. **Colors**
   - Sufficient contrast (WCAG AA)
   - Condition indicators visible
   - Status colors distinct
   - Hover states visible

4. **Interactive Elements**
   - Buttons have hover states
   - Focus indicators visible
   - Drag handles visible
   - Click targets adequate size

### Phase 4: Performance Testing (5 minutes per browser)

1. Open browser DevTools
2. Go to Performance/Network tab
3. Reload page and measure:
   - Initial load time (target: < 3 seconds)
   - Time to interactive
   - API response times (target: < 500ms)
4. Test with 20+ combatants in initiative tracker
5. Verify sorting performance (target: < 10ms)

### Phase 5: Accessibility Testing (10 minutes per browser)

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators visible
   - Test Enter/Space on buttons
   - Test Escape to close modals

2. **Screen Reader** (if available)
   - Enable screen reader
   - Navigate through initiative tracker
   - Verify ARIA labels read correctly
   - Test form inputs

3. **Color Contrast**
   - Use browser DevTools or online tool
   - Check all text meets WCAG AA (4.5:1)
   - Check condition indicators
   - Check status colors

## Browser-Specific Testing Notes

### Chrome Testing

Chrome is the reference browser. Test here first.

**Key Areas:**
- CSS Grid layout (excellent support)
- Fetch API (native support)
- Drag and drop (works well)
- DevTools for debugging

**Known Issues:**
- None expected

### Firefox Testing

Firefox has excellent standards support.

**Key Areas:**
- CSS Grid (excellent support, sometimes better than Chrome)
- Flexbox (check min-height behavior)
- SVG rendering (may differ slightly from Chrome)
- Privacy features (may affect localStorage)

**Known Issues:**
- Flexbox min-height calculations may differ
- SVG text rendering may be slightly different

**Testing Tips:**
- Use Firefox DevTools Grid Inspector
- Check console for any warnings
- Test with strict privacy settings

### Edge Testing

Modern Edge is Chromium-based, so similar to Chrome.

**Key Areas:**
- CSS Grid (same as Chrome)
- Fetch API (same as Chrome)
- Drag and drop (same as Chrome)
- Legacy Edge compatibility (if supporting older versions)

**Known Issues:**
- None expected for Chromium-based Edge
- Legacy Edge (pre-Chromium) has limited CSS Grid support

**Testing Tips:**
- Test on Windows 10/11
- Check for any Microsoft-specific behaviors
- Verify compatibility mode doesn't activate

### Safari Testing

Safari requires the most attention due to webkit quirks.

**Key Areas:**
- CSS Grid (good support but some quirks)
- Drag and drop (known issues, may need workarounds)
- Fetch API (CORS handling may differ)
- localStorage (stricter quota limits)
- Webkit-specific CSS properties

**Known Issues:**
- Drag and drop may require additional event handling
- CSS Grid gap property may need -webkit- prefix
- localStorage quota is 5MB (vs 10MB in other browsers)
- Date input styling differs

**Testing Tips:**
- Test on macOS (Safari is macOS/iOS only)
- Check for webkit-specific CSS
- Test drag and drop thoroughly
- Verify localStorage doesn't exceed quota
- Use Safari Web Inspector

**Safari-Specific Workarounds:**

```css
/* CSS Grid gap fallback */
.grid-container {
    display: grid;
    grid-gap: 10px; /* Safari < 12 */
    gap: 10px; /* Modern browsers */
}
```

```javascript
// Drag and drop Safari fix
element.addEventListener('dragstart', (e) => {
    // Safari requires setData to be called
    e.dataTransfer.setData('text/plain', '');
    e.dataTransfer.effectAllowed = 'move';
});
```

## Common Issues and Solutions

### Issue: CSS Grid not working

**Symptoms:** Modules don't arrange in columns

**Check:**
- Browser supports CSS Grid (use compatibility test)
- CSS is loaded correctly
- Grid container has `display: grid`
- Grid template columns defined

**Solution:**
```css
.module-container {
    display: -ms-grid; /* IE 11 */
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
```

### Issue: Drag and drop not working

**Symptoms:** Can't drag modules

**Check:**
- Element has `draggable="true"`
- Drag event listeners attached
- Drop zone has `dragover` event with `preventDefault()`

**Solution:**
```javascript
// Ensure all required events are handled
element.addEventListener('dragstart', handleDragStart);
element.addEventListener('dragend', handleDragEnd);
dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', handleDrop);
```

### Issue: localStorage not persisting

**Symptoms:** Data lost on reload

**Check:**
- Browser allows localStorage (not in private mode)
- No quota exceeded errors
- Data is JSON serializable
- No errors in console

**Solution:**
```javascript
try {
    localStorage.setItem('key', JSON.stringify(data));
} catch (e) {
    if (e.name === 'QuotaExceededError') {
        // Handle quota exceeded
        console.error('localStorage quota exceeded');
    }
}
```

### Issue: Fetch API not working

**Symptoms:** API calls fail

**Check:**
- CORS headers configured on server
- Fetch is supported (use polyfill for old browsers)
- Network tab shows requests
- Response format is correct

**Solution:**
```javascript
// Add error handling
fetch('/api/endpoint')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .catch(error => {
        console.error('Fetch error:', error);
        // Show user-friendly error message
    });
```

## Test Results Documentation

### Template

Create a file named `BROWSER_TEST_RESULTS.md` with results:

```markdown
# Browser Test Results

## Test Date: [Date]
## Tester: [Name]
## Application Version: [Version]

### Chrome [Version]
- **OS:** [OS and version]
- **Status:** ✅ All tests passed / ⚠️ Minor issues / ❌ Critical issues
- **Issues:** [List any issues]
- **Notes:** [Any observations]

### Firefox [Version]
- **OS:** [OS and version]
- **Status:** ✅ All tests passed / ⚠️ Minor issues / ❌ Critical issues
- **Issues:** [List any issues]
- **Notes:** [Any observations]

### Edge [Version]
- **OS:** [OS and version]
- **Status:** ✅ All tests passed / ⚠️ Minor issues / ❌ Critical issues
- **Issues:** [List any issues]
- **Notes:** [Any observations]

### Safari [Version]
- **OS:** [OS and version]
- **Status:** ✅ All tests passed / ⚠️ Minor issues / ❌ Critical issues
- **Issues:** [List any issues]
- **Notes:** [Any observations]

## Summary
- **Total Issues:** [Number]
- **Critical Issues:** [Number]
- **Minor Issues:** [Number]
- **Overall Status:** [Pass/Fail]

## Recommendations
[Any recommendations for fixes or improvements]
```

## Continuous Testing

### Automated Testing

Consider setting up automated browser testing with:
- Selenium WebDriver
- Playwright
- Cypress

### CI/CD Integration

Add browser tests to CI/CD pipeline:
```yaml
# Example GitHub Actions workflow
name: Browser Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm run test:${{ matrix.browser }}
```

## Resources

- [Can I Use](https://caniuse.com/) - Browser feature support tables
- [MDN Web Docs](https://developer.mozilla.org/) - Web standards documentation
- [BrowserStack](https://www.browserstack.com/) - Cross-browser testing platform
- [WebAIM](https://webaim.org/) - Accessibility testing tools
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool

## Checklist

Before marking browser testing complete:

- [ ] Automated tests pass in all browsers
- [ ] All core features work in all browsers
- [ ] Visual inspection completed for all browsers
- [ ] Performance meets targets in all browsers
- [ ] Accessibility tested in all browsers
- [ ] Browser-specific issues documented
- [ ] Critical bugs fixed
- [ ] Test results documented
- [ ] Screenshots captured for each browser
- [ ] Stakeholders notified of any remaining issues
