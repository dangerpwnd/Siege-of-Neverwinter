# Performance Optimization Guide

This document describes the performance optimizations implemented in the Siege of Neverwinter application.

## Database Optimizations

### Connection Pooling

The application uses PostgreSQL connection pooling with optimized settings:

- **Max connections**: 20 (maximum concurrent database connections)
- **Min connections**: 2 (minimum connections kept alive)
- **Idle timeout**: 30 seconds (close idle connections)
- **Connection timeout**: 5 seconds (timeout for new connections)
- **Max uses**: 7500 (recycle connections after 7500 uses)

Configuration is in `database/db.js`.

### Database Indexes

Additional indexes have been created for optimal query performance:

1. **Composite indexes** for common query patterns:
   - `combatants(campaign_id, initiative DESC)` - Fast initiative queries
   - `combatants(campaign_id, type)` - Filter by combatant type
   - `locations(campaign_id, status)` - Filter locations by status

2. **JSONB indexes** for JSON column queries:
   - `monsters.attacks` (GIN index)
   - `monsters.abilities` (GIN index)
   - `siege_state.custom_metrics` (GIN index)

3. **Partial indexes** for specific use cases:
   - Active combatants (current_hp > 0)

To apply these optimizations:

```bash
node database/apply-optimizations.js
```

## Frontend Optimizations

### API Response Caching

The API client implements an LRU (Least Recently Used) cache:

- **Cache size**: 50 entries maximum
- **Default TTL**: 60 seconds
- **Automatic invalidation**: Cache is cleared on mutations

GET requests are automatically cached. Cache is invalidated when:
- POST, PUT, or DELETE operations occur on related resources
- TTL expires
- Cache size limit is reached (oldest entries evicted)

Implementation: `client/js/cache.js`

### Debouncing

Frequent API calls are debounced to reduce server load:

- **Initiative updates**: 500ms debounce
- **Location status updates**: 500ms debounce
- **Other frequent operations**: 300ms default

This means rapid changes (e.g., dragging an initiative slider) only trigger one API call after the user stops interacting.

Implementation: `client/js/debounce.js`

### Lazy Loading

The city map implements lazy loading for plot points:

- Location list loads without plot points
- Plot points are loaded only when a location is selected
- Plot points are cached per location

This reduces initial load time and memory usage.

### Loading States

Visual loading indicators provide user feedback:

- **Global overlay**: For full-page operations
- **Component-level**: For individual module updates
- **API integration**: Automatic loading state tracking

Implementation: `client/js/loading.js`

## Initiative Tracker Optimization

The initiative tracker uses an optimized sorting algorithm:

- **Algorithm**: JavaScript native sort (Timsort, O(n log n))
- **Trigger**: Only re-sorts when initiative values change
- **Debouncing**: API updates are debounced to prevent excessive calls

## Performance Monitoring

A performance monitoring utility tracks operation timing:

```javascript
import performance from './performance.js';

// Measure an operation
await performance.measure('loadCombatants', async () => {
    return await api.getCombatants(campaignId);
});

// View metrics
performance.logSummary();
```

Operations taking longer than 100ms are logged as warnings.

## Best Practices

### For Developers

1. **Use caching for read-heavy operations**
   ```javascript
   // Cache for 5 minutes
   await api.request('/locations', { cacheTTL: 300000 });
   ```

2. **Debounce frequent updates**
   ```javascript
   import { debounce } from './debounce.js';
   const debouncedSave = debounce(saveFunction, 500);
   ```

3. **Show loading states**
   ```javascript
   import loading from './loading.js';
   loading.show('component-id', 'Loading data...');
   // ... perform operation
   loading.hide('component-id');
   ```

4. **Monitor performance**
   ```javascript
   import performance from './performance.js';
   performance.startTimer('operation');
   // ... perform operation
   performance.endTimer('operation');
   ```

### Database Query Optimization

1. **Use indexes**: Ensure queries use existing indexes
2. **Limit results**: Use LIMIT for large result sets
3. **Avoid N+1 queries**: Use JOINs or batch queries
4. **Use EXPLAIN**: Analyze query plans for slow queries

Example:
```sql
EXPLAIN ANALYZE 
SELECT * FROM combatants 
WHERE campaign_id = 1 
ORDER BY initiative DESC;
```

## Browser Compatibility

The application has been tested in:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers support the performance APIs used.

## Monitoring Performance

### Client-Side

Open browser DevTools:

1. **Network tab**: Monitor API call frequency and response times
2. **Performance tab**: Record and analyze runtime performance
3. **Console**: View performance warnings for slow operations

### Server-Side

Database query logging is enabled by default in `database/db.js`:

```
Executed query { text: 'SELECT * FROM combatants...', duration: 15, rows: 10 }
```

Monitor for queries taking longer than 100ms.

## Future Optimizations

Potential improvements for future releases:

1. **Service Worker**: Cache static assets and API responses offline
2. **Virtual scrolling**: For large lists (100+ combatants)
3. **Web Workers**: Offload heavy computations
4. **IndexedDB**: Client-side database for offline support
5. **GraphQL**: Reduce over-fetching with precise queries
6. **CDN**: Serve static assets from CDN
7. **Compression**: Enable gzip/brotli compression
8. **Code splitting**: Load modules on demand

## Troubleshooting

### Slow Database Queries

1. Check if indexes are being used:
   ```sql
   EXPLAIN ANALYZE SELECT ...;
   ```

2. Rebuild indexes if needed:
   ```sql
   REINDEX TABLE combatants;
   ```

3. Update table statistics:
   ```sql
   ANALYZE combatants;
   ```

### High Memory Usage

1. Clear API cache:
   ```javascript
   import cache from './cache.js';
   cache.clear();
   ```

2. Reduce cache size:
   ```javascript
   // In cache.js constructor
   constructor(maxSize = 25, defaultTTL = 30000)
   ```

### Slow UI Updates

1. Check for excessive re-renders in browser DevTools
2. Verify debouncing is working
3. Monitor network tab for redundant API calls
4. Use performance monitoring to identify bottlenecks

## Performance Metrics

Target performance metrics:

- **Initial page load**: < 2 seconds
- **API response time**: < 200ms (average)
- **Database query time**: < 50ms (average)
- **UI interaction response**: < 100ms
- **Initiative sort**: < 10ms (for 50 combatants)

Monitor these metrics regularly to ensure optimal performance.
