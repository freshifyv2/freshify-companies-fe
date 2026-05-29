# freshify-companies-fe

Frontend for the **Companies** sovereign module.

Owns: list companies, company detail, member management.
Mounted at `/dashboard/companies/*` via the portal shell rewrites.
Backend: `freshify-companies` Cloud Run service.

## Stack
Next.js 14 App Router · TypeScript · Cloud Run (Docker, port 8080)
