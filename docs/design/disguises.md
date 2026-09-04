# Disguise chrome checklists

What a person glancing at the screen from two metres away must see for the
disguise to hold. Each list is the contract the skin is built to and the
source of the DOM assertions in `tests/e2e/disguises.spec.ts`.

Every disguise, without exception:

- has a **cover state** reachable by clicking its document/board/channel title,
  showing plausible fake content and nothing puzzle-shaped;
- has a **"Change disguise"** entry wherever that app puts settings;
- sets the **tab title and favicon** to that app's;
- keeps the game's feedback, counters and buttons in a place that app would
  put controls — never in a row of obviously game-like buttons.

---

## Docs (`docs`) — default

1. Blue-and-white document-page icon, 40px, top-left.
2. Editable-looking document title: "Weekly sync — action items".
3. Menu bar: File · Edit · View · Insert · Format · Tools · Extensions · Help.
4. Pale blue "Share" pill, top-right, with a person glyph.
5. Round purple avatar right of Share; it opens the account menu.
6. Grey rounded toolbar strip: undo/redo/print, zoom, style, font, size, B/I/U, Editing.
7. One white 816px page, 88px/96px padding, on a `#F9FBFD` canvas.
8. Body text in Arial at 11pt, headings at 14pt/20pt, numbered sections.
9. Right margin comment thread from "Reviewer", newest card outlined amber.
10. Fixed bottom status bar: "Page 1 of 1" / "Last edit was seconds ago".

## Sheets (`sheets`)

1. Green sheet icon and a spreadsheet name, top-left.
2. Menu bar: File · Edit · View · Insert · Format · Data · Tools.
3. Toolbar row with currency/percent/decimal glyphs.
4. Formula bar: a cell reference box, an `fx` label, and a formula.
5. Lettered column headers A–H in a grey strip.
6. Numbered row headers 1…n down the left gutter.
7. Thin grey cell gridlines across the whole work area, edge to edge.
8. Selected-cell blue outline somewhere in the grid.
9. Sheet tabs along the bottom: "Q3 model", "Assumptions", "Sheet3", "+".
10. Bottom-right cell summary: "Sum: …".

## Slides (`slides`)

1. Yellow slide icon and a deck name, top-left.
2. Menu bar: File · Edit · View · Insert · Format · Slide · Arrange.
3. "Present" button, top-right.
4. Left filmstrip of numbered slide thumbnails, current one outlined blue.
5. Large 16:9 white slide surface centred on a grey stage.
6. Slide title in a large light weight at the top of the surface.
7. Body content laid out as slide bullets, not paragraphs.
8. Speaker-notes strip under the slide: "Click to add speaker notes".
9. Bottom-left slide counter, e.g. "3 of 12".
10. Theme/transition side hints on the right rail.

## Slack (`slack`)

1. Dark purple (`#3F0E40`) sidebar down the left.
2. Workspace name and a round member avatar at the top of the sidebar.
3. Channel list with `#` prefixes; the active channel highlighted.
4. DM list under a "Direct messages" heading with presence dots.
5. Channel header: `#` name, member count, and a topic line.
6. Messages as avatar + bold display name + small timestamp + body.
7. A "1 reply" thread affordance under the message.
8. Right-hand thread pane titled "Thread", carrying the game's controls.
9. Message composer box at the bottom with a placeholder and send glyph.
10. Purple "New" compose button in the sidebar.

## Jira (`jira`)

1. Blue Jira-ish mark plus a project breadcrumb: "Platform / Board".
2. Board name as an `h1`-scale heading with an avatar row beside it.
3. Search box and a blue "Create" button in the top bar.
4. Column headers: To Do · In Progress · In Review · Done, with counts.
5. Cards with an issue key (`PLAT-214`), a summary line and a coloured label chip.
6. Story-point badge and assignee avatar in each card footer.
7. The open issue rendered as a detail panel to the right of the board.
8. Detail panel has Status / Assignee / Sprint fields.
9. Comment box in the detail panel carrying the game's controls.
10. Left sidebar with Backlog · Board · Reports · Issues.

## Outlook (`outlook`)

1. Blue Outlook-ish mark and the word "Mail" in the top bar.
2. Ribbon row: New mail · Delete · Archive · Move · Reply · Reply all.
3. Folder rail: Inbox (with an unread count) · Drafts · Sent · Archive · Deleted.
4. Message list column with sender, subject, preview snippet and time.
5. The selected message highlighted in the list.
6. Reading pane to the right with subject as a heading.
7. Sender block: round initial avatar, name, address, "To: me", timestamp.
8. Message body as plain paragraphs in a mail-safe font.
9. Reply / Reply all / Forward buttons above the body.
10. Bottom status: "Items: 47 · Connected to Microsoft Exchange".

## Notion (`notion`)

1. Light sidebar with a workspace name and a member avatar.
2. Sidebar sections: Search · Home · Inbox, then a page tree.
3. Page tree entries with emoji icons; the current page highlighted.
4. Breadcrumb at the top of the page area.
5. Page cover strip and a large emoji page icon above the title.
6. Page title in a big semibold serif-less face.
7. Content laid out as blocks with generous line height and no visible chrome.
8. A callout block with an emoji and tinted background.
9. Right-hand meta row: Share · Comments · Updates · Favourite · "…".
10. "+ New page" button pinned at the bottom of the sidebar.

## Terminal (`terminal`)

1. Dark window on a near-black background, no page chrome.
2. Title bar with three traffic-light dots and a `zsh — 120×32` label.
3. Tab strip with two tabs; the active tab lighter.
4. Everything monospaced, ~13px, with a green-on-black palette.
5. Prompt lines shaped `user@host ~/project %`.
6. Echoed commands above their output, exactly as a shell would.
7. Output rendered as plain aligned text, no boxes or buttons.
8. A blinking block cursor at the end of the last line.
9. Controls presented as a shell menu: `[c] check  [h] hint  [q] quit`.
10. Status line at the bottom: exit code and elapsed time.
