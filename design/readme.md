# ELIVO｜意聯 — Design System

**From Conversation to Understanding.**
ELIVO 在會議進行中，安靜地把「現在說的話」和「過去的決策、數字、文件」連起來——只在真正重要時提醒你，而且每一則都附來源。
*Listen less like a recorder. Understand more like a participant.*

## Context
ELIVO is a Taiwanese startup building **real-time conversation intelligence**: a bot-free Mac app (later a desk companion display / iPad second screen) that listens to a meeting, links what's being said to past decisions, numbers and documents, and surfaces short, sourced cards only when it matters. Moat: a cross-meeting **Decision Ledger** plus a surfacing policy that decides *when to speak*. Beachhead: Taiwan B2B consultants, account managers and PMs (Mandarin/English code-switching). Status: Phase 0 validation (2026/10–11), fundraising-oriented.

Products / surfaces
- **ELIVO for Mac** (MVP1 Live → MVP2 Memory → MVP3 Surface) — the only surface specified; recreated in `ui_kits/mac-app/`.
- Second-screen web mode (iPad) and ELIVO Display (Phase 2) share the Mac layout — not yet specified.

## Sources
- GitHub: **https://github.com/wutiger555/ELIVO** (branch `main`). Docs only — no code, no UI, no logo, no fonts. Read `docs/00-original-concept.md` (brand), `docs/04-mvp-spec.md` (UI wireframe, card spec, copy rules), `docs/06-compliance-and-trust.md` (trust UI requirements). Explore it further for product nuance before designing new flows.
- Direction from the founder: 科技感、新創感、募資新創企業方向、簡約。
- Everything visual here (palette, type, components) is **authored from scratch** from those briefs.

## CONTENT FUNDAMENTALS
- **Languages**: 繁體中文（台灣用語）first; English technical terms kept as-is (API migration, latency, p95, Ledger, Focus, Ephemeral). Code-switching mid-sentence is normal and mirrors the users.
- **Voice**: quiet, precise, factual. ELIVO is "a participant", never a narrator. Keywords from the brand: Intelligent, Quiet, Human, Contextual, Precise, Connected.
- **Card copy** (from spec §6): title ≤ 12 CJK chars; body ≤ 2 lines; state facts, never judge — 「與 8/12 決策不同」 not 「你們錯了」; always include a date and a source; when unsure, ask — 「是指方案 B 嗎？」.
- **Person**: addresses the user as 你 in marketing ("只在真正重要時提醒你"); in UI the owner is 「我」, others are 「對方」／「說話者 A」 (no names inferred from voice).
- **Casing**: English UI labels in Title case for buttons (Focus, Pin); section/type labels in MONO UPPERCASE (LIVE CONVERSATION, DECISION CONFLICT). Taglines in sentence case with a period: "From Conversation to Understanding."
- **Numbers & time**: always mono — 00:23:41, p95 820ms, 8/12, +18%.
- **Never**: emoji; exclamation marks; "invisible / undetectable / 隱形 / 不被發現" (hard rule); emotion or tone words about people.
- Taglines: "Always there, never in the way." · "The intelligence layer for human conversations." · 「讓 AI 理解對談，讓人專注於對談。」

## VISUAL FOUNDATIONS
- **Mood**: calm, dark instrument panel rendered in **liquid glass** (iOS 26/27-style): translucent, blurred layers floating over soft ambient light, one aquamarine accent. Startup polish through restraint.
- **Color**: Void neutrals (#05070B → #4A5568, faint blue cast) + Haze text greys. **Ion** aquamarine #3FEFCF is the only brand accent and means "this matters now" — primary button, live dot, promoted-card glow, owner's speaker label, trigger highlight. Semantic: **Ember** #FF8F5A = conflict / number drift, **Cryo** #8FB0FF = document/info, **Rose** #FF5C7A = REC + destructive. Light theme (`[data-theme="light"]`, Frost #F3F5F8) for web, docs and investor material; primary button there is void with Ion text.
- **Glass material**: `--glass-fill` (5.5% white) / `-thin` / `-strong` + `--glass-blur` (saturate 180%, blur 24px; heavy = 40px) + `--glass-edge` (1px specular top highlight + 8% inner ring). Use on controls, cards, panels, tab bars, dialogs. Glass needs light behind it: `--bg-ambient` (three low-opacity radial glows — Ion top-left, Cryo top-right, Ember bottom-right) sits under `--bg`. Never put glass on glass more than two layers deep.
- **Type**: Geist + Noto Sans TC; Geist Mono for timecodes, numbers, uppercase labels. Display 56–72px/500, -0.035em; body 15/1.6; transcript 16/1.7. Dialog titles 600.
- **Spacing**: 2/4/8/12/16/20/24/32/40/56/80/120. Glass panels float with 12px inset from the window edge.
- **Radii**: iOS-generous — 6 badges-inner, 10 fields, 16, 22 cards/panels, 28 dialogs/sheets; all buttons, tags, segmented controls and tab bars are **capsules**.
- **Borders**: no solid borders on glass — edges come from the inset specular highlight. Hairlines (8%) only as dividers inside a surface.
- **Shadows**: `--glass-shadow` for floating glass; `--shadow-overlay` for dialogs/toasts; `--glow-signal` (Ion ring + 40px glow) for the single promoted card.
- **Backgrounds**: ambient glow + optional 24px dot grid. No photos, illustrations or hard gradients.
- **Motion**: ease-out `cubic-bezier(.2,.8,.2,1)` for fades; **spring** `cubic-bezier(.34,1.3,.5,1)` for press, switch knob and segmented thumb. 120 / 220 / 340 / 480ms. Cards surface with 8px rise + scale .98 + blur-in. Pulse only for live dots.
- **Hover**: +6% white on glass; text-2 → text-1; primary lightens to ion-400. **Press**: spring scale .96 (buttons) / .92 (icon buttons); switch knob stretches. **Focus**: Ion ring + 4px soft halo.
- **Controls**: iOS-style — 46×28 switch with white knob, circular checkboxes, glass segmented control with sliding thumb, floating capsule tab bar.
- **Layout**: two-column live view (transcript / glass context panel), 56px glass title bar with always-visible REC capsule.

## ICONOGRAPHY
- No icon assets exist in the source. **Substitution: Lucide** (outline, 2px stroke, rounded joins) via CDN `lucide-static@0.460.0`, rendered through the `Icon` component as a currentColor mask.
- Brand rule (concept §13): never use robots, brains, microphones, AI circuits or chat bubbles as icons. Prefer structural glyphs: git-compare, milestone, file-text, hash, link-2, corner-down-right, scan-search.
- 16px default, 14 in dense rows, 11–12 inside badges. Color inherits text.
- No emoji. Unicode only for ↗ (open source) and ｜ (brand separator).
- **Logo**: none provided. Render the wordmark as plain type — "ELIVO" Geist 600, +0.02em, optionally 「｜意聯」 in Noto Sans TC. Do not draw a mark.

## Index
- `styles.css` — entry; imports `tokens/{fonts,colors,typography,spacing,effects,base}.css`
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing incl. Liquid glass, Brand)
- `components/` — React primitives (below)
- `ui_kits/mac-app/` — ELIVO for Mac click-through (Brief → Live → Confirm → Summary)
- `thumbnail.html`, `SKILL.md`, `github.md`

## Components
- core: **Button**, **IconButton**, **Icon**, **Badge**, **Tag**, **Card**, **Tooltip**
- forms: **Input**, **Select**, **Checkbox**, **Switch**, **SegmentedControl**
- navigation: **Tabs**
- feedback: **Dialog**, **Toast**
- conversation: **ContextCard** (+ `CARD_TYPES`), **AmbientItem**, **TranscriptLine**, **SourceChip**, **RecIndicator**

No component library exists in the source; this standard set was authored from scratch and sized to the MVP spec. Intentional additions: **Icon** (Lucide wrapper), and the conversation family (derived directly from spec §3 & §6).
