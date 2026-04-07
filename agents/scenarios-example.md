# Test Scenarios

## Plan
Feature: Todo list management
- Users can add a todo item by typing in an input field and pressing Enter
- Users can mark a todo item as complete by clicking a checkbox
- Users can filter todos by: All, Active, Completed
- Users can delete a todo item
- The footer shows the count of remaining active items

## SDET: Identified Scenarios
# Test Scenarios: Todo List Management

---

## Adding Todo Items

**1. Add a todo item by typing and pressing Enter**
- **What is being tested:** Core add functionality via Enter key
- **Type:** Happy path
- **Assertions:** New todo appears in the list; input field is cleared; todo is in "active" (incomplete) state; active item count increments by 1

**2. Add multiple todo items sequentially**
- **What is being tested:** List correctly maintains multiple items
- **Type:** Happy path
- **Assertions:** All added items appear in the list in the order they were added; active count reflects total number of items

**3. Attempt to add a todo with only whitespace/spaces**
- **What is being tested:** Input validation for blank entries
- **Type:** Edge case
- **Assertions:** No new todo is added to the list; active count does not change

**4. Attempt to add a todo with an empty input field (just press Enter)**
- **What is being tested:** Empty submission handling
- **Type:** Error case
- **Assertions:** No new todo is added; no errors thrown; list remains unchanged

**5. Add a todo with very long text (e.g., 1,000+ characters)**
- **What is being tested:** Boundary for text length
- **Type:** Boundary condition
- **Assertions:** Todo is added successfully; text is stored/displayed correctly (or gracefully truncated); UI does not break

**6. Add a todo containing special characters (e.g., `<script>`, `&`, `"`, `'`, emojis)**
- **What is being tested:** XSS prevention and special character handling
- **Type:** Edge case
- **Assertions:** Characters are displayed as literal text (not interpreted as HTML/JS); todo is added correctly

**7. Add a todo with leading and trailing whitespace**
- **What is being tested:** Input trimming behavior
- **Type:** Edge case
- **Assertions:** Todo is added with trimmed text (no leading/trailing spaces)

**8. Verify pressing keys other than Enter does not submit the todo**
- **What is being tested:** Submission is exclusive to Enter key
- **Type:** Edge case
- **Assertions:** Typing characters, pressing Tab, Shift, etc., does not add a todo item

---

## Marking Todo Items as Complete

**9. Mark a single todo item as complete by clicking its checkbox**
- **What is being tested:** Core completion toggle functionality
- **Type:** Happy path
- **Assertions:** Checkbox becomes checked; todo visually indicates completion (e.g., strikethrough); active item count decrements by 1

**10. Unmark a completed todo item (toggle back to active)**
- **What is being tested:** Toggling completion state back to active
- **Type:** Happy path
- **Assertions:** Checkbox becomes unchecked; visual completion indicator is removed; active item count increments by 1

**11. Mark all todo items as complete one by one**
- **What is being tested:** All items can be individually completed
- **Type:** Happy path
- **Assertions:** All checkboxes are checked; active item count is 0

**12. Toggle the same item complete/active multiple times rapidly**
- **What is being tested:** Rapid state toggling stability
- **Type:** Edge case
- **Assertions:** Final state is consistent with the last action; count is accurate; no UI glitches

---

## Filtering Todos

**13. Filter by "All" shows all todos (active and completed)**
- **What is being tested:** Default/All filter
- **Type:** Happy path
- **Assertions:** Both active and completed items are visible; filter "All" is highlighted as selected

**14. Filter by "Active" shows only incomplete todos**
- **What is being tested:** Active filter
- **Type:** Happy path
- **Assertions:** Only unchecked/active items are visible; completed items are hidden

**15. Filter by "Completed" shows only completed todos**
- **What is being tested:** Completed filter
- **Type:** Happy path
- **Assertions:** Only checked/completed items are visible; active items are hidden

**16. Filter by "Active" when all items are completed**
- **What is being tested:** Active filter with no matching results
- **Type:** Edge case
- **Assertions:** No todos are displayed in the list; UI handles empty state gracefully

**17. Filter by "Completed" when no items are completed**
- **What is being tested:** Completed filter with no matching results
- **Type:** Edge case
- **Assertions:** No todos are displayed in the list

**18. Mark an item complete while "Active" filter is selected**
- **What is being tested:** Real-time filter reactivity on state change
- **Type:** Edge case
- **Assertions:** The newly completed item disappears from the active view; active count updates

**19. Mark an item active (uncheck) while "Completed" filter is selected**
- **What is being tested:** Real-time filter reactivity on uncomplete
- **Type:** Edge case
- **Assertions:** The newly active item disappears from the completed view; active count updates

**20. Add a new todo while "Completed" filter is selected**
- **What is being tested:** New item visibility under non-matching filter
- **Type:** Edge case
- **Assertions:** New active todo may not appear in "Completed" view (or filter switches); item exists when switching to "All" or "Active"

**21. Switch between all three filters rapidly**
- **What is being tested:** Filter switching stability
- **Type:** Edge case
- **Assertions:** Displayed list always accurately matches the selected filter; no rendering lag or duplication

---

## Deleting Todo Items

**22. Delete a single active (incomplete) todo item**
- **What is being tested:** Core delete functionality for active item
- **Type:** Happy path
- **Assertions:** Item is removed from the list; active count decrements by 1

**23. Delete a single completed todo item**
- **What is being tested:** Delete functionality for completed item
- **Type:** Happy path
- **Assertions:** Item is removed from the list; active count remains unchanged

**24. Delete all todo items one by one until the list is empty**
- **What is being tested:** Full list clearance behavior
- **Type:** Boundary condition
- **Assertions:** List is empty; active count is 0; footer/count display handles zero-state appropriately (may hide)

**25. Delete a todo while a filter is active (e.g., delete from "Completed" view)**
- **What is being tested:** Deletion within a filtered view
- **Type:** Edge case
- **Assertions:** Item is removed permanently (not just from the filtered view); switching to "All" confirms deletion

**26. Delete the only remaining todo item in the list**
- **What is being tested:** Deleting the last item
- **Type:** Boundary condition
- **Assertions:** List becomes empty; UI handles empty state (e.g., hides footer or shows zero count)

---

## Footer / Active Item Count

**27. Verify count displays correctly with zero active items**
- **What is being tested:** Count at lower boundary
- **Type:** Boundary condition
- **Assertions:** Count displays "0 items left" (or footer hides); grammatically correct phrasing

**28. Verify count displays correctly with exactly 1 active item**
- **What is being tested:** Singular grammar handling
- **Type:** Boundary condition
- **Assertions:** Count displays "1 item left" (singular, not "items")

**29. Verify count displays correctly with multiple active items**
- **What is being tested:** Plural grammar handling
- **Type:** Happy path
- **Assertions:** Count displays "N items left" (plural form)

**30. Verify count updates when a todo is added**
- **What is being tested:** Real-time count update on add
- **Type:** Happy path
- **Assertions:** Count increments by 1 immediately after adding a todo

**31. Verify count updates when a todo is marked complete**
- **What is being tested:** Real-time count update on completion
- **Type:** Happy path
- **Assertions:** Count decrements by 1 immediately after checking a todo

**32. Verify count updates when a todo is deleted**
- **What is being tested:** Real-time count update on deletion
- **Type:** Happy path
- **Assertions:** Count decrements by 1 if deleted item was active; unchanged if deleted item was completed

**33. Verify count does not include completed items**
- **What is being tested:** Count accuracy (active-only)
- **Type:** Happy path
- **Assertions:** With a mix of active and completed items, count reflects only active items

**34. Verify count is correct with a large number of todos (e.g., 500+)**
- **What is being tested:** Performance and accuracy at scale
- **Type:** Boundary condition
- **Assertions:** Count is numerically accurate; UI remains responsive; no performance degradation

---

## General / Cross-Cutting Concerns

**35. Verify initial state of the app with no todos**
- **What is being tested:** Empty/initial state rendering
- **Type:** Happy path
- **Assertions:** Input field is present and empty; list area is empty; footer/count is hidden or shows 0; filters may be hidden

**36. Verify todo list persists after page refresh (if persistence is expected)**
- **What is being tested:** Data persistence (localStorage or backend)
- **Type:** Happy path
- **Assertions:** All todos, their completion states, and the selected filter are restored after refresh

**37. Verify keyboard accessibility (Tab to navigate, Space/Enter to interact)**
- **What is being tested:** Accessibility / keyboard-only usage
- **Type:** Edge case
- **Assertions:** All interactive elements (input, checkboxes, filters, delete buttons) are reachable and operable via keyboard

**38. Add a duplicate todo item (same text as existing)**
- **What is being tested:** Duplicate entry handling
- **Type:** Edge case
- **Assertions:** Duplicate is allowed (or rejected, depending on requirements); both items function independently if allowed

## Reviewer: Feedback & Approved List
# QA Review: Todo List Management Test Scenarios

---

## Overall Assessment

This is a well-structured, comprehensive suite. Coverage of happy paths, edge cases, and boundary conditions is strong. The assertions are specific and testable. Issues are mostly **missing scenarios** rather than problems with existing ones.

---

## Per-Scenario Feedback

### Adding Todo Items

**Scenario 1 – Add via Enter key**
✅ Solid. Consider explicitly asserting the cursor/focus remains in the input field after submission, which is a common UX requirement and failure point.

**Scenario 2 – Add multiple items sequentially**
✅ Good. Consider specifying a concrete number (e.g., "add 5 items") to make this deterministic and repeatable.

**Scenario 3 – Whitespace-only input**
✅ Necessary. Assertion should also confirm the input field is cleared or retains the whitespace — behavior varies by implementation and both are testable and relevant.

**Scenario 4 – Empty input submission**
⚠️ **Partial overlap with Scenario 3.** Both test "nothing meaningful is submitted." These can be kept separate (they are technically distinct inputs), but they should cross-reference each other and justify why both exist. The distinction is valid — whitespace *could* pass an empty check but fail a blank check — so keeping them is defensible. Add an explicit note to that effect.

**Scenario 5 – Very long text**
✅ Good boundary test. The assertion "or gracefully truncated" is ambiguous — the scenario should specify which behavior is expected, or document that this must first be determined from requirements. Undefined expected behavior makes a test untestable.

**Scenario 6 – Special characters / XSS**
✅ Essential. Consider splitting XSS payloads (`<script>`) from general special characters (`&`, `"`, emojis) into two scenarios, since they test different concerns: security versus encoding/display. Conflating them obscures failures.

**Scenario 7 – Leading/trailing whitespace trimming**
✅ Good. Add an assertion covering what happens when the *entire* trimmed result is empty (overlaps with Scenario 3 but worth cross-referencing explicitly).

**Scenario 8 – Non-Enter key presses don't submit**
⚠️ **Partially redundant with Scenarios 3 and 4** in spirit, but tests a different mechanism (key event handling vs. value validation). Keep it, but tighten the assertion: specify which keys to test (Tab, Shift, Ctrl, arrow keys, Escape). Also: **missing — what does Escape do?** If Escape clears the input field, that is a distinct behavior that deserves its own scenario.

---

**Missing in Adding:**

> **M1. Add a todo item via the "+" button or equivalent UI button (if present)**
> Not all implementations are Enter-key-only. If a submit button exists, it needs its own coverage.

> **M2. Paste text into the input field and submit**
> Tests clipboard input path, which can behave differently from typed input, particularly for whitespace and special characters.

> **M3. What happens when the user presses Escape while typing?**
> Common behavior is to clear or cancel. This is untested and a genuine edge case.

---

### Marking Todo Items as Complete

**Scenario 9 – Mark single item complete**
✅ Strong. The assertion list is thorough.

**Scenario 10 – Unmark completed item**
✅ Good mirror of Scenario 9.

**Scenario 11 – Mark all items complete one by one**
⚠️ **Overlaps with Scenarios 9 and the "Mark All" feature (if it exists).** This scenario's unique value is verifying the count reaches 0 and the UI responds correctly (e.g., footer behavior, "Clear completed" button appearance). Make that the explicit focus of the assertions rather than repeating per-item toggle behavior.

**Scenario 12 – Rapid toggling**
✅ Valuable stability test. Specify a threshold for "rapidly" (e.g., 10 toggles in under 2 seconds) to make this reproducible.

---

**Missing in Marking Complete:**

> **M4. Mark All Complete via the "Toggle All" / chevron control (if present)**
> This is a core feature of the canonical TodoMVC spec and is entirely absent from the suite. Needs: all items become complete, count goes to 0, toggle-all checkbox becomes checked.

> **M5. Toggle All when some items are already complete**
> Expected behavior: all remaining active items become complete. This is a distinct state from "all active."

> **M6. Toggle All to unmark all (when all are complete)**
> Expected: all items return to active state. Toggle-all should behave bidirectionally.

> **M7. Completion state persists across filter changes**
> Mark an item complete in "All" view, switch to "Completed," confirm it appears. Distinct from filter scenarios since it validates state integrity, not filter display logic.

---

### Filtering Todos

**Scenario 13 – "All" filter**
✅ Good. Explicitly assert the default state is "All" on initial load.

**Scenario 14 – "Active" filter**
✅ Good.

**Scenario 15 – "Completed" filter**
✅ Good.

**Scenario 16 – "Active" filter with no active items**
✅ Needed. Also assert the empty state message or UI treatment.

**Scenario 17 – "Completed" filter with no completed items**
✅ Needed. Same note — assert empty state handling.

**Scenario 18 – Complete item while "Active" filter active**
✅ Strong real-time reactivity test.

**Scenario 19 – Uncheck item while "Completed" filter active**
✅ Good mirror of Scenario 18.

**Scenario 20 – Add todo while "Completed" filter active**
⚠️ The assertion "may not appear... (or filter switches)" is not a testable assertion — it documents two possible behaviors without specifying which is correct. This must be resolved against requirements before the scenario can be approved. Flag it as **requires spec clarification**.

**Scenario 21 – Rapid filter switching**
✅ Reasonable stability check. Pair it with a specific state (e.g., mix of active and completed items) to make it deterministic.

---

**Missing in Filtering:**

> **M8. Filter selection persists after page refresh**
> This is partially addressed in Scenario 36 but deserves its own explicit filter-specific assertion — particularly that the highlighted filter tab matches the persisted selection.

> **M9. Filter links are URL-based (if hash routing is used)**
> Many TodoMVC implementations use `#/active`, `#/completed`. Direct navigation to these URLs should activate the correct filter. Entirely missing from the suite.

---

### Deleting Todo Items

**Scenario 22 – Delete active item**
✅ Good. Assert the delete control (e.g., ×) only appears on hover if that is the expected UX behavior.

**Scenario 23 – Delete completed item**
✅ Good.

**Scenario 24 – Delete all items one by one**
⚠️ **Overlaps significantly with Scenario 26** (deleting the last item). Scenario 24 is a superset that includes Scenario 26. Consider merging, or make Scenario 24 focus on intermediate states (e.g., footer hides when count hits 0) while Scenario 26 focuses solely on the final-item boundary.

**Scenario 25 – Delete from filtered view**
✅ Excellent. Tests an important distinction between visual removal and actual deletion.

**Scenario 26 – Delete last item**
⚠️ See Scenario 24 overlap note above.

---

**Missing in Deleting:**

> **M10. "Clear Completed" button appears only when completed items exist**
> The button's visibility condition is a testable behavior entirely absent from the suite.

> **M11. "Clear Completed" removes all completed items at once**
> Core feature. Assert: all completed items gone, active items unaffected, count unchanged, button disappears.

> **M12. "Clear Completed" when only some items are completed**
> Partial clear — active items must survive. Distinct from M11 (where all might be complete).

> **M13. "Clear Completed" when no completed items exist**
> Button should not appear (or should be disabled). Defensive boundary check.

> **M14. Undo / accidental deletion behavior (if supported)**
> If the application supports undo, this is unaddressed.

---

### Footer / Active Item Count

**Scenario 27 – Count at zero**
✅ Good. Clarify whether the expected behavior is "footer hides" or "shows 0 items left" — both are valid implementations but only one can be correct for a given application.

**Scenario 28 – Singular grammar ("1 item left")**
✅ Essential and frequently missed in implementations.

**Scenario 29 – Plural grammar**
✅ Good.

**Scenario 30 – Count updates on add**
⚠️ **Redundant with Scenario 1's assertions.** Count updating on add is already asserted in Scenario 1. This scenario adds no new coverage unless it tests something Scenario 1 does not (e.g., adding the 2nd, 3rd item). Consider whether this justifies a standalone scenario or should be folded into Scenarios 1 and 2.

**Scenario 31 – Count updates on completion**
⚠️ **Redundant with Scenario 9's assertions.** Same concern as Scenario 30.

**Scenario 32 – Count updates on deletion**
⚠️ **Partially redundant with Scenarios 22 and 23.** The distinction here (active vs. completed item deletion) is valuable and not fully covered by those scenarios' assertions, so this one has marginal justification. If kept, tighten the focus to *only* the count behavior to differentiate it from the delete scenarios.

**Scenario 33 – Count excludes completed items**
✅ Distinct and valuable. Tests the accuracy of the count formula itself, not just whether it changes.

**Scenario 34 – Count accuracy at scale**
✅ Good performance boundary test. Specify the mechanism for adding 500+ items (manual vs. programmatic via setup) and define "responsive" with a measurable threshold (e.g., < 1 second).

---

**Missing in Footer:**

> **M15. Footer is hidden when the list is empty**
> Referenced in several scenarios but never tested as a standalone assertion. Make it explicit.

> **M16. "Clear Completed" button count or label (if displayed)**
> Some implementations show "Clear completed (N)." If present, verify the count in the label is accurate.

---

### General / Cross-Cutting Concerns

**Scenario 35 – Initial empty state**
✅ Good baseline. Assert that the toggle-all control (if present) is also hidden or disabled in empty state.

**Scenario 36 – Persistence after refresh**
✅ Essential. Consider splitting into: (a) persistence of todo items and states, (b) persistence of active filter selection. These can fail independently.

**Scenario 37 – Keyboard accessibility**
⚠️ This is too broad to be a single testable scenario. "All interactive elements are reachable" could encompass dozens of interactions. Split into discrete scenarios: Tab order for the input field, checkbox operation via Space, filter navigation via arrow keys or Tab/Enter, delete button via keyboard. As written, a failure gives no actionable signal about *what* is broken.

**Scenario 38 – Duplicate todo items**
✅ Good. The assertion handles ambiguity well by acknowledging both possible behaviors. However, "depending on requirements" means this must be resolved before execution.

---

**Missing in General:**

> **M17. Screen reader / ARIA label verification**
> Scenario 37 covers keyboard navigation but not ARIA roles, labels, or live region announcements (e.g., count change announced to screen readers). Separate concern from keyboard operability.

> **M18. Editing an existing todo item (double-click to edit)**
> **This is the most significant gap in the entire suite.** The edit flow is a primary feature of TodoMVC and is entirely unrepresented. Required sub-scenarios:
> - Double-click activates edit mode
> - Enter/blur saves edit
> - Escape cancels edit and restores original text
> - Saving with empty text deletes the item
> - Saving with whitespace-only trims or deletes
> - Editing does not affect completion state

> **M19. Application behavior with JavaScript disabled**
> If the app is expected to degrade gracefully, this is a relevant scenario.

> **M20. Concurrent tab behavior**
> If persistence is via localStorage, opening the app in two tabs and modifying in one — does the other tab reflect changes? Relevant if real-time sync is expected.

---

## Redundancy Summary

| Redundant Pair | Recommendation |
|---|---|
| Scenarios 3 & 4 | Keep both; add explicit justification note |
| Scenarios 24 & 26 | Merge or clearly differentiate focus |
| Scenarios 30 & 1 | Fold Scenario 30 into Scenario 1/2 or remove |
| Scenarios 31 & 9 | Fold Scenario 31 into Scenario 9 or remove |
| Scenarios 32 & 22/23 | Narrow Scenario 32's scope or remove |

---

## Final Approved List

### Approved As-Is
1, 2, 3, 4, 6, 7, 9, 10, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 28, 29, 33, 34, 35, 38

### Approved with Modifications Required
| Scenario | Required Change |
|---|---|
| 5 | Resolve ambiguity in truncation assertion before execution |
| 8 | Enumerate specific keys; add Escape behavior |
| 11 | Refocus assertions on zero-state UI behavior |
| 12 | Define "rapidly" with a measurable threshold |
| 20 | Resolve "may or may not" assertion; requires spec input |
| 24 | Differentiate from Scenario 26 or merge |
| 26 | Differentiate from Scenario 24 or merge |
| 27 | Specify whether footer hides or shows zero |
| 36 | Split into item persistence and filter persistence |
| 37 | Split into discrete, individually testable scenarios |

### Remove or Fold Into Existing Scenarios
- Scenario 30 → fold into Scenario 1
- Scenario 31 → fold into Scenario 9
- Scenario 32 → narrow scope or fold into Scenarios 22/23

### Add New Scenarios
| ID | Scenario |
|---|---|
| M1 | Add via submit button (if present) |
| M2 | Paste text into input and submit |
| M3 | Escape key clears/cancels input while typing |
| M4 | Toggle All marks all items complete |
| M5 | Toggle All when some items already complete |
| M6 | Toggle All unmarks all when all are complete |
| M7 | Completion state integrity across filter changes |
| M8 | Filter selection persists after page refresh |
| M9 | Direct URL navigation activates correct filter (if hash routing) |
| M10 | "Clear Completed" button visibility condition |
| M11 | "Clear Completed" removes all completed items |
| M12 | "Clear Completed" with partial completion |
| M13 | "Clear Completed" button absent when no completed items |
| M14 | Edit todo — double-click activates edit mode |
| M15 | Edit todo — Enter/blur saves changes |
| M16 | Edit todo — Escape cancels and restores original |
| M17 | Edit todo — saving empty text deletes the item |
| M18 | Edit todo — whitespace-only edit trims or deletes |
| M19 | Footer hidden when list is empty (explicit standalone) |
| M20 | ARIA roles and live region announcements |

**Approved total: 25 existing + 20 new = 45 scenarios**