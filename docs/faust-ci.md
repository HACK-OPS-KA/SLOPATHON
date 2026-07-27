# Faust CI quality gate (HACK//OPS × Faust)

Pinned Faust commit: `dee491554b25f5e462b3c66cbb72f01386f4acba` (`crasyK/fausth`).

## Workflows

| File | Trigger | Secrets |
|------|---------|---------|
| `.github/workflows/submission-deterministic.yml` | PR open/sync | none |
| `.github/workflows/submission-faust-review.yml` | label `faust-review` | `KIT_AI_API_KEY` (preferred) and/or `OPENROUTER_API_KEY` |

Findings appear on the **Checks** tab (check title states the problem; file annotations). Faust does **not** post PR comments by default.

## Maintainer setup

1. Create label **`faust-review`** (triggers Layer 2 advisory).
2. Add API keys as **GitHub Actions repository secrets** (not in YAML, not in git):
   - `KIT_AI_API_KEY` for KIT models (current advisory deployment)
   - optionally `OPENROUTER_API_KEY` for OpenRouter
3. When bumping Faust, update the `ref:` SHA in both workflow files together.

Human retains merge authority. See https://github.com/crasyK/fausth/blob/main/docs/ci-quality-gate.md
