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
 * config, …) stay in each script — only the connection plumbing is shared. Connection settings come
 * from the DB_* env vars (the same names mj.config.cjs reads), overridable via opts. The password is
 * NEVER defaulted — a committed fallback credential is exactly what this replaces.
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";

/** Connection config for the dev/test scripts, read from DB_* env vars. Throws a clear error when
 *  DB_PASSWORD is unset: load the repo .env first (`set -a && . ./.env && set +a`) or export it. */
export function dbConfigFromEnv(overrides = {}) {
    const password = overrides.password ?? process.env.DB_PASSWORD;
    if (!password) {
        throw new Error(
            "DB_PASSWORD is not set. Load the repo .env first (set -a && . ./.env && set +a) or export DB_PASSWORD — credentials are never hardcoded in these scripts.",
        );
    }
    return {
        user: overrides.user ?? process.env.DB_USERNAME ?? "sa",
        password,
        server: overrides.server ?? process.env.DB_HOST ?? "localhost",
        port: overrides.port ?? parseInt(process.env.DB_PORT ?? "1433", 10),
        database: overrides.database ?? process.env.DB_DATABASE ?? "Sonar_Demo",
        options: { trustServerCertificate: true, encrypt: false },
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
