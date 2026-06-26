import { ActionResultSimple, RunActionParams } from "@memberjunction/actions-base";
import { BaseAction } from "@memberjunction/actions";
import { SonarActionBase } from "./SonarActionBase";
import { RegisterClass } from "@memberjunction/global";
import { RunView } from "@memberjunction/core";
import { getRegisteredFactorActions, FactorActionContract } from "./SonarFactorAction";

const ACTION_ENTITY = "MJ: Actions";
const ACTION_PARAM_ENTITY = "MJ: Action Params";

/** Contract params the engine injects — hidden from the author's config form. */
const INJECTED_PARAMS = new Set(["AnchorRecordID", "AsOf", "Value", "Explanation"]);

/** One configurable (behavioral) param of a factor-action → one field in the builder form. */
interface CatalogParam {
    name: string;
    description: string | null;
    isRequired: boolean;
    defaultValue: string | null;
}

/** One catalog entry the builder renders: the MJ Action identity + its declared contract + params. */
interface CatalogEntry {
    actionId: string;
    name: string;
    description: string | null;
    contract: FactorActionContract;
    params: CatalogParam[];
}

interface ActionRow {
    ID: string;
    Name: string;
    Description: string | null;
    DriverClass: string | null;
}
interface ActionParamRow {
    ActionID: string;
    Name: string;
    Type: "Input" | "Output" | "Both";
    Description: string | null;
    IsRequired: boolean;
    DefaultValue: string | null;
}

/**
 * Sonar: List Factor Actions — the describe-endpoint behind the builder's "custom signal" catalog
 * (plans/action-factors.md §12). Joins the code-side contracts (every `SonarFactorAction` subclass
 * self-registers its `contract` at load) with the matching MJ Action DB records (by DriverClass) +
 * their behavioral params. Returns a JSON catalog so the UI knows, per action: what it measures /
 * reads / outputs / costs, and which config fields to render. Replaces the UI's earlier
 * param-sniffing (which had no access to the contract — hence the black box). Read-only.
 *
 * Inputs:  none. Output: Result (JSON array of CatalogEntry).
 */
@RegisterClass(BaseAction, "SonarListFactorActions")
export class SonarListFactorActionsAction extends SonarActionBase {
    protected async InternalRunAction(params: RunActionParams): Promise<ActionResultSimple> {
        try {
            const catalog = await this.buildCatalog(params);
            return {
                Success: true,
                ResultCode: "SUCCESS",
                Message: `${catalog.length} factor-action(s) available.`,
                // Type 'Both' so the MJ ActionResolver serializes it into GraphQL ResultData.
                Params: [...params.Params, { Name: "Result", Value: JSON.stringify(catalog), Type: "Both" }],
            };
        } catch (e: unknown) {
            return {
                Success: false,
                ResultCode: "ERROR",
                Message: e instanceof Error ? e.message : String(e),
                Params: params.Params,
            };
        }
    }

    /** Join registered contracts (code) with their Active MJ Action records + params (DB). */
    private async buildCatalog(params: RunActionParams): Promise<CatalogEntry[]> {
        const contractByDriver = new Map(
            getRegisteredFactorActions().map((r) => [r.driverClass, r.contract]),
        );
        if (contractByDriver.size === 0) {
            return [];
        }

        const actions = await this.loadActions([...contractByDriver.keys()], params);
        if (actions.length === 0) {
            return [];
        }
        const paramsByAction = await this.loadParams(actions.map((a) => a.ID), params);

        const catalog: CatalogEntry[] = [];
        for (const a of actions) {
            const contract = contractByDriver.get((a.DriverClass ?? "").trim());
            if (!contract) continue; // registered but no matching contract — skip defensively
            catalog.push({
                actionId: a.ID,
                name: a.Name,
                description: a.Description,
                contract,
                params: this.behavioralParams(paramsByAction.get(a.ID) ?? []),
            });
        }
        return catalog;
    }

    /** Active MJ Action records whose DriverClass matches a registered factor-action. */
    private async loadActions(drivers: string[], params: RunActionParams): Promise<ActionRow[]> {
        const list = drivers.map((d) => `'${d}'`).join(",");
        const res = await new RunView().RunView<ActionRow>(
            {
                EntityName: ACTION_ENTITY,
                ExtraFilter: `DriverClass IN (${list}) AND Status='Active'`,
                Fields: ["ID", "Name", "Description", "DriverClass"],
                OrderBy: "Name ASC",
                ResultType: "simple",
            },
            params.ContextUser,
        );
        if (!res.Success) {
            throw new Error(`Failed to load Actions: ${res.ErrorMessage}`);
        }
        return res.Results ?? [];
    }

    /** Params for the given action IDs, bucketed by ActionID. */
    private async loadParams(
        actionIds: string[],
        params: RunActionParams,
    ): Promise<Map<string, ActionParamRow[]>> {
        const list = actionIds.map((id) => `'${id}'`).join(",");
        const res = await new RunView().RunView<ActionParamRow>(
            {
                EntityName: ACTION_PARAM_ENTITY,
                ExtraFilter: `ActionID IN (${list})`,
                Fields: ["ActionID", "Name", "Type", "Description", "IsRequired", "DefaultValue"],
                ResultType: "simple",
            },
            params.ContextUser,
        );
        const byAction = new Map<string, ActionParamRow[]>();
        for (const row of res.Success ? res.Results ?? [] : []) {
            const bucket = byAction.get(row.ActionID);
            if (bucket) bucket.push(row);
            else byAction.set(row.ActionID, [row]);
        }
        return byAction;
    }

    /** The configurable inputs: Input/Both params minus the injected contract ones. Type/Name come
     *  from fixed-width CHAR columns, so trim before comparing. */
    private behavioralParams(rows: ActionParamRow[]): CatalogParam[] {
        return rows
            .filter((p) => {
                const type = p.Type.trim();
                return (type === "Input" || type === "Both") && !INJECTED_PARAMS.has(p.Name.trim());
            })
            .map((p) => ({
                name: p.Name.trim(),
                description: p.Description,
                isRequired: p.IsRequired,
                defaultValue: p.DefaultValue,
            }));
    }
}
