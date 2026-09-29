# ELIVO for Mac — UI kit

Click-through recreation of the MVP1–3 Mac app described in `docs/04-mvp-spec.md` §2–3 of wutiger555/ELIVO. **No production UI exists yet** (repo is Phase 0, docs only), so the layout follows the spec's ASCII wireframe: title bar with REC / Focus / Ephemeral / pause, left LIVE CONVERSATION, right CONTEXT (promoted card + ambient tray).

Screens
- `BriefScreen.jsx` — 會前簡報: last decisions, open actions, numbers, open questions → 開始會議
- `LiveScreen.jsx` — transcript streams; a Decision Conflict card is promoted at a turn boundary; 看依據 / 為什麼？ open the why-panel; 結束 opens the 30-second confirm
- `SummaryScreen.jsx` — 會後摘要 with Ledger list, tabs for 決策／待辦／未決問題, success toast
- `Shell.jsx` — window chrome + `SectionLabel`

All primitives come from the compiled bundle (`window.ELIVODesignSystem_a6632d`).
