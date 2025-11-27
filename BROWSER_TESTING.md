# Browser Testing Guide

This document outlines the browser testing strategy and checklist for the Siege of Neverwinter application.

## Supported Browsers

The application should be tested on the following browsers:

### Desktop Browsers
- **Chrome** (latest version)
- **Firefox** (latest version)
- **Edge** (latest version)
- **Safari** (latest version, macOS only)

### Mobile Browsers (Optional)
- **Chrome Mobile** (Android)
- **Safari Mobile** (iOS)

## Testing Checklist

### 1. Core Functionality

Test the following features in each browser:

#### Initiative Tracker
- [ ] Add combatants to initiative
- [ ] Remove combatants from initiative
- [ ] Advance turn (next turn button)
- [ ] Edit initiative values
- [ ] Verify sorting order (descending by initiative)
- [ ] Verify type badges (PC/NPC/Monster) display correctly
- [ ] Verify condition indicators appear

#### Character Panel
- [ ] View character details
- [ ] Update HP values
- [ ] Verify HP zero state indicator
- [ ] View active conditions
- [ ] Create/edit characters

#### Condition Manager
- [ ] Apply conditions to combatants
- [ ] Remove conditions from combatants
- [ ] Verify conditions appear in initiative tracker
- [ ] Test all D&D 5e conditions

#### NPC Panel
- [ ] Create NPCs
- [ ] Edit NPC details
- [ ] Delete NPCs
- [ ] Verify NPC display parity with PCs

#### Monster Database
- [ ] View monster list
- [ ] View monster stat blocks
- [ ] Create monster instances
- [ ] Verify independent HP tracking for instances

#### Siege Mechanics
- [ ] View siege status
- [ ] Update siege values (wall integrity, morale, supplies)
- [ ] Add siege notes with timestamps
- [ ] Add custom siege metrics

#### City Map
- [ ] View location list
- [ ] Click on locations
- [ ] View plot points (lazy loaded)
- [ ] Update location status
- [ ] Add plot points
- [ ] Update plot point status
- [ ] Delete plot points

#### AI Assistant
- [ ] Send messages to AI
- [ ] Receive responses
- [ ] View conversation history
- [ ] Handle API errors gracefully

#### Module System
- [ ] Show/hide modules
- [ ] Resize modules
- [ ] Reposition modules
- [ ] Verify module isolation

#### Persistence
- [ ] Save campaign data
- [ ] Load campaign data
- [ ] Switch campaigns
- [ ] Export/import campaigns

### 2. Performance Testing

#### Load Times
- [ ] Initial page load < 3 seconds
- [ ] API responses < 500ms
- [ ] Initiative sorting is instant
- [ ] Map rendering is smooth

#### Responsiveness
- [ ] UI updates are immediate (debounced API calls)
- [ ] No lag when adding/removing combatants
- [ ] Smooth scrolling
- [ ] No frame drops during animations

#### Memory Usage
- [ ] No memory leaks after extended use
- [ ] Cache size stays within limits
- [ ] Database connections are properly pooled

### 3. Visual Testing

#### Layout
- [ ] Responsive grid layout works correctly
- [ ] Modules arrange properly at different screen sizes
- [ ] No overlapping elements
- [ ] Proper spacing and alignment

#### Styling
- [ ] D&D theme is consistent
- [ ] Colors meet WCAG AA contrast requirements
- [ ] Fonts are readable
- [ ] Icons display correctly

#### Interactive Elements
- [ ] Buttons have hover states
- [ ] Focus indicators are visible
- [ ] Loading spinners appear during async operations
- [ ] Error messages are styled appropriately

### 4. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activate buttons
- [ ] Arrow keys work in lists
- [ ] Escape closes dialogs

#### Screen Reader
- [ ] ARIA labels are present
- [ ] Semantic HTML is used
- [ ] Form labels are associated
- [ ] Status messages are announced

#### Visual Accessibility
- [ ] Color contrast meets WCAG AA
- [ ] Text is resizable
- [ ] Focus indicators are visible
- [ ] Alternative text for icons

### 5. Error Handling

#### Network Errors
- [ ] API timeout handling
- [ ] Connection failure messages
- [ ] Retry logic works
- [ ] Offline mode message

#### Data Validation
- [ ] Invalid input is rejected
- [ ] Error messages are clear
- [ ] Form validation works
- [ ] Negative values are prevented

#### State Corruption
- [ ] Corrupted data is handled gracefully
- [ ] Reset functionality works
- [ ] Export/import as backup

### 6. Cross-Browser Compatibility

Test for browser-specific issues:

#### Chrome
- [ ] All features work
- [ ] Performance is optimal
- [ ] DevTools show no errors

#### Firefox
- [ ] All features work
- [ ] CSS Grid layout renders correctly
- [ ] Fetch API works properly

#### Edge
- [ ] All features work
- [ ] Chromium-based features work
- [ ] No legacy Edge issues

#### Safari
- [ ] All features work
- [ ] Webkit-specific CSS works
- [ ] Fetch API polyfills if needed

## Testing Tools

### Manual Testing
1. Open the application in each browser
2. Follow the checklist above
3. Document any issues found

### Automated Testing
```bash
# Run unit tests
npm test

# Run property-based tests
npm test -- --testPathPattern=property

# Run integration tests
npm test -- --testPathPattern=integration
```

### Performance Testing
1. Open browser DevTools
2. Go to Performance tab
3. Record a session
4. Analyze:
   - Load time
   - Frame rate
   - Memory usage
   - Network requests

### Accessibility Testing
1. Use browser extensions:
   - axe DevTools
   - WAVE
   - Lighthouse
2. Test with screen reader:
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS)

## Known Issues

Document any known browser-specific issues here:

### Chrome
- None currently

### Firefox
- None currently

### Edge
- None currently

### Safari
- None currently

## Reporting Issues

When reporting a browser compatibility issue, include:

1. Browser name and version
2. Operating system
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Screenshots or video
7. Console errors

## Performance Benchmarks

Target performance metrics:

- **Initial Load**: < 3 seconds
- **API Response**: < 500ms
- **Initiative Sort**: < 10ms
- **Map Render**: < 100ms
- **Memory Usage**: < 100MB
- **Cache Size**: < 50 entries

## Optimization Checklist

Verify these optimizations are working:

- [ ] Database connection pooling is active
- [ ] API responses are cached (60s TTL)
- [ ] Debouncing prevents excessive API calls
- [ ] Loading states appear during async operations
- [ ] Map plot points are lazy loaded
- [ ] Initiative uses binary search insertion
- [ ] Database indexes are applied
- [ ] JSONB indexes improve JSON queries

## Testing Schedule

Recommended testing frequency:

- **Before each release**: Full browser testing
- **Weekly**: Smoke testing on primary browsers
- **Monthly**: Full accessibility audit
- **Quarterly**: Performance benchmarking

## Resources

- [MDN Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/Guide/Browser_compatibility)
- [Can I Use](https://caniuse.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web Performance](https://web.dev/performance/)
