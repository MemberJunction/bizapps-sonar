import {
    BaseEngine,
    BaseEnginePropertyConfig,
    BaseEntity,
    EntityInfo,
    EntityPermissionType,
    IMetadataProvider,
    ProviderType,
    RegisterForStartup,
    UserInfo,
} from '@memberjunction/core';
import type { Observable } from 'rxjs';
import {
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreBandSetEntity,
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarTimeWindowEntity,
} from '../generated/entity_subclasses';

/**
 * Canonical MJ entity names for Sonar's bounded configuration & taxonomy tables.
 * Unbounded runtime/audit/snapshot tables (Scores, Score Factor Contributions,
 * Score Histories, Score Band Transitions, Score Recompute Runs, Score Model Audit Events,
 * Score Model Versions) are intentionally excluded from bulk engine caching.
 */
export const SONAR_CACHED_ENTITY_NAMES = {
    ScoreModels: 'MJ_BizApps_Sonar: Score Models',
    ScoreBandSets: 'MJ_BizApps_Sonar: Score Band Sets',
    ScoreBands: 'MJ_BizApps_Sonar: Score Bands',
    TimeWindows: 'MJ_BizApps_Sonar: Time Windows',
    ModelRelatedEntities: 'MJ_BizApps_Sonar: Model Related Entities',
    Factors: 'MJ_BizApps_Sonar: Factors',
    ModelFactors: 'MJ_BizApps_Sonar: Model Factors',
} as const;

interface CachedEntityDefinition {
    readonly propertyName:
        | '_ScoreModels'
        | '_ScoreBandSets'
        | '_ScoreBands'
        | '_TimeWindows'
        | '_ModelRelatedEntities'
        | '_Factors'
        | '_ModelFactors';
    readonly entityName: (typeof SONAR_CACHED_ENTITY_NAMES)[keyof typeof SONAR_CACHED_ENTITY_NAMES];
    readonly defaultCacheLocal: boolean;
}

const CACHED_ENTITY_DEFINITIONS: readonly CachedEntityDefinition[] = [
    {
        propertyName: '_ScoreModels',
        entityName: SONAR_CACHED_ENTITY_NAMES.ScoreModels,
        defaultCacheLocal: true,
    },
    {
        propertyName: '_ScoreBandSets',
        entityName: SONAR_CACHED_ENTITY_NAMES.ScoreBandSets,
        defaultCacheLocal: true,
    },
    {
        propertyName: '_ScoreBands',
        entityName: SONAR_CACHED_ENTITY_NAMES.ScoreBands,
        defaultCacheLocal: true,
    },
    {
        propertyName: '_TimeWindows',
        entityName: SONAR_CACHED_ENTITY_NAMES.TimeWindows,
        defaultCacheLocal: true,
    },
    {
        propertyName: '_ModelRelatedEntities',
        entityName: SONAR_CACHED_ENTITY_NAMES.ModelRelatedEntities,
        defaultCacheLocal: true,
    },
    {
        propertyName: '_Factors',
        entityName: SONAR_CACHED_ENTITY_NAMES.Factors,
        defaultCacheLocal: true,
    },
    {
        propertyName: '_ModelFactors',
        entityName: SONAR_CACHED_ENTITY_NAMES.ModelFactors,
        defaultCacheLocal: true,
    },
];

function normalizeKey(value: string | null | undefined): string {
    return value ? value.trim().toLowerCase() : '';
}

/**
 * Shared client + server metadata engine for Sonar's bounded configuration & taxonomy tables.
 *
 * Lives in `@mj-biz-apps/sonar-entities` (`shared` tier in `mj-app.json`) so both Angular
 * (`@mj-biz-apps/sonar-ng`) and server packages (`sonar-engine`, `sonar-actions`,
 * `sonar-core-entities-server`, `sonar-server`) share one cached metadata source without
 * violating the client/server package boundary.
 *
 * Design guarantees:
 * - **Bounded taxonomy/config only**: caches Score Models, Score Band Sets, Score Bands,
 *   Time Windows, Model Related Entities, Factors, and Model Factors. Never caches unbounded
 *   runtime output tables (Scores, Contributions, Histories, Transitions, Recompute Runs,
 *   Audit Events, or Score Model Versions).
 * - **Multi-provider / impersonation safe**: tracks explicit `provider` passed to `Config()`,
 *   overrides `ProviderToUse`, passes `provider` unchanged to `super.Load(...)`, and forces
 *   a refresh when switching providers or client users.
 * - **RLS-safe `CacheLocal`**: defaults to `CacheLocal: true` for global non-RLS config tables,
 *   and dynamically drops `CacheLocal` to `false` for any entity with Row-Level Security filters.
 * - **`CanRead` gating**: skips entities absent from metadata or unreadable by the caller so
 *   restricted roles degrade gracefully instead of failing engine startup.
 */
@RegisterForStartup({ deferred: true })
export class SonarEngineBase extends BaseEngine<SonarEngineBase> {
    private _ScoreModels: mjBizAppsSonarScoreModelEntity[] = [];
    private _ScoreBandSets: mjBizAppsSonarScoreBandSetEntity[] = [];
    private _ScoreBands: mjBizAppsSonarScoreBandEntity[] = [];
    private _TimeWindows: mjBizAppsSonarTimeWindowEntity[] = [];
    private _ModelRelatedEntities: mjBizAppsSonarModelRelatedEntityEntity[] = [];
    private _Factors: mjBizAppsSonarFactorEntity[] = [];
    private _ModelFactors: mjBizAppsSonarModelFactorEntity[] = [];

    private _activeProvider: IMetadataProvider | null = null;
    private _lastClientUserId: string | null = null;

    // Derived O(1) lookup indexes, rebuilt on load and on every BaseEntity cache mutation.
    private _modelsById = new Map<string, mjBizAppsSonarScoreModelEntity>();
    private _modelsByName = new Map<string, mjBizAppsSonarScoreModelEntity>();
    private _bandSetsById = new Map<string, mjBizAppsSonarScoreBandSetEntity>();
    private _bandsById = new Map<string, mjBizAppsSonarScoreBandEntity>();
    private _bandsBySetId = new Map<string, mjBizAppsSonarScoreBandEntity[]>();
    private _timeWindowsById = new Map<string, mjBizAppsSonarTimeWindowEntity>();
    private _relatedEntitiesById = new Map<string, mjBizAppsSonarModelRelatedEntityEntity>();
    private _relatedEntitiesByModelId = new Map<string, mjBizAppsSonarModelRelatedEntityEntity[]>();
    private _factorsById = new Map<string, mjBizAppsSonarFactorEntity>();
    private _factorsByModelId = new Map<string, mjBizAppsSonarFactorEntity[]>();
    private _modelFactorsById = new Map<string, mjBizAppsSonarModelFactorEntity>();
    private _modelFactorsByModelId = new Map<string, mjBizAppsSonarModelFactorEntity[]>();

    public static get Instance(): SonarEngineBase {
        return super.getInstance<SonarEngineBase>();
    }

    /**
     * Tracks the most recent explicit provider passed to `Config()`, ensuring multi-provider,
     * impersonation, and test-harness callers do not remain pinned to the first provider bound
     * by `BaseEngine.SetProvider()`.
     */
    public override get ProviderToUse(): IMetadataProvider {
        return this._activeProvider ?? super.ProviderToUse;
    }

    /**
     * Load (or refresh) Sonar's bounded configuration & taxonomy entities in a single batched
     * `RunViews` round trip via `BaseEngine.Load`.
     */
    public async Config(
        forceRefresh = false,
        contextUser?: UserInfo,
        provider?: IMetadataProvider,
    ): Promise<void> {
        const providerChanged =
            provider !== undefined &&
            provider !== this._activeProvider &&
            (this._activeProvider !== null || this.Loaded);
        if (provider !== undefined) {
            this._activeProvider = provider;
        }

        const activeProvider = this.ProviderToUse;
        const effectiveUser = contextUser ?? activeProvider?.CurrentUser;
        const incomingUserId = effectiveUser?.ID ?? null;
        const isDatabaseProvider = activeProvider?.ProviderType === ProviderType.Database;
        const clientUserChanged =
            !isDatabaseProvider &&
            this.Loaded &&
            incomingUserId !== null &&
            this._lastClientUserId !== null &&
            incomingUserId !== this._lastClientUserId;

        const effectiveForceRefresh = forceRefresh || providerChanged || clientUserChanged;
        const configs = this.buildEntityConfigs(activeProvider, effectiveUser);

        // Pass `provider` unchanged (never hardcode Metadata.Provider) so BaseEngine preserves
        // caller-provided provider semantics while our ProviderToUse override tracks switches.
        await super.Load(
            configs,
            provider as IMetadataProvider,
            effectiveForceRefresh,
            contextUser,
        );

        if (incomingUserId !== null) {
            this._lastClientUserId = incomingUserId;
        }
        this.rebuildIndexes();
    }

    /**
     * Intentionally does NOT override `AdditionalLoading` so `BaseEngine.canUseImmediateMutation()`
     * stays true for all 7 entity configs — allowing local `BaseEntity.Save()` / `.Delete()` events
     * to update the in-memory arrays synchronously with zero debounce delay. Derived lookup maps are
     * rebuilt synchronously in `Config()` and `NotifyDataChange()`.
     */
    protected override NotifyDataChange(
        config: BaseEnginePropertyConfig,
        data: unknown[],
        changeType: 'refresh' | 'add' | 'update' | 'delete' = 'refresh',
        affectedEntity?: BaseEntity,
    ): void {
        this.rebuildIndexes();
        super.NotifyDataChange(config, data, changeType, affectedEntity);
    }

    protected override GetDerivedStateCensus(): Record<string, number> {
        return {
            modelsById: this._modelsById.size,
            bandSetsById: this._bandSetsById.size,
            bandsBySetId: this._bandsBySetId.size,
            timeWindowsById: this._timeWindowsById.size,
            relatedEntitiesByModelId: this._relatedEntitiesByModelId.size,
            factorsById: this._factorsById.size,
            modelFactorsByModelId: this._modelFactorsByModelId.size,
        };
    }

    // =========================================================================
    // Cached Collections
    // =========================================================================

    public get ScoreModels(): mjBizAppsSonarScoreModelEntity[] {
        return this._ScoreModels;
    }

    public get ScoreBandSets(): mjBizAppsSonarScoreBandSetEntity[] {
        return this._ScoreBandSets;
    }

    public get ScoreBands(): mjBizAppsSonarScoreBandEntity[] {
        return this._ScoreBands;
    }

    public get TimeWindows(): mjBizAppsSonarTimeWindowEntity[] {
        return this._TimeWindows;
    }

    public get ModelRelatedEntities(): mjBizAppsSonarModelRelatedEntityEntity[] {
        return this._ModelRelatedEntities;
    }

    public get Factors(): mjBizAppsSonarFactorEntity[] {
        return this._Factors;
    }

    public get ModelFactors(): mjBizAppsSonarModelFactorEntity[] {
        return this._ModelFactors;
    }

    // =========================================================================
    // Reactive Observables (BehaviorSubject semantics via BaseEngine.ObserveProperty)
    // =========================================================================

    public get ScoreModels$(): Observable<mjBizAppsSonarScoreModelEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarScoreModelEntity>('_ScoreModels');
    }

    public get ScoreBandSets$(): Observable<mjBizAppsSonarScoreBandSetEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarScoreBandSetEntity>('_ScoreBandSets');
    }

    public get ScoreBands$(): Observable<mjBizAppsSonarScoreBandEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarScoreBandEntity>('_ScoreBands');
    }

    public get TimeWindows$(): Observable<mjBizAppsSonarTimeWindowEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarTimeWindowEntity>('_TimeWindows');
    }

    public get ModelRelatedEntities$(): Observable<mjBizAppsSonarModelRelatedEntityEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarModelRelatedEntityEntity>('_ModelRelatedEntities');
    }

    public get Factors$(): Observable<mjBizAppsSonarFactorEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarFactorEntity>('_Factors');
    }

    public get ModelFactors$(): Observable<mjBizAppsSonarModelFactorEntity[]> {
        return this.ObserveProperty<mjBizAppsSonarModelFactorEntity>('_ModelFactors');
    }

    // =========================================================================
    // Synchronous O(1) Lookup Helpers
    // =========================================================================

    public GetModelById(id: string | null | undefined): mjBizAppsSonarScoreModelEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._modelsById.get(key) : undefined;
    }

    public GetModelByName(name: string | null | undefined): mjBizAppsSonarScoreModelEntity | undefined {
        const key = normalizeKey(name);
        return key ? this._modelsByName.get(key) : undefined;
    }

    public GetActiveModels(): mjBizAppsSonarScoreModelEntity[] {
        return this._ScoreModels.filter((m) => m.Status === 'Active');
    }

    public GetBandSetById(id: string | null | undefined): mjBizAppsSonarScoreBandSetEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._bandSetsById.get(key) : undefined;
    }

    public GetBandById(id: string | null | undefined): mjBizAppsSonarScoreBandEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._bandsById.get(key) : undefined;
    }

    /** Bands in a band set, sorted low-to-high by `MinScore`. */
    public GetBandsForBandSet(bandSetId: string | null | undefined): mjBizAppsSonarScoreBandEntity[] {
        const key = normalizeKey(bandSetId);
        return key ? [...(this._bandsBySetId.get(key) ?? [])] : [];
    }

    /** Bands for a model (resolved via `model.BandSetID`), sorted low-to-high by `MinScore`. */
    public GetBandsForModel(modelId: string | null | undefined): mjBizAppsSonarScoreBandEntity[] {
        const model = this.GetModelById(modelId);
        return model?.BandSetID ? this.GetBandsForBandSet(model.BandSetID) : [];
    }

    /**
     * Expand a list of Band IDs to every band in each referenced band set, keyed by exact Band ID.
     * Supports rank-based color mapping with full band-set context at zero DB cost.
     */
    public GetBandMapForBandIds(
        bandIds: readonly (string | null | undefined)[],
    ): Map<string, mjBizAppsSonarScoreBandEntity> {
        const result = new Map<string, mjBizAppsSonarScoreBandEntity>();
        const bandSetKeys = new Set<string>();
        for (const rawId of bandIds) {
            const band = this.GetBandById(rawId);
            if (!band) continue;
            result.set(band.ID, band);
            if (band.BandSetID) {
                bandSetKeys.add(normalizeKey(band.BandSetID));
            }
        }
        for (const setKey of bandSetKeys) {
            for (const band of this._bandsBySetId.get(setKey) ?? []) {
                result.set(band.ID, band);
            }
        }
        return result;
    }

    public GetTimeWindowById(id: string | null | undefined): mjBizAppsSonarTimeWindowEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._timeWindowsById.get(key) : undefined;
    }

    /** All cached time windows sorted alphabetically by `Name`. */
    public GetTimeWindowsSorted(): mjBizAppsSonarTimeWindowEntity[] {
        return [...this._TimeWindows].sort((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
    }

    public GetModelRelatedEntityById(
        id: string | null | undefined,
    ): mjBizAppsSonarModelRelatedEntityEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._relatedEntitiesById.get(key) : undefined;
    }

    /** Data sources wired into a model, sorted alphabetically by `Alias`. */
    public GetRelatedEntitiesForModel(
        modelId: string | null | undefined,
    ): mjBizAppsSonarModelRelatedEntityEntity[] {
        const key = normalizeKey(modelId);
        return key ? [...(this._relatedEntitiesByModelId.get(key) ?? [])] : [];
    }

    public GetFactorById(id: string | null | undefined): mjBizAppsSonarFactorEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._factorsById.get(key) : undefined;
    }

    /** All factors owned by a model. */
    public GetFactorsForModel(modelId: string | null | undefined): mjBizAppsSonarFactorEntity[] {
        const key = normalizeKey(modelId);
        return key ? [...(this._factorsByModelId.get(key) ?? [])] : [];
    }

    public GetModelFactorById(
        id: string | null | undefined,
    ): mjBizAppsSonarModelFactorEntity | undefined {
        const key = normalizeKey(id);
        return key ? this._modelFactorsById.get(key) : undefined;
    }

    /** Rubric bindings (`ModelFactor` rows) for a model, sorted by `DisplayOrder ASC`. */
    public GetModelFactorsForModel(
        modelId: string | null | undefined,
    ): mjBizAppsSonarModelFactorEntity[] {
        const key = normalizeKey(modelId);
        return key ? [...(this._modelFactorsByModelId.get(key) ?? [])] : [];
    }

    /** Signal counts keyed by `ScoreModelID` (for model navigation sidebars). */
    public GetSignalCountsByModel(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const mf of this._ModelFactors) {
            counts.set(mf.ScoreModelID, (counts.get(mf.ScoreModelID) ?? 0) + 1);
        }
        return counts;
    }

    // =========================================================================
    // Internal Config Building & Index Maintenance
    // =========================================================================

    private buildEntityConfigs(
        activeProvider: IMetadataProvider | undefined,
        effectiveUser: UserInfo | undefined,
    ): Partial<BaseEnginePropertyConfig>[] {
        const entities = activeProvider?.Entities ?? [];
        const hasMetadataCatalog = entities.length > 0;
        const configs: Partial<BaseEnginePropertyConfig>[] = [];

        for (const def of CACHED_ENTITY_DEFINITIONS) {
            if (hasMetadataCatalog) {
                const entityInfo = entities.find((e) => e.Name === def.entityName);
                if (!entityInfo || !this.canReadEntity(entityInfo, effectiveUser)) {
                    this.clearPropertyArray(def.propertyName);
                    continue;
                }
                const cacheLocal =
                    def.defaultCacheLocal && !this.entityHasRowLevelSecurity(entityInfo, effectiveUser);
                configs.push({
                    Type: 'entity',
                    EntityName: def.entityName,
                    PropertyName: def.propertyName,
                    AutoRefresh: true,
                    CacheLocal: cacheLocal,
                });
            } else {
                configs.push({
                    Type: 'entity',
                    EntityName: def.entityName,
                    PropertyName: def.propertyName,
                    AutoRefresh: true,
                    CacheLocal: def.defaultCacheLocal,
                });
            }
        }
        return configs;
    }

    private canReadEntity(entityInfo: EntityInfo, user: UserInfo | undefined): boolean {
        if (!user) {
            return true;
        }
        const permissions = entityInfo.GetUserPermisions(user);
        return permissions?.CanRead === true;
    }

    private entityHasRowLevelSecurity(
        entityInfo: EntityInfo,
        user: UserInfo | undefined,
    ): boolean {
        if (
            Array.isArray(entityInfo.Permissions) &&
            entityInfo.Permissions.some((p) => Boolean(p.ReadRLSFilterID))
        ) {
            return true;
        }
        if (user && typeof entityInfo.GetUserRowLevelSecurityInfo === 'function') {
            const filters = entityInfo.GetUserRowLevelSecurityInfo(user, EntityPermissionType.Read);
            if (Array.isArray(filters) && filters.length > 0) {
                return true;
            }
        }
        return false;
    }

    private clearPropertyArray(propertyName: CachedEntityDefinition['propertyName']): void {
        switch (propertyName) {
            case '_ScoreModels':
                this._ScoreModels = [];
                break;
            case '_ScoreBandSets':
                this._ScoreBandSets = [];
                break;
            case '_ScoreBands':
                this._ScoreBands = [];
                break;
            case '_TimeWindows':
                this._TimeWindows = [];
                break;
            case '_ModelRelatedEntities':
                this._ModelRelatedEntities = [];
                break;
            case '_Factors':
                this._Factors = [];
                break;
            case '_ModelFactors':
                this._ModelFactors = [];
                break;
        }
    }

    private rebuildIndexes(): void {
        this.indexModels();
        this.indexBandSetsAndBands();
        this.indexTimeWindows();
        this.indexRelatedEntities();
        this.indexFactors();
        this.indexModelFactors();
    }

    private indexModels(): void {
        this._modelsById = new Map();
        this._modelsByName = new Map();
        for (const m of this._ScoreModels) {
            this._modelsById.set(normalizeKey(m.ID), m);
            if (m.Name) {
                this._modelsByName.set(normalizeKey(m.Name), m);
            }
        }
    }

    private indexBandSetsAndBands(): void {
        this._bandSetsById = new Map();
        for (const bs of this._ScoreBandSets) {
            this._bandSetsById.set(normalizeKey(bs.ID), bs);
        }

        this._bandsById = new Map();
        this._bandsBySetId = new Map();
        for (const b of this._ScoreBands) {
            this._bandsById.set(normalizeKey(b.ID), b);
            const setKey = normalizeKey(b.BandSetID);
            if (setKey) {
                const list = this._bandsBySetId.get(setKey) ?? [];
                list.push(b);
                this._bandsBySetId.set(setKey, list);
            }
        }
        for (const list of this._bandsBySetId.values()) {
            list.sort((a, b) => (a.MinScore ?? 0) - (b.MinScore ?? 0));
        }
    }

    private indexTimeWindows(): void {
        this._timeWindowsById = new Map();
        for (const tw of this._TimeWindows) {
            this._timeWindowsById.set(normalizeKey(tw.ID), tw);
        }
    }

    private indexRelatedEntities(): void {
        this._relatedEntitiesById = new Map();
        this._relatedEntitiesByModelId = new Map();
        for (const mre of this._ModelRelatedEntities) {
            this._relatedEntitiesById.set(normalizeKey(mre.ID), mre);
            const modelKey = normalizeKey(mre.ScoreModelID);
            if (modelKey) {
                const list = this._relatedEntitiesByModelId.get(modelKey) ?? [];
                list.push(mre);
                this._relatedEntitiesByModelId.set(modelKey, list);
            }
        }
        for (const list of this._relatedEntitiesByModelId.values()) {
            list.sort((a, b) => (a.Alias ?? '').localeCompare(b.Alias ?? ''));
        }
    }

    private indexFactors(): void {
        this._factorsById = new Map();
        this._factorsByModelId = new Map();
        for (const f of this._Factors) {
            this._factorsById.set(normalizeKey(f.ID), f);
            const modelKey = normalizeKey(f.ScoreModelID);
            if (modelKey) {
                const list = this._factorsByModelId.get(modelKey) ?? [];
                list.push(f);
                this._factorsByModelId.set(modelKey, list);
            }
        }
    }

    private indexModelFactors(): void {
        this._modelFactorsById = new Map();
        this._modelFactorsByModelId = new Map();
        for (const mf of this._ModelFactors) {
            this._modelFactorsById.set(normalizeKey(mf.ID), mf);
            const modelKey = normalizeKey(mf.ScoreModelID);
            if (modelKey) {
                const list = this._modelFactorsByModelId.get(modelKey) ?? [];
                list.push(mf);
                this._modelFactorsByModelId.set(modelKey, list);
            }
        }
        for (const list of this._modelFactorsByModelId.values()) {
            list.sort((a, b) => (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0));
        }
    }
}
