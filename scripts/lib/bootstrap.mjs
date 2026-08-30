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
 * config, …) stay in each script — only the connection plumbing is shared. Creds default to the
 * local Sonar_Demo sandbox; override via opts or DB_* env vars.
 */
import sql from "mssql";
import { setupSQLServerClient, SQLServerProviderConfigData, UserCache } from "@memberjunction/sqlserver-dataprovider";

export async function bootstrap(opts = {}) {
    const cfg = {
        user: opts.user ?? process.env.DB_USERNAME ?? "sa",
        password: opts.password ?? process.env.DB_PASSWORD ?? "Securepassword!23",
        server: opts.server ?? process.env.DB_HOST ?? "localhost",
        port: opts.port ?? parseInt(process.env.DB_PORT ?? "1433", 10),
        database: opts.database ?? "Sonar_Demo",
    };
    const pool = new sql.ConnectionPool({
        user: cfg.user, password: cfg.password, server: cfg.server, port: cfg.port,
        database: cfg.database, options: { trustServerCertificate: true, encrypt: false },
    });
    await pool.connect();
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, "__mj"));
    await UserCache.Instance.Refresh(pool);
    const user = UserCache.Users.find((u) => u?.Type?.trim().toLowerCase() === "owner") ?? UserCache.Users[0];
    return { pool, user };
}
