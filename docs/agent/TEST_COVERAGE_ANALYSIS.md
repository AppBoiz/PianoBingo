# PianoBingo Test Coverage Analysis & Recommendations

**Generated:** 2026-02-24  
**Purpose:** Identify test gaps and recommend additional tests for migration completion

---

## Executive Summary

**Current Test Coverage:** MINIMAL - Only 1 test file exists  
**Risk Level:** HIGH - Critical user workflows lack automated validation  
**Migration Readiness:** INCOMPLETE - Insufficient coverage for safe legacy removal

### Current State
- ✅ **1 test:** Offline PDF asset caching (service worker precache validation)
- ❌ **0 tests:** Core user workflows (game start, song drawing, pack management)
- ❌ **0 tests:** Data persistence (IndexedDB, localStorage)
- ❌ **0 tests:** React vs legacy parity validation
- ❌ **0 tests:** Mobile-specific behavior
- ❌ **0 tests:** PDF rendering lifecycle

---

## 1. Current Test Coverage Summary

### Existing Test: `offline-pdf.spec.ts`
**What it tests:**
- Service worker controller activation
- PDF assets present in sw-manifest.json
- Assets cached by service worker
- Offline fetch of cached assets returns 200

**What it does NOT test:**
- PDF actually rendering in viewer
- Worker thread initialization
- User interaction with PDF (page navigation)
- Full offline game workflow

**Assessment:** Good foundation for caching, but insufficient for migration validation.

---

## 2. Critical Gaps in Test Coverage (HIGH RISK)

### 2.1 Core Game Flow (UNTESTED - CRITICAL)
**Risk:** Migration could break the primary user journey
- ❌ Start new game workflow (Welcome → Pack Select → PDF Reader)
- ❌ Song drawing logic (75-song pack, no duplicates until pack exhausted)
- ❌ Next/previous song navigation during gameplay
- ❌ Game history tracking
- ❌ End game state management

### 2.2 Data Persistence (UNTESTED - CRITICAL)
**Risk:** Data loss or corruption during migration
- ❌ IndexedDB initialization and seeding
- ❌ Pack CRUD operations (create, read, update, delete)
- ❌ Song CRUD operations
- ❌ Game state persistence across page reloads
- ❌ localStorage gameState schema compliance
- ❌ Legacy data migration/compatibility

### 2.3 Pack Management (UNTESTED - HIGH)
**Risk:** Users cannot manage their song libraries
- ❌ Create new pack
- ❌ Rename pack
- ❌ Delete pack
- ❌ Edit pack (add/remove songs)
- ❌ Drag-and-drop song reordering
- ❌ 75-song validation constraint
- ❌ Pack selection persistence

### 2.4 Song Management (UNTESTED - HIGH)
**Risk:** Users cannot manage songs or PDFs
- ❌ Create new song
- ❌ Rename song
- ❌ Delete song
- ❌ Upload PDF to song
- ❌ Remove PDF from song
- ❌ View song PDF preview
- ❌ PDF storage in IndexedDB

### 2.5 PDF Rendering (PARTIALLY TESTED - MEDIUM)
**Risk:** PDF viewer fails in production
- ✅ Assets cached offline
- ❌ pdfjs-dist worker initialization
- ❌ PDF decode from base64
- ❌ PDF page rendering to canvas
- ❌ Page navigation (prev/next)
- ❌ Error handling (corrupt PDF, missing PDF)

### 2.6 Offline Behavior (MINIMALLY TESTED - HIGH)
**Risk:** App fails when offline (core feature)
- ✅ Assets served from cache
- ❌ Complete game playable offline
- ❌ Pack/song management offline
- ❌ IndexedDB operations offline
- ❌ Navigation works offline
- ❌ Service worker update/lifecycle

### 2.7 Mobile Behavior (UNTESTED - HIGH)
**Risk:** Mobile users experience broken UI/UX
- ❌ Touch interactions (tap, swipe)
- ❌ Mobile viewport layouts
- ❌ Sticky headers/footers on mobile
- ❌ Virtual keyboard interaction
- ❌ Drag-and-drop on touch devices
- ❌ PDF zoom/pan on mobile

### 2.8 React vs Legacy Parity (UNTESTED - CRITICAL)
**Risk:** Migration introduces regressions
- ❌ Page-by-page behavior comparison
- ❌ Navigation flow equivalence
- ❌ Data format compatibility
- ❌ Storage schema consistency
- ❌ UI state preservation
- ❌ Known gaps (GameHistory, SongView, PdfReader contextual UI)

---

## 3. Recommended Test Scenarios by Priority

### PRIORITY 1: CRITICAL (Must have before legacy removal)

#### 3.1 Core Game Flow E2E
```typescript
// Test file: tests/game-flow.spec.ts
describe('Core Game Flow', () => {
  test('complete game workflow: start to end', async ({ page }) => {
    // 1. Welcome page loads
    // 2. Click "New Game"
    // 3. Pack Select: choose pack
    // 4. Click "Start Game"
    // 5. PDF Reader: verify PDF renders
    // 6. Click "Next Song" multiple times
    // 7. Verify no duplicate songs
    // 8. Click "Game History" - verify shown songs
    // 9. Click "End Game" - return to welcome
    // 10. Verify game state cleared
  })
  
  test('game state persists across page reload', async ({ page }) => {
    // Start game, reload page, verify state restored
  })
  
  test('previous song navigation works correctly', async ({ page }) => {
    // Draw multiple songs, go back, verify correct song shown
  })
})
```

#### 3.2 IndexedDB Persistence
```typescript
// Test file: tests/data-persistence.spec.ts
describe('IndexedDB Operations', () => {
  test('database initializes with default packs/songs', async ({ page }) => {
    // Verify BASE_PACK_DATA and BASE_SONG_DATA seeded
  })
  
  test('pack CRUD operations persist correctly', async ({ page }) => {
    // Create pack, reload, verify exists
    // Rename pack, reload, verify updated
    // Delete pack, reload, verify removed
  })
  
  test('song CRUD operations persist correctly', async ({ page }) => {
    // Similar to pack CRUD
  })
  
  test('PDF upload stores in IndexedDB', async ({ page }) => {
    // Upload PDF, verify base64 stored, verify retrieval
  })
  
  test('versioning increments on save', async ({ page }) => {
    // Save entity, check version++
  })
})
```

#### 3.3 localStorage Game State
```typescript
// Test file: tests/game-state.spec.ts
describe('Game State Management', () => {
  test('selectPack updates gameState.selectedSongPackId', async ({ page }) => {
    // Select pack, verify localStorage updated
  })
  
  test('generateSong adds to shownSongIds', async ({ page }) => {
    // Draw song, verify shownSongIds array grows
  })
  
  test('generateSong never repeats until pack exhausted', async ({ page }) => {
    // Draw all 75 songs, verify all unique
  })
  
  test('clearGameState removes localStorage key', async ({ page }) => {
    // Clear, verify gameState removed
  })
  
  test('startNewGame resets to default state', async ({ page }) => {
    // Start game, play songs, start new, verify reset
  })
})
```

#### 3.4 Offline Gameplay
```typescript
// Test file: tests/offline-complete-workflow.spec.ts
describe('Complete Offline Workflow', () => {
  test('full game playable offline', async ({ page, context }) => {
    // 1. Load app online, wait for SW active
    // 2. Go offline
    // 3. Play complete game (welcome → pack → songs)
    // 4. Verify all PDFs render
    // 5. Verify navigation works
  })
  
  test('pack management works offline', async ({ page, context }) => {
    // Load online, go offline, manage packs
  })
  
  test('song management works offline', async ({ page, context }) => {
    // Load online, go offline, manage songs (except upload)
  })
})
```

---

### PRIORITY 2: HIGH (Should have for migration confidence)

#### 3.5 Pack Management E2E
```typescript
// Test file: tests/pack-management.spec.ts
describe('Pack Management', () => {
  test('create new pack', async ({ page }) => {
    // Click Create New, verify pack appears
  })
  
  test('rename pack inline', async ({ page }) => {
    // Click input, edit, blur, verify saved
  })
  
  test('delete pack removes from list', async ({ page }) => {
    // Delete, verify gone from UI and DB
  })
  
  test('edit pack opens PackEdit page', async ({ page }) => {
    // Click edit button, verify navigation
  })
})
```

#### 3.6 Pack Edit E2E
```typescript
// Test file: tests/pack-edit.spec.ts
describe('Pack Edit', () => {
  test('displays current pack songs', async ({ page }) => {
    // Load pack, verify songs shown in order
  })
  
  test('toggle song in/out of pack', async ({ page }) => {
    // Click song row, verify checkbox toggles
  })
  
  test('song counter shows X/75', async ({ page }) => {
    // Verify counter updates on toggle
  })
  
  test('OK button disabled until 75 songs selected', async ({ page }) => {
    // Verify disabled state, select 75, verify enabled
  })
  
  test('drag and drop reorders songs', async ({ page }) => {
    // Drag song to new position, save, reload, verify order
  })
  
  test('save persists pack changes', async ({ page }) => {
    // Edit pack, save, reload, verify changes persist
  })
})
```

#### 3.7 Song Management E2E
```typescript
// Test file: tests/song-management.spec.ts
describe('Song Management', () => {
  test('create new song', async ({ page }) => {
    // Click New Song, verify appears with "New Song" title
  })
  
  test('rename song inline', async ({ page }) => {
    // Edit title, blur, verify saved
  })
  
  test('delete song removes from list', async ({ page }) => {
    // Delete, verify gone
  })
  
  test('upload PDF to song', async ({ page }) => {
    // Upload file, verify UI updates to "View" + "Remove PDF"
  })
  
  test('remove PDF from song', async ({ page }) => {
    // Remove, verify UI updates to "Upload PDF"
  })
  
  test('view song opens SongView', async ({ page }) => {
    // Click View, verify navigation + PDF renders
  })
})
```

#### 3.8 PDF Rendering Lifecycle
```typescript
// Test file: tests/pdf-rendering.spec.ts
describe('PDF Rendering', () => {
  test('PDFViewer renders first page on mount', async ({ page }) => {
    // Load PDF, verify canvas element, verify content drawn
  })
  
  test('page navigation prev/next works', async ({ page }) => {
    // Click next, verify page 2, click prev, verify page 1
  })
  
  test('page counter shows current/total', async ({ page }) => {
    // Verify "1 / N" display
  })
  
  test('PDF scales to container width', async ({ page }) => {
    // Resize viewport, verify canvas resizes
  })
  
  test('handles missing PDF gracefully', async ({ page }) => {
    // Load song with null pdfUrl, verify fallback message
  })
  
  test('worker loads from bundled asset', async ({ page }) => {
    // Verify worker URL is local (not CDN)
  })
})
```

#### 3.9 Navigation Flow
```typescript
// Test file: tests/navigation.spec.ts
describe('Navigation', () => {
  test('all page transitions work', async ({ page }) => {
    // Test every loadPage() call from every page
  })
  
  test('back buttons return to correct page', async ({ page }) => {
    // Verify back navigation consistency
  })
  
  test('browser back button works', async ({ page }) => {
    // Navigate forward, press back, verify correct page
  })
  
  test('direct URL navigation works', async ({ page }) => {
    // Navigate to /pack-edit directly, verify loads
  })
})
```

---

### PRIORITY 3: MEDIUM (Nice to have for production readiness)

#### 3.10 Mobile Viewport Testing
```typescript
// Test file: tests/mobile-viewport.spec.ts
describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE
  
  test('welcome page layout on mobile', async ({ page }) => {
    // Verify buttons, logo, piano banner layout
  })
  
  test('pack edit drag-and-drop on touch', async ({ page }) => {
    // Simulate touch drag gesture
  })
  
  test('PDF swipe navigation on mobile', async ({ page }) => {
    // Swipe left/right to change PDF pages
  })
  
  test('sticky footer buttons remain visible', async ({ page }) => {
    // Scroll, verify footer stays at bottom
  })
  
  test('header remains fixed on scroll', async ({ page }) => {
    // Scroll content, verify header position
  })
})
```

#### 3.11 Edge Cases & Error Handling
```typescript
// Test file: tests/edge-cases.spec.ts
describe('Edge Cases', () => {
  test('handles empty pack (0 songs)', async ({ page }) => {
    // Create pack, try to play, verify error message
  })
  
  test('handles pack with < 75 songs', async ({ page }) => {
    // Create pack with 10 songs, verify OK disabled
  })
  
  test('handles corrupt PDF data', async ({ page }) => {
    // Load song with invalid base64, verify error handling
  })
  
  test('handles missing BASE_PACK_DATA', async ({ page }) => {
    // Start fresh DB, verify graceful fallback
  })
  
  test('handles localStorage quota exceeded', async ({ page }) => {
    // Fill localStorage, verify error handling
  })
  
  test('handles IndexedDB quota exceeded', async ({ page }) => {
    // Upload many large PDFs, verify error handling
  })
})
```

#### 3.12 Service Worker Lifecycle
```typescript
// Test file: tests/service-worker-lifecycle.spec.ts
describe('Service Worker', () => {
  test('SW installs and activates', async ({ page }) => {
    // Load app, verify SW registered and active
  })
  
  test('SW updates on new deployment', async ({ page }) => {
    // Simulate SW update, verify new SW takes over
  })
  
  test('SW caches all critical assets', async ({ page }) => {
    // Verify sw-manifest.json completeness
  })
  
  test('SW serves from cache first for assets', async ({ page }) => {
    // Verify CacheFirst strategy for /assets/
  })
  
  test('SW uses NetworkFirst for pages', async ({ page }) => {
    // Verify NetworkFirst strategy
  })
})
```

---

### PRIORITY 4: LOW (Regression prevention for production)

#### 3.13 React vs Legacy Parity
```typescript
// Test file: tests/legacy-parity.spec.ts
describe('React vs Legacy Parity', () => {
  test('WelcomePage matches legacy behavior', async ({ page }) => {
    // Load both, compare state transitions
  })
  
  test('PackSelect matches legacy behavior', async ({ page }) => {
    // Compare pack selection + game start
  })
  
  test('PackManagement matches legacy CRUD', async ({ page }) => {
    // Compare all pack operations
  })
  
  test('PackEdit matches legacy editing', async ({ page }) => {
    // Compare song selection, ordering, save
  })
  
  test('SongManagement matches legacy CRUD', async ({ page }) => {
    // Compare all song operations
  })
  
  test('PdfReader matches legacy gameplay', async ({ page }) => {
    // Compare PDF rendering, navigation, controls
  })
  
  // NOTE: GameHistory and SongView have known parity gaps (documented)
})
```

#### 3.14 Visual Regression
```typescript
// Test file: tests/visual-regression.spec.ts
describe('Visual Regression', () => {
  test('WelcomePage screenshot matches baseline', async ({ page }) => {
    // Compare screenshot to saved baseline
  })
  
  test('PackSelect screenshot matches baseline', async ({ page }) => {
    // Compare screenshot
  })
  
  // ... for each page
})
```

#### 3.15 Performance
```typescript
// Test file: tests/performance.spec.ts
describe('Performance', () => {
  test('page load under 3 seconds', async ({ page }) => {
    // Measure first contentful paint
  })
  
  test('PDF renders under 2 seconds', async ({ page }) => {
    // Measure PDF render time
  })
  
  test('pack with 1000 songs loads efficiently', async ({ page }) => {
    // Stress test large data sets
  })
  
  test('app bundle size under 500KB', async ({ page }) => {
    // Verify built assets size
  })
})
```

---

## 4. Specific Test Cases for Migration Validation

### 4.1 Known Gap: GameHistory
**Current State:** Simplified (shows current game state only)  
**Legacy State:** 75-cell visual grid of all shown songs

**Test Needed:**
```typescript
test('GameHistory displays 75-cell grid', async ({ page }) => {
  // Start game, draw 10 songs
  // Navigate to game history
  // Verify 75 cells rendered
  // Verify 10 cells filled with song titles
  // Verify 65 cells empty
})
```

### 4.2 Known Gap: SongView Navigation
**Current State:** Next/Prev + Back to Welcome  
**Legacy State:** Back to Song Management (unclear if Next/Prev intended)

**Test Needed:**
```typescript
test('SongView back navigation returns to song management', async ({ page }) => {
  // Navigate: Welcome → Song Management → View Song
  // Click Back
  // Verify returned to Song Management
})
```

### 4.3 Known Gap: PdfReader Contextual UI
**Current State:** Missing song title, pack progress  
**Legacy State:** Shows "Song X of Y" and song title in header

**Test Needed:**
```typescript
test('PdfReader displays song title and progress', async ({ page }) => {
  // Start game, draw song 5
  // Verify header shows song title
  // Verify header shows "5 / 75" or similar
})
```

### 4.4 Known Gap: WelcomePage Game State Init
**Current State:** TODO comment, startNewGame not called  
**Legacy State:** Calls startNewGame before Pack Select navigation

**Test Needed:**
```typescript
test('WelcomePage initializes game state on New Game', async ({ page }) => {
  // Click New Game
  // Verify localStorage gameState created with defaults
  // Verify shownSongIds is empty array
})
```

---

## 5. Browser/Device Coverage Considerations

### 5.1 Browser Coverage (Playwright Config)
**Current:** Uses default Playwright browsers  
**Recommended:**
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
})
```

### 5.2 Viewport Coverage
**Recommended Test Viewports:**
- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024 (iPad)
- Mobile: 375x667 (iPhone SE), 390x844 (iPhone 12), 360x800 (Android)

### 5.3 Network Conditions
**Recommended Tests:**
- Online (fast 3G, 4G, WiFi simulation)
- Offline (complete)
- Slow 3G (large PDF loading)
- Flaky connection (intermittent offline)

### 5.4 Storage States
**Recommended Tests:**
- Fresh install (empty DB)
- Existing user (populated DB with legacy schema)
- Multiple packs and songs
- Large PDFs (storage quota testing)

---

## 6. Test Infrastructure Recommendations

### 6.1 Test Utilities to Create
```typescript
// tests/helpers/fixtures.ts
export const testPack = {
  packId: 999,
  packName: 'Test Pack',
  songs: [1, 2, 3, ..., 75], // 75 songs
  version: 1,
}

export const testSong = {
  songId: 999,
  title: 'Test Song',
  pdfUrl: 'JVBERi0xLjQK...', // minimal valid PDF base64
  version: 1,
}

export async function seedTestData(page) {
  // Helper to seed DB with test data
}

export async function clearTestData(page) {
  // Helper to clear DB after test
}
```

### 6.2 Page Object Pattern
```typescript
// tests/pages/WelcomePage.ts
export class WelcomePage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/')
  }
  
  async clickNewGame() {
    await this.page.click('button:has-text("New Game")')
  }
  
  async clickManageSongs() {
    await this.page.click('button:has-text("Manage Songs")')
  }
  
  // ... more helpers
}
```

### 6.3 Custom Assertions
```typescript
// tests/helpers/assertions.ts
export async function assertPDFRendered(page: Page) {
  // Verify canvas exists and has content
  const canvas = await page.locator('#pdf-viewer canvas')
  await expect(canvas).toBeVisible()
  // Check canvas has drawn content (not blank)
  const hasContent = await canvas.evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, c.width, c.height)
    return imageData.data.some(pixel => pixel !== 255) // Not all white
  })
  expect(hasContent).toBeTruthy()
}
```

---

## 7. Test Execution Strategy

### 7.1 Test Categories
- **Smoke:** Critical path only (5-10 min)
- **Regression:** All features (30-60 min)
- **Full:** All browsers/devices/conditions (2-4 hours)

### 7.2 CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:e2e -- --grep "@smoke"
  
  regression:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:e2e
  
  full:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
```

### 7.3 Test Tagging
```typescript
// Use test.describe tags for selective execution
test.describe('Core Game Flow @smoke @critical', () => { ... })
test.describe('Pack Management @regression', () => { ... })
test.describe('Visual Regression @visual @slow', () => { ... })
```

---

## 8. Estimated Test Implementation Effort

| Priority | Test Category | # Tests Est. | Effort Est. |
|----------|--------------|--------------|-------------|
| P1 | Core Game Flow | 3-5 | 1-2 days |
| P1 | Data Persistence | 5-7 | 1-2 days |
| P1 | Game State | 5-6 | 1 day |
| P1 | Offline Complete | 3-4 | 1-2 days |
| P2 | Pack Management | 4-6 | 1 day |
| P2 | Pack Edit | 6-8 | 1-2 days |
| P2 | Song Management | 6-8 | 1-2 days |
| P2 | PDF Rendering | 6-8 | 1-2 days |
| P2 | Navigation | 4-5 | 0.5-1 day |
| P3 | Mobile Viewport | 5-7 | 1-2 days |
| P3 | Edge Cases | 6-8 | 1-2 days |
| P3 | SW Lifecycle | 5-6 | 1 day |
| P4 | Legacy Parity | 6-10 | 2-3 days |
| P4 | Visual Regression | 8-10 | 2-3 days |
| P4 | Performance | 4-5 | 1 day |

**Total Estimated Effort:** 18-30 days (140-240 hours)

### Recommended Minimum for Migration Sign-off:
- **P1 tests only:** 5-8 days (critical path coverage)
- **P1 + P2 tests:** 12-18 days (high confidence)
- **P1 + P2 + P3 tests:** 18-25 days (production ready)

---

## 9. Immediate Action Items

### Week 1: Critical Path Coverage
1. ✅ Review this analysis with team
2. ⬜ Set up test fixtures and helpers
3. ⬜ Implement Core Game Flow tests (P1)
4. ⬜ Implement Data Persistence tests (P1)
5. ⬜ Run tests, establish baseline

### Week 2-3: High Priority Coverage
6. ⬜ Implement Game State tests (P1)
7. ⬜ Implement Offline Complete tests (P1)
8. ⬜ Implement Pack Management tests (P2)
9. ⬜ Implement Song Management tests (P2)
10. ⬜ Fix any failures discovered

### Week 4: Migration Validation
11. ⬜ Implement Pack Edit tests (P2)
12. ⬜ Implement PDF Rendering tests (P2)
13. ⬜ Test known migration gaps
14. ⬜ Document any remaining parity issues
15. ⬜ Decision: ready to remove legacy? Y/N

---

## 10. Success Criteria for Migration Completion

Before removing legacy code, achieve:
- ✅ All P1 tests passing (critical path)
- ✅ All P2 tests passing (high confidence)
- ✅ Known migration gaps addressed or documented as acceptable
- ✅ Tests run in CI/CD on every PR
- ✅ Offline workflow validated on multiple browsers
- ✅ Mobile viewport tests passing
- ✅ No critical bugs discovered in testing
- ✅ Performance benchmarks meet requirements (page load < 3s)

---

## Appendix A: Test File Structure

Recommended organization:
```
tests/
├── fixtures/
│   ├── test-data.ts          # Test packs, songs, PDFs
│   └── test-helpers.ts        # Seed/clear DB helpers
├── pages/                      # Page object models
│   ├── WelcomePage.ts
│   ├── PackSelectPage.ts
│   ├── PdfReaderPage.ts
│   └── ...
├── helpers/
│   ├── assertions.ts          # Custom assertions
│   └── wait-for.ts            # Custom wait helpers
├── smoke/                      # P1 smoke tests
│   ├── game-flow.spec.ts
│   ├── data-persistence.spec.ts
│   └── offline-complete.spec.ts
├── regression/                 # P2 regression tests
│   ├── pack-management.spec.ts
│   ├── song-management.spec.ts
│   └── ...
├── extended/                   # P3-P4 extended tests
│   ├── mobile-viewport.spec.ts
│   ├── edge-cases.spec.ts
│   └── visual-regression.spec.ts
└── offline-pdf.spec.ts        # Existing test (move to smoke/)
```

---

## Appendix B: Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Tests find critical bugs | Delays migration | Fix bugs before legacy removal |
| Test implementation takes too long | Delays migration | Focus on P1 tests only for MVP |
| Legacy behavior unclear | Can't verify parity | Document assumptions, test both |
| Service worker caching issues | App breaks offline | Test full offline workflow early |
| Mobile behavior differs | Mobile users broken | Test mobile viewports in P1 |
| IndexedDB corruption | Data loss | Test DB migrations thoroughly |
| PDF rendering fails | Core feature broken | Test PDF lifecycle in P1 |

---

## Conclusion

**Current test coverage is insufficient for safe migration.** The single existing test validates offline caching but does not cover:
- Core user workflows
- Data persistence
- React vs legacy parity
- Mobile behavior
- Complete offline functionality

**Recommended path forward:**
1. Implement P1 tests (critical path) - 5-8 days
2. Validate migration gaps are addressed
3. Implement P2 tests (high confidence) - additional 7-10 days
4. Make go/no-go decision on legacy removal
5. Implement P3 tests before production launch

**Minimum viable test suite for migration sign-off:** P1 + P2 tests (12-18 days effort)

Without expanded test coverage, **removing legacy code carries high risk of production regressions.**
