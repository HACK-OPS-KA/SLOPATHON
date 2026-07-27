# Submission quality gate (HACK//OPS × engine pin)

Pinned engine: `629c7b3945a2b71d9ec15607c735d7c56874ecf0` (`crasyK/fausth`).

| Workflow | Trigger | Secrets |
|----------|---------|---------|
| `Submission L1` | PR open/sync | none |
| `Submission L2` | label `faust-review` | `KIT_AI_API_KEY` and/or `OPENROUTER_API_KEY` |

One Checks job per layer; findings in the job summary. Human retains merge authority.
