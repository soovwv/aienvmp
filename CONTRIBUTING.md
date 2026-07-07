# Contributing

Thanks for helping improve `aienvmp`.

## Development

```bash
node --test
node bin/aienvmp.js scan --dir sample-app
node bin/aienvmp.js context --dir sample-app
```

## Design Principles

- AI agents are the primary consumers.
- Human dashboards are derived views.
- Environment-changing actions should be visible in an append-only ledger.
- Scanner failures should degrade gracefully unless the manifest would become misleading.
