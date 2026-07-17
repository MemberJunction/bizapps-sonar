# Installing Sonar

Sonar can be installed two ways:

1. **As a MemberJunction Open App** (`mj app install`), the packaged, one-command path. Recommended once the packages are published. See [README](./README.md#install-as-an-open-app).
2. **Standalone from source**, running this repo as its own MemberJunction deployment. This document covers that path in full, from an empty database to a running app.

Use the standalone path when you want to run Sonar on its own before the Open App is published, or for development.

---

## Prerequisites

- **SQL Server** reachable from your machine (local or remote), and a login that can create/alter objects in the target database.
- **Node.js 20+** and npm.
- **The MemberJunction CLI**, invoked here as `npx mj` (installed transitively) or a global `@memberjunction/cli`.
- **An auth provider** app registration, Microsoft Entra (MSAL) or Auth0, for MJExplorer login. Sonar does not ship its own auth; it uses MemberJunction's.
- **An AI provider key** (e.g. Google Gemini) if you want the authoring agent or LLM-backed factors to run. The engine and all declarative scoring work without it.

Sonar was built and verified against **MemberJunction 5.45**. Any host in the range `>=5.45.0 <6.0.0` should work.

---

## Standalone install (empty database → running app)

### 1. Create the database

Create an empty database and ensure your app login has rights on it. Example (adjust names/credentials):

```sql
CREATE DATABASE Sonar;
-- grant your app login ownership of the new database
USE Sonar;
CREATE USER MJ_Connect FOR LOGIN MJ_Connect;
ALTER ROLE db_owner ADD MEMBER MJ_Connect;
```

### 2. Configure the environment

Copy the repo-root `.env` template and fill it in. `apps/MJAPI/.env` is a symlink to the repo-root `.env`, do not create a separate one. Key variables:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_DATABASE` | SQL Server connection + target database (e.g. `Sonar`) |
| `DB_USERNAME`, `DB_PASSWORD` | App login used at runtime |
| `DB_TRUST_SERVER_CERTIFICATE` | `Y` for local/self-signed |
| `MJ_CORE_SCHEMA` | MemberJunction core schema, `__mj` |
| `CODEGEN_DB_USERNAME`, `CODEGEN_DB_PASSWORD` | Elevated login used for provisioning + CodeGen (needs DDL rights) |
| `GRAPHQL_PORT` | API port (`4102`) |
| `WEB_CLIENT_ID`, `TENANT_ID` | Auth (MSAL / Entra) app registration |
| `AI_VENDOR_API_KEY__GeminiLLM` | AI provider key (for the authoring agent / LLM factors) |

MJExplorer auth mirrors these in `apps/MJExplorer/src/environments/environment.ts` (`CLIENT_ID`, `TENANT_ID`, `CLIENT_AUTHORITY`, `AUTH_TYPE`, and `REDIRECT_URI` = `http://localhost:4302/`). Make sure the redirect URI is registered with your auth provider.

### 3. Install dependencies

```bash
npm install        # run at the repo root (npm workspace)
```

### 4. Provision MemberJunction core

Sonar's own migrations only lay down the `__mj_BizAppsSonar` schema, they assume MemberJunction core already exists. On an empty database, provision core first:

```bash
npx mj migrate --tag v5.45.0
```

This creates the `__mj` core schema and its ~300 tables. It is the one step the "Development" quick-start assumes you already have.

### 5. Apply Sonar's migrations

```bash
npm run mj:migrate
```

This applies the `__mj_BizAppsSonar` schema migrations **and the seed migration** (`V…__Seed_App_Metadata.sql`), which loads Sonar's app metadata: score bands, time windows, actions, queries, the remote operation, and the authoring agent. On a clean core this is what makes the app usable without a separate metadata push.

### 6. Generate entity code

```bash
npm run mj:codegen
```

### 7. Build

```bash
npm run build      # builds all packages (Turborepo)
```

### 8. Start the app

```bash
npm run start:api        # GraphQL API on http://localhost:4102
npm run start:explorer   # MJExplorer on http://localhost:4302
```

### 9. Log in and open Sonar

Open **http://localhost:4302**, log in via your auth provider, and open the **Sonar** app. You should land on **Portfolio**; **Model Builder** lets you define a model (or ask the authoring agent), and **Engagement** shows members ranked worst-first once a model is published and recomputed.

---

## Verifying the install

A healthy install has:

- MemberJunction core provisioned (`__mj` schema present).
- The 14 Sonar entities registered (`SELECT COUNT(*) FROM __mj.Entity WHERE SchemaName = '__mj_BizAppsSonar'` → 14).
- Seed metadata present (score bands, time windows, 23 actions, queries, the authoring agent).
- The Sonar app visible in MJExplorer after login.

---

## Scoring your own data

Sonar scores an **anchor entity** (e.g. members) plus related activity. To score data that already lives in your MemberJunction instance:

1. Make sure the anchor and its related activity entities are **registered with MemberJunction** (via CodeGen). Sonar's engine is metadata-driven, it can only score entities MJ knows about.
2. In **Model Builder**, create a model: pick the anchor, add declarative factors (Count / Sum / Avg over the related entities, with a normalization method, `Percentile` is a good default for long-tailed activity counts), set a rubric and bands, publish, and recompute.

---

## Troubleshooting

- **Migrations fail on an empty database** → you skipped step 4. Sonar's migrations need MemberJunction core to exist first.
- **Login redirects then fails** → the `REDIRECT_URI` (`http://localhost:4302/`) is not registered with your auth provider, or `WEB_CLIENT_ID` / `TENANT_ID` are wrong.
- **The authoring agent errors at runtime** → no AI provider is configured. Declarative scoring still works; set `AI_VENDOR_API_KEY__*` to enable the agent.
- **Restarting the API points at the wrong database** → the API reads `DB_DATABASE` from `.env`. To run against a different database temporarily, set `DB_DATABASE` inline (`DB_DATABASE=OtherDb npm run start:api`); an inline value overrides `.env`.

---

## Open App install (reference)

Once the packages are published to npm, the same result is one command against any MemberJunction host:

```bash
mj app install https://github.com/MemberJunction/bizapps-sonar --version <tag>
```

This runs the migrations (including the seed) and wires the server + client bootstrap packages automatically. See the [README](./README.md#install-as-an-open-app).
