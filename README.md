# freshify-companies-fe

Frontend for the **Companies** sovereign module of [Sovereign Portal](https://github.com/freshifyv2/freshify-sovereign-portal).

Mounted under the portal shell at `/dashboard/companies/*`. Pairs with [`freshify-companies`](https://github.com/freshifyv2/freshify-companies) backend.

The default UI label is "Customers" — `companies` is the canonical module key, "Customers" is the label most deployments want their operators to see. Both names are configured in the module registry; rename either without touching code.

## What this owns

- Companies list — typed (Enterprise / Client / Sub-Contractor / Partner / Affiliate), filter chips driven by the module registry, gear icon per record
- Company detail — hero card, attached Users and Roles, quadrant details (Address, Communication, Creation, Account Representative)
- New Company form — operator-only create flow with system-generated identifier preview
- Per-record settings page at `/dashboard/companies/:id/settings`
- Module Settings page (Module Admins, Available Roles, Default Role, Capabilities, Registry view)

## Run locally

```bash
npm install
cp .env.example .env  # set USERS_SERVICE_URL, COMPANIES_SERVICE_URL, WORKSPACES_SERVICE_URL
npm run dev
```

Defaults to `http://localhost:3002`.

## Environment

| Variable | Required | Notes |
|---|---|---|
| `USERS_SERVICE_URL` | yes | `freshify-users` backend URL |
| `COMPANIES_SERVICE_URL` | yes | `freshify-companies` backend URL |
| `WORKSPACES_SERVICE_URL` | yes | `freshify-workspaces` backend URL |
| `SESSION_COOKIE_NAME` | no | Defaults to `sp_session` |
| `PORT` | no | Defaults to `3002` |

## Stack

Next.js 14 (App Router, standalone output). Server Components by default. Geist Sans typography. Design tokens shared with the portal shell.

## License

Apache 2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE). Copyright 2026 Freshify, Inc.

## Support

- Bugs and feature requests: open an issue. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first.
- Security disclosures: see [SECURITY.md](./SECURITY.md). Do not open a public issue.
- Production deployment, custom modules, architecture review: see [SUPPORT.md](./SUPPORT.md).
