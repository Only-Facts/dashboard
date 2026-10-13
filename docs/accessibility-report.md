# Accessibility report — Orbit

Date: 13 October 2026.

This records the accessibility audit completed before the automated test suite was removed. The results below are historical; the test commands and fixtures are no longer included in the project.

Scope: guest and signed-in dashboards, widget gallery, help, sign-in page, and all 24 existing widget views. GitHub remains covered for previously saved widgets but is no longer offered in the gallery.

The audit used Chromium with Playwright and axe-core. Service responses were mocked to test the interface reproducibly; those tests did not validate a real OAuth connection. Automated checks targeted WCAG 2 A/AA, 2.1 AA, and 2.2 AA. The gallery and help panel were also checked against axe best-practice rules.

| Page / component | Check | Issue found | Fix / result |
| --- | --- | --- | --- |
| Add widget gallery | Tab, Shift+Tab, Enter, Space, Escape | Dialog opened without true modal behavior or complete focus management | `showModal()`, inert background, initial focus on search, Tab wrapping, and focus returned to the Add widget button on close |
| Gallery | Search and accessible names | Several buttons were named only “Add widget” | Accessible names include the service; cards use h3 headings; a status region announces when no results match |
| Dashboard | Use without a mouse | Deletion was available only through drag and drop | Move up, move down, and delete buttons on each widget; Delete key with confirmation |
| Dashboard | Focus after actions | Fields could lose focus after saving; deletion had no focus destination | Focus restored to the field after configuration changes; focus moves to a neighboring widget after deletion, or to Add widget when the dashboard is empty |
| Dashboard | Visible focus and pinned navigation | Focused fields could be hidden behind the top bar | Visible outlines and measured top-bar height for scroll padding; Skip to content link targets a focusable main element |
| Search forms | Labels | Fields used aria-label without label elements | Actual wrapping labels for weather, air quality, news, and Steam; existing customization labels preserved |
| Structure | Headings and landmarks | Widget titles used h5; two banner landmarks; weather controls treated as repeated navigation landmarks | Widget titles use h2; one banner contains the top bar; weather controls use a button group |
| Twitch | Contrast | Dark text on purple had a measured contrast ratio of 3.66:1 | Lighter purple; no contrast violations detected in the analyzed fixtures |
| Sign-in | Contrast | Decorative avatar had an undefined background | Explicit, readable colors |
| Spotify | Keyboard scrolling | Scrollable list could not receive focus when entries had no links | Named region with tabIndex=0 |
| Mobile and magnification | Widths of 1440, 720, 390, and 320 px; 200% CSS zoom | Pinned top bar could take too much space in a short viewport | No horizontal overflow in tested cases; top bar stops being pinned below 600 px viewport height |
| Help | Open, Escape, and close | Instructions did not fully explain alternatives to dragging | Instructions cover buttons, keyboard controls, and deletion confirmation |

## Results

Build and lint passed. All 16 selected accessibility and regression tests passed. No axe violations were detected in the analyzed fixtures and pages.

## Running the checks

From `frontend`:

```sh
npm run build
npm run lint
```

Keyboard tests navigated the actual document using Tab, Shift+Tab, Enter, Space, and Delete. They verified adding widgets, searching, closing the gallery, changing a city, reordering, canceling deletion, and confirming deletion until the dashboard is empty. Additional tests covered mouse and touch dragging, persistence, and restoring the previous order when saving fails.

## Limitations and human verification

Passing axe checks on these fixtures is not WCAG certification. Magnification testing uses CSS zoom and reduced viewport dimensions, rather than the browser's zoom command. NVDA, VoiceOver, and TalkBack have not been tested in this environment.

To complete the review:

1. Open the app with NVDA/Firefox or VoiceOver/Safari and navigate headings, fields, and buttons. Check announcements for movement, deletion, and errors.
2. Complete the entire workflow without a mouse at 200% and 400% browser zoom.
3. On a phone, test a screen reader, an external keyboard, and scrolling through Spotify lists.
4. Test real data and long names, particularly Spotify and Twitch lists.

Epitech assignment reference: the “dashboard-project(3)” document was not supplied; this report does not claim to verify every assignment criterion.
