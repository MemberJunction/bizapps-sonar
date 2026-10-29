/**
 * Shared bootstrap for the dev/test scripts in this folder. Every script repeated the same
 * mssql-connect + setupSQLServerClient + UserCache dance; it lives here once now.
 *
 * Usage:
 *   import { bootstrap } from "./lib/bootstrap.mjs";
 *   const { pool, user } = await bootstrap();
 *   // ... do work ...
 *   await pool.close();
 *
 * Domain side-effect imports (core-entities, sonar-entities, sonar-actions, ai-gemini, AIEngine
 * config, …) stay in each script — only the connection plumbing is shared. Creds come from the
 * DB_* env vars (the gitignored repo-root .env the mj CLI reads); non-secret parts default to the
 * local Sonar_Demo sandbox, but DB_PASSWORD has NO fallback. Override via opts or DB_* env vars.
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";

/**
 * mssql connection config from the DB_* env vars — the same names mj.config.cjs and
 * ci/generate_teardown.mjs read, held in the gitignored repo-root .env. DB_PASSWORD is REQUIRED
 * (unless the caller overrides it): the script fails here, naming the variable, rather than
 * falling back to a hardcoded password. Non-secret parts keep local-sandbox defaults.
 */
export function dbConfigFromEnv(overrides = {}) {
    if (!process.env.DB_PASSWORD && overrides.password == null) {
        throw new Error(
            "DB_PASSWORD is not set. Export it (it lives in the gitignored repo-root .env the mj CLI "
            + "reads) before running this script — these scripts never fall back to a hardcoded password.");
    }
    const defined = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined));
    return {
        user: process.env.DB_USERNAME ?? "sa",
        password: process.env.DB_PASSWORD,
        server: process.env.DB_HOST ?? "localhost",
        port: parseInt(process.env.DB_PORT ?? "1433", 10),
        database: process.env.DB_DATABASE ?? "Sonar_Demo",
        options: { trustServerCertificate: true, encrypt: false },
        ...defined,
    };
}

export async function bootstrap(opts = {}) {
    const pool = new sql.ConnectionPool(dbConfigFromEnv(opts));
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    return { pool, user };
}
