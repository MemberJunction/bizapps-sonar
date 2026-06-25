import { Injectable } from "@angular/core";
import { Metadata } from "@memberjunction/core";
import { ActionEngineBase } from "@memberjunction/actions-base";
import { GraphQLActionClient, GraphQLDataProvider } from "@memberjunction/graphql-dataprovider";

/** Invoked by registered Name; the engine resolves the ID at runtime (no hardcoded UUID). */
const ACTION_LIST_FACTOR_ACTIONS = "Sonar: List Factor Actions";

/** A factor-action's self-description (mirrors the engine-side FactorActionContract). What the
 *  builder's "What this signal does" panel renders so an action isn't a black box. */
export interface FactorActionContract {
    measures: string;
    reads: string[];
    output: { unit?: string; min?: number; max?: number; higherIsBetter: boolean; sample?: number };
    cost: { deterministic: boolean; externalCalls: boolean; expensive: boolean };
}

/** One configurable (behavioral) param of a factor-action → one field in the builder form. */
export interface FactorActionParam {
    name: string;
    description: string | null;
    isRequired: boolean;
    defaultValue: string | null;
}

/** A factor-action available in the "custom signal" catalog. */
export interface FactorAction {
    id: string;
    name: string;
    description: string | null;
    contract: FactorActionContract;
    params: FactorActionParam[];
}

/** Shape returned by the "Sonar: List Factor Actions" describe-endpoint (keyed on actionId). */
interface CatalogEntry {
    actionId: string;
    name: string;
    description: string | null;
    contract: FactorActionContract;
    params: FactorActionParam[];
}

/**
 * Lists the factor-actions available to the builder's "custom signal" mode by calling the
 * `Sonar: List Factor Actions` describe-endpoint (plans/action-factors.md §12). The endpoint joins
 * each action's code-declared **contract** (what it measures / reads / outputs / costs) with its MJ
 * Action record + behavioral params — so the UI gets the contract it needs to NOT be a black box.
 * (Replaces the earlier approach of reverse-engineering the catalog from raw Action Param rows,
 * which had no access to the contract.)
 */
@Injectable({ providedIn: "root" })
export class ActionCatalogService {
    private cache: FactorAction[] | null = null;
    private readonly actionIdCache = new Map<string, string>();

    /** The factor-action catalog (cached after first load). Empty on any failure (the builder
     *  shows a graceful "no factor-actions" message). */
    public async listFactorActions(forceRefresh = false): Promise<FactorAction[]> {
        if (this.cache && !forceRefresh) {
            return this.cache;
        }
        const actionId = await this.resolveActionId(ACTION_LIST_FACTOR_ACTIONS);
        if (!actionId) {
            return [];
        }
        const result = await this.actionClient().RunAction(actionId, []);
        if (!result.Success) {
            return [];
        }
        const entries = this.extractResult<CatalogEntry[]>(result) ?? [];
        const catalog = entries.map((e) => ({
            id: e.actionId,
            name: e.name,
            description: e.description,
            contract: e.contract,
            params: e.params ?? [],
        }));
        this.cache = catalog;
        return catalog;
    }

    /** A GraphQLActionClient over the app's active data provider. */
    private actionClient(): GraphQLActionClient {
        return new GraphQLActionClient(Metadata.Provider as GraphQLDataProvider);
    }

    /** Resolve (and cache) an Action's ID from its registered Name (no hardcoded UUID). If the
     *  action isn't in the client's cached catalog — e.g. it was just synced this session — force a
     *  one-time refresh from the server before giving up, so a newly-added factor-action shows up
     *  without an app reload. */
    private async resolveActionId(name: string): Promise<string | null> {
        const cached = this.actionIdCache.get(name);
        if (cached) return cached;
        const provider = Metadata.Provider as GraphQLDataProvider;
        await ActionEngineBase.Instance.Config(false, provider.CurrentUser, provider);
        let action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        if (!action) {
            await ActionEngineBase.Instance.Config(true, provider.CurrentUser, provider);
            action = ActionEngineBase.Instance.Actions.find((a) => a.Name === name);
        }
        if (action) this.actionIdCache.set(name, action.ID);
        return action?.ID ?? null;
    }

    /** Pull our `Result` output (JSON) from an action result — same normalization SonarEngineService
     *  uses: MJ returns 'Both' params via GraphQL ResultData as an array or index-keyed object. */
    private extractResult<T>(result: { Result?: unknown }): T | null {
        const data = result.Result;
        if (data == null) return null;
        const entries = (Array.isArray(data) ? data : typeof data === "object" ? Object.values(data) : []) as Array<{ Name?: string; Value?: unknown }>;
        const param = entries.find((p) => p && typeof p === "object" && p.Name === "Result");
        const raw: unknown = param ? param.Value : data;
        if (raw == null) return null;
        return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
    }
}
