# Expert UX Review — Meal Planner

**Method:** Heuristic evaluation (Nielsen's 10 usability heuristics) plus
mobile-usability and WCAG 2.1 AA accessibility checks. This is an *expert
inspection* of the current build (commit on `claude/meal-planner-app-K0bQa`),
not user testing — it surfaces likely problems to validate with real users.

**Scope:** Prep Plan, Ideas, Components (+ component form & autofill), Grocery,
Targets bar, global navigation. Reviewed from source + screen structure (live
visual/Lighthouse pass still recommended).

**Severity:** 🔴 Blocker · 🟠 Major · 🟡 Minor · 🔵 Polish

---

## Scorecard (heuristic → how the app does)

| # | Heuristic | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Visibility of system status | 🟢 Good | Live totals, progress bars, autofill spinner/errors, "Added" confirmation |
| 2 | Match between system & real world | 🟠 | Jargon: "servings per batch", "protein density g/100kcal", "form factor" |
| 3 | User control & freedom | 🟠 | Destructive actions use `confirm()` but there's **no undo**; deleting a component silently edits plan & ideas |
| 4 | Consistency & standards | 🟡 | Tab label "Ideas" vs page title "Assembly ideas"; grocery badge counts servings, not items |
| 5 | Error prevention | 🟡 | Number fields accept odd input; no guard rails on targets (e.g. 0 kcal) |
| 6 | Recognition over recall | 🟢 Good | Templates, pickers, on-profile ★ hints reduce memory load |
| 7 | Flexibility & efficiency | 🟠 | No bottom nav on mobile; many tiny steppers; no "duplicate/scale plan" |
| 8 | Aesthetic & minimalist design | 🟢/🟠 | Clean, but two stacked sticky bars eat mobile viewport |
| 9 | Help users with errors | 🟡 | Good in autofill; elsewhere errors are mostly prevented, not explained |
| 10 | Help & documentation | 🟡 | Inline tips/footnotes only; no first-run orientation to "prep-first" idea |

---

## Findings (prioritized)

### 🟠 Major

**M1 — Touch targets below the 44×44px minimum.**
`.stepper__btn` is 30×30px and `.icon-btn` is ~24px. These are the most-tapped
controls (servings, period, delete). On phones this causes mis-taps, especially
the −/+ steppers sitting close together.
*Fix:* bump to ≥44×44 (or 40 with padding hit-area). Add spacing between − and +.
*Effort: S*

**M2 — No visible keyboard focus indicator.**
Only `.input:focus` is styled. Buttons, tabs, steppers, chips, cards, and modal
controls have no `:focus-visible` ring → keyboard users can't see where they are
(WCAG 2.4.7). *Fix:* one global `:focus-visible` outline rule. *Effort: S*

**M3 — Primary-action contrast is below AA.**
White text on `--green #16a34a` (primary buttons, active tab) is ≈3.3:1 — under
the 4.5:1 needed for normal text. *Fix:* darken the green to ~`#15803d`
(`--green-dark`, ≈4.8:1) for filled buttons/active tab, or enlarge/bolden text.
*Effort: S*

**M4 — Modal doesn't trap or restore focus.**
`Modal` sets `role=dialog`/`aria-modal` and closes on Esc (good) but focus isn't
trapped inside, and on close it isn't returned to the trigger. Keyboard/screen-
reader users can tab "behind" the dialog. *Fix:* focus first element on open,
trap Tab within, restore focus on close. *Effort: M*

**M5 — Mobile navigation is top-anchored + double sticky.**
Tabs (`top:8px`) and the prep summary (`top:70px`) are both sticky; on a phone
the wrapped header + two sticky bars consume a lot of the viewport, and the
offsets can overlap. Primary nav at the top is also a long thumb-reach.
*Fix:* on mobile, move tabs to a **bottom nav bar**; make the prep summary
collapse to a one-line chip on scroll. *Effort: M*

### 🟡 Minor

**m6 — Domain jargon without explanation.** "Servings per batch", "protein
density (g/100kcal)", "form factor". *Fix:* tooltips/helper text in plain
language ("how many meals one batch makes"; "protein per 100 calories — higher =
more filling"). Some tooltips exist; make them visible on mobile (no hover).
*Effort: S*

**m7 — Color is the only signal in several places.** Progress "over" state, the
cal/protein chips, and protein-dense flag rely on color alone (colorblind risk).
*Fix:* add an icon/label (e.g. "▲ over", "✓ on track"). *Effort: S*

**m8 — Destructive actions lack undo.** "Clear plan", "Clear", delete component/
idea are immediate after a native `confirm()`. *Fix:* replace with an inline
**Undo** snackbar (more modern than `confirm()` and reversible). *Effort: M*

**m9 — Deleting a component silently mutates plan & ideas.** Correct behavior,
but invisible. *Fix:* note it in the confirm ("Also removes it from your plan
and 2 ideas"). *Effort: S*

**m10 — Targets have no validation.** A 0 or empty target makes progress bars
divide oddly. *Fix:* clamp to sensible minimums; show a hint. *Effort: S*

**m11 — Number inputs.** Macro/qty fields are `type=number` (good) but lack
`inputMode="decimal"` and select-on-focus; on mobile leading-zero editing is
fiddly. *Fix:* add `inputMode`, `step`, and select-on-focus. *Effort: S*

### 🔵 Polish

- **p12 — Empty Ideas/Components states** are plain; add an illustration or a
  one-line "why this matters."
- **p13 — Grocery badge** shows total servings; relabel or switch to item count
  for clarity.
- **p14 — Targets bar discoverability:** it's a button that opens an editor, but
  that's only hinted by a small ✏️. Add "Tap to edit" affordance.
- **p15 — First-run orientation:** a one-time 2-line explainer of the prep-first
  model would help new (shared) users immediately grok the app.
- **p16 — Reduced motion:** respect `prefers-reduced-motion` for the modal/card
  transitions.

---

## Quick wins (high impact, ~Small effort) — do these first
1. **M2** global `:focus-visible` ring
2. **M1** 44px touch targets on steppers/icon buttons
3. **M3** AA-contrast primary green
4. **m7** non-color status cues
5. **m10/m11** target validation + `inputMode` on number fields

## Bigger bets (validate with users)
- **M5** bottom navigation + collapsing summary on mobile
- **M4** accessible modal (focus trap/restore)
- **m8** undo snackbar pattern
- First-run orientation (p15)

## What to verify with real users / tools
- Run **Lighthouse** (Accessibility + PWA + Best Practices) for scored baselines.
- 3–5 person task test: "Plan 5 days and produce a grocery list" — watch for
  hesitation at the prep steppers and whether they discover templates first.
- Color-contrast pass with **axe**/**WAVE** to confirm the fixes above.
