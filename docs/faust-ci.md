# Faust CI quality gate (HACK//OPS × Faust)

Pinned Faust commit: `1fc7df1b34b921075284659bd2e14f50221f4007` (`crasyK/fausth`).

## Workflows

| File | Trigger | Secrets |
|------|---------|---------|
| `.github/workflows/submission-deterministic.yml` | PR open/sync | none |
| `.github/workflows/submission-faust-review.yml` | label `faust-review` | `OPENROUTER_API_KEY` |

## Maintainer setup

1. Create label **`faust-review`** (Triggers Layer 2 advisory).
2. Add the OpenRouter key as a **GitHub Actions repository secret** (not in YAML, not in git):
   - Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `OPENROUTER_API_KEY`
   - Value: your OpenRouter key (`sk-or-…`)
   - Layer 1 (deterministic) works without it; Layer 2 (`faust-review`) needs it.
3. When bumping Faust, update the `ref:` SHA in both workflow files together.

Human retains merge authority. See https://github.com/crasyK/fausth/blob/main/docs/ci-quality-gate.md
