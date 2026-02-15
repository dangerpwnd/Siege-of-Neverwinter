# Browser Compatibility Test Plan

## Test Environment

- **Chrome**: Latest stable version
- **Firefox**: Latest stable version  
- **Edge**: Latest stable version
- **Safari**: Latest stable version (macOS)

## Testing Methodology

Each browser will be tested for:
1. Core functionality (all features work as expected)
2. Visual rendering (layout, styling, responsiveness)
3. JavaScript compatibility (ES6+ features, APIs)
4. Performance (load times, responsiveness)
5. Browser-specific APIs (localStorage, fetch, etc.)

## Test Cases

### 1. Initiative Tracker
- [ ] Add combatants with different types (PC/NPC/Monster)
- [ ] Verify descending initiative order
- [ ] Advance turn and verify highlighting
- [ ] Remove combatants and verify order maintained
- [ ] Update initiative values and verify re-sorting
- [ ] Verify visual type indicators display correctly

### 2. Character Panel
- [ ] Display character details (AC, HP, saves)
- [ ] Update HP values
- [ ] Verify zero HP visual indicator
- [ ] Display active conditions
- [ ] Create/edit characters
- [ ] Verify data persists across page reload

### 3. Condition Manager
- [ ] Apply conditions to combatants
- [ ] Remove conditions from combatants
- [ ] Verify condition indicators in initiative tracker
- [ ] Test all D&D 5e conditions
- [ ] Verify condition styling/contrast

### 4. NPC Panel
- [ ] Create NPCs
- [ ] Display NPC details matching PC panel
- [ ] Apply conditions to NPCs
- [ ] Delete NPCs and verify cleanup
- [ ] Verify visual distinction from PCs

### 5. Monster Database
- [ ] View monster list
- [ ] Search/filter monsters
- [ ] Display monster stat blocks
- [ ] Create monster instances
- [ ] Verify independent HP tracking for multiple instances
- [ ] Verify monster data persistence

### 6. Siege Mechanics
- [ ] Display siege status
- [ ] Update siege values (wall integrity, morale, supplies)
- [ ] Add timestamped notes
- [ ] Add custom siege metrics
- [ ] Verify persistence across sessions

### 7. AI Assistant
- [ ] Send messages to AI
- [ ] Display AI responses
- [ ] Maintain conversation history
- [ ] Handle API errors gracefully
- [ ] Verify API key configuration

### 8. City Map
- [ ] Render SVG map
- [ ] Click locations and display info
- [ ] Add plot points
- [ ] Update location status
- [ ] Verify visual status indicators
- [ ] Test map interactivity

### 9. Module System
- [ ] Toggle module visibility
- [ ] Verify visibility persistence
- [ ] Resize modules
- [ ] Reposition modules
- [ ] Verify module isolation

### 10. Layout Configuration
- [ ] Switch between 2, 3, 4 column layouts
- [ ] Drag and drop modules
- [ ] Expand modules to full column width
- [ ] Shrink expanded modules
- [ ] Verify layout persistence

### 11. Data Persistence
- [ ] Save application state
- [ ] Reload and verify state restoration
- [ ] Test export/import functionality
- [ ] Verify database operations
- [ ] Test campaign switching

### 12. Responsive Design
- [ ] Test at 1920x1080 (desktop)
- [ ] Test at 1366x768 (laptop)
- [ ] Test at 1024x768 (tablet landscape)
- [ ] Test at 768x1024 (tablet portrait)
- [ ] Verify CSS Grid layout adapts

### 13. Accessibility
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatibility

### 14. Performance
- [ ] Initial page load < 3 seconds
- [ ] API responses < 500ms
- [ ] Initiative sorting < 10ms
- [ ] Map rendering < 100ms
- [ ] No memory leaks during extended use

## Browser-Specific Considerations

### Chrome
- Test CSS Grid layout
- Test Fetch API
- Test localStorage
- Test drag and drop API
- Test SVG rendering

### Firefox
- Test CSS Grid layout (Firefox has excellent Grid support)
- Test Fetch API
- Test localStorage
- Test drag and drop API
- Test SVG rendering
- Verify flexbox behavior

### Edge
- Test CSS Grid layout (Chromium-based)
- Test Fetch API
- Test localStorage
- Test drag and drop API
- Test SVG rendering
- Verify compatibility with legacy Edge features

### Safari
- Test CSS Grid layout (Safari has some Grid quirks)
- Test Fetch API
- Test localStorage
- Test drag and drop API (Safari has known issues)
- Test SVG rendering
- Verify webkit-specific CSS properties
- Test on macOS (Safari is macOS/iOS only)

## Known Browser Issues to Watch For

### Safari
- Drag and drop may require additional event handling
- CSS Grid gap property may need -webkit- prefix
- Fetch API CORS handling may differ
- localStorage quota limits are stricter

### Firefox
- CSS Grid subgrid support (if used)
- Flexbox min-height behavior differs
- SVG text rendering may differ slightly

### Edge (Legacy)
- CSS Grid support limited in pre-Chromium versions
- Fetch API polyfill may be needed
- localStorage implementation differs

## Test Results Template

```
Browser: [Browser Name] [Version]
OS: [Operating System]
Date: [Test Date]
Tester: [Name]

| Feature | Status | Notes |
|---------|--------|-------|
| Initiative Tracker | ✅/❌ | |
| Character Panel | ✅/❌ | |
| Condition Manager | ✅/❌ | |
| NPC Panel | ✅/❌ | |
| Monster Database | ✅/❌ | |
| Siege Mechanics | ✅/❌ | |
| AI Assistant | ✅/❌ | |
| City Map | ✅/❌ | |
| Module System | ✅/❌ | |
| Layout Configuration | ✅/❌ | |
| Data Persistence | ✅/❌ | |
| Responsive Design | ✅/❌ | |
| Accessibility | ✅/❌ | |
| Performance | ✅/❌ | |

Critical Issues:
- [List any blocking issues]

Minor Issues:
- [List any non-blocking issues]

Browser-Specific Notes:
- [Any browser-specific observations]
```

## Automated Testing Support

While manual testing is required for visual and UX verification, automated tests can help:

```javascript
// Browser detection for conditional logic
const browser = {
  isChrome: /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
  isFirefox: /Firefox/.test(navigator.userAgent),
  isEdge: /Edg/.test(navigator.userAgent),
  isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
};

// Feature detection (preferred over browser detection)
const features = {
  hasGrid: CSS.supports('display', 'grid'),
  hasFetch: typeof fetch !== 'undefined',
  hasLocalStorage: typeof localStorage !== 'undefined',
  hasDragDrop: 'draggable' in document.createElement('div')
};
```

## Testing Workflow

1. **Setup**: Ensure test data is loaded (sample campaign, characters, monsters)
2. **Execute**: Run through all test cases systematically
3. **Document**: Record results using the template above
4. **Report**: Create issues for any bugs found
5. **Verify**: Re-test after fixes are applied

## Success Criteria

- All core features work in all tested browsers
- No critical bugs in any browser
- Visual consistency across browsers (minor differences acceptable)
- Performance meets targets in all browsers
- Accessibility features work in all browsers
