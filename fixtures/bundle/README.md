# Evidence bundle fixtures

Reference archives the SDK offline check exercises.

| File | Role |
|---|---|
| `reference-bundle.zip` | A completed hackathon export. The check must pass. |
| `manifest.json` | The same manifest that sits inside the reference zip, extracted for inspection. |
| `tampered-bundle.zip` | The reference archive with one flipped byte in `events.jsonl` and the original manifest kept. The check must fail. |
| `unrevealed-hackathon.json` | A source that still carries a sealed envelope. The export route must redact it. |

Regenerate after changing the collector or zip writer:

```bash
cd frontend
GENERATE_BUNDLE_FIXTURES=1 npx vitest run lib/bundle/generate-fixtures.test.ts
```
