# System Design Document

## 1. Caching Strategy

### Frontend Caching with React Query

**Cache Configuration:**
- **Projects List:** `staleTime: 30s`, `gcTime: 5min`
- **Project Detail:** `staleTime: 20s`, `gcTime: 3min`

**How It Works:**

1. **Initial Load:** Data fetched from API, cached in memory
2. **Within Stale Time:** Cached data served immediately (no API call)
3. **After Stale Time:** Background refetch while showing cached data
4. **After GC Time:** Data removed from memory, fresh fetch on next request

**Cache Invalidation:**

Mutations trigger cache invalidation:
```typescript
// After creating/updating task
queryClient.invalidateQueries({ queryKey: ['project', id] });
queryClient.invalidateQueries({ queryKey: ['projects'] });
```

**Sync Issues:**

If cache and backend get out of sync:

1. **Optimistic Updates:** UI updates immediately, rolls back on error
2. **Auto-Refetch:** Stale data triggers background refresh
3. **Manual Refresh:** User can refresh page to force sync
4. **Error Recovery:** Failed mutations revert cache to previous state

**Benefits:**
- Instant UI updates (perceived performance)
- Reduced API calls (cost savings)
- Offline-first experience (stale data available)

---

## 2. Failure Handling

### Export Job Failure from Frontend Perspective

**Current Implementation:**

1. User clicks "Export Project"
2. Frontend calls `POST /api/projects/:id/export`
3. Receives export ID immediately
4. Polls `GET /api/exports/:id` every 1 second
5. On `COMPLETED`: auto-downloads file
6. On `FAILED`: shows alert with error

**Failure Scenarios:**

**Scenario 1: API Call Fails**
- Network error or 500 response
- UI shows error toast
- Export button remains enabled
- User can retry immediately

**Scenario 2: Export Processing Fails**
- Status changes to `FAILED`
- Alert shows: "Export failed. Please try again."
- Button resets to "Export Project"
- User can retry with new export

**Scenario 3: Polling Timeout**
- If export takes too long (>60 seconds)
- Stop polling, keep status UI visible
- User can check exports page for status

**Improvement Ideas:**

1. **Exponential Backoff:** Increase polling interval over time (1s → 2s → 5s)
2. **WebSocket Updates:** Push notification when export completes (no polling)
3. **Progress Indicator:** Show percentage if backend supports it
4. **Retry Button:** In-place retry without starting new export
5. **Background Processing:** Allow user to navigate away, show notification on completion

---

## 3. Improvements with 4 More Hours

**Priority Enhancement: Advanced Task Management UI**

### Why This Feature

Current task management is functional but basic. A Kanban board with drag-and-drop would significantly improve UX and demonstrate advanced React skills.

### Implementation Plan (4 hours)

**Hour 1: Kanban Board Layout**
- Three columns: To Do, In Progress, Done
- CSS Grid/Flexbox layout
- Responsive design
- Visual task cards with avatars/icons

**Hour 2: Drag-and-Drop**
- Integrate `@dnd-kit/core` library
- Implement draggable task cards
- Drop zones for each status column
- Visual feedback during drag (shadows, highlights)

**Hour 3: State Management & API Integration**
- Update task status on drop
- Optimistic updates with React Query
- Rollback animation if API fails
- Smooth transitions between columns

**Hour 4: Enhanced Features**
- Multi-select for bulk operations
- Keyboard shortcuts (arrow keys to move tasks)
- Quick edit (double-click card to edit inline)
- Filter/search within board
- Task count badges on columns

### Expected Outcome

- Intuitive task management (like Trello/Jira)
- Zero learning curve for new users
- Faster task updates (drag vs dropdown)
- Better visual overview of project status
- Demonstrates advanced React patterns

### Technical Benefits

- **Performance:** Virtualized list for 100+ tasks
- **Accessibility:** Keyboard navigation support
- **Mobile:** Touch gestures for drag-and-drop
- **State Management:** Complex optimistic updates

### Alternative Improvements

1. **Task Dependencies:** Gantt chart view (too complex for 4h)
2. **Time Tracking:** Add timers to tasks (useful but niche)
3. **Bulk Operations:** Select multiple tasks for status change (useful but less impactful)
4. **Advanced Filters:** Multiple filter criteria (good for power users)

**Conclusion:** Kanban board provides the most visual impact and UX improvement while showcasing modern React development skills.
