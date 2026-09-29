# CLAUDE.md

ELIVO（意聯）is a real-time conversation intelligence product. It is a bot-free Mac app, later paired with a companion desk display. During a meeting it links what is being said to past decisions, numbers and documents, and shows short cards, each citing its source, only when they matter.

The project is in Phase 0 (validation). The repo contains planning docs only, with no code yet.

## Where things are
- `docs/01-research-report.md`: the full investigation and verdict. Read it before changing product direction.
- `docs/02-project-plan.md`: the revised plan, roadmap and gates.
- `docs/03-technical-architecture.md`: architecture, data model and surfacing policy.
- `docs/04-mvp-spec.md`: MVP user stories and acceptance criteria.
- `docs/adr/`: decision records. Add a new ADR for any significant decision.
- `docs/research/`: English research appendices with sources.

## Conventions
- Write docs in Traditional Chinese (zh-TW), keeping technical terms in English.
- Hard product constraints (see ADR-0003):
  - Never train on customer data.
  - No emotion recognition.
  - No persistent voiceprints by default.
  - No meeting bots in Phase 1.
  - Never market the product as "invisible" or "undetectable".
- Keep AI vendors behind abstraction layers (ADR-0002).
