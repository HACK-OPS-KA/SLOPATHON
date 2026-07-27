# Faust CI quality gate (HACK//OPS × Faust)

Pinned Faust commit: `1fc7df1b34b921075284659bd2e14f50221f4007` (`crasyK/fausth`).

## Workflows

| File | Trigger | Secrets |
|------|---------|---------|
| `.github/workflows/submission-deterministic.yml` | PR open/sync | none |
| `.github/workflows/submission-faust-review.yml` | label `faust-review` | `OPENROUTER_API_KEY` |

## Maintainer setup

1. Create label **`faust-review`** (Triggers Layer 2 advisory).
2. Add repo secret **`OPENROUTER_API_KEY`** for advisory review (Layer 1 works without it).
3. When bumping Faust, update the `ref:` SHA in both workflow files together.

Human retains merge authority. See https://github.com/crasyK/fausth/blob/main/docs/ci-quality-gate.md
