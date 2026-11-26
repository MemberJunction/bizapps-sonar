import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    BaseEngine,
    BaseEnginePropertyConfig,
    EntityInfo,
    EntityPermissionType,
    IMetadataProvider,
    ProviderType,
    UserInfo,
} from '@memberjunction/core';
import {
    SONAR_CACHED_ENTITY_NAMES,
    SonarEngineBase,
} from '../engine/SonarEngineBase';
import type {
    mjBizAppsSonarFactorEntity,
    mjBizAppsSonarModelFactorEntity,
    mjBizAppsSonarModelRelatedEntityEntity,
    mjBizAppsSonarScoreBandEntity,
    mjBizAppsSonarScoreBandSetEntity,
    mjBizAppsSonarScoreModelEntity,
    mjBizAppsSonarTimeWindowEntity,
} from '../generated/entity_subclasses';

interface RecordedLoadCall {
    configs: Partial<BaseEnginePropertyConfig>[];
    provider: IMetadataProvider | undefined;
    forceRefresh: boolean | undefined;
    contextUser: UserInfo | undefined;
}

interface MockEntityConfig {
    name: string;
    canRead?: boolean;
    hasPermissionRls?: boolean;
    userRlsFilters?: Array<{ ID: string }>;
}

function makeMockEntity(cfg: MockEntityConfig): EntityInfo {
    const canRead = cfg.canRead ?? true;
    return {
        Name: cfg.name,
        Permissions: cfg.hasPermissionRls ? [{ ReadRLSFilterID: 'rls-filter-1' }] : [],
        GetUserPermisions: () => ({ CanRead: canRead }),
        GetUserRowLevelSecurityInfo: (_user: UserInfo, _type: EntityPermissionType) =>
            cfg.userRlsFilters ?? [],
    } as unknown as EntityInfo;
}

function makeMockProvider(opts: {
    providerType?: ProviderType;
    currentUser?: UserInfo;
    entities?: EntityInfo[];
}): IMetadataProvider {
    return {
        ProviderType: opts.providerType ?? ProviderType.Network,
        CurrentUser: opts.currentUser,
        Entities: opts.entities ?? [],
    } as unknown as IMetadataProvider;
}

function makeUser(id: string): UserInfo {
    return { ID: id, Name: `User ${id}`, Email: `${id}@example.com` } as UserInfo;
}

/** Construct a fresh SonarEngineBase subclass instance for isolated unit testing. */
class TestableSonarEngine extends SonarEngineBase {
    public constructor() {
        super();
    }

    public seedData(data: {
        models?: Partial<mjBizAppsSonarScoreModelEntity>[];
        bandSets?: Partial<mjBizAppsSonarScoreBandSetEntity>[];
        bands?: Partial<mjBizAppsSonarScoreBandEntity>[];
        timeWindows?: Partial<mjBizAppsSonarTimeWindowEntity>[];
        relatedEntities?: Partial<mjBizAppsSonarModelRelatedEntityEntity>[];
        factors?: Partial<mjBizAppsSonarFactorEntity>[];
        modelFactors?: Partial<mjBizAppsSonarModelFactorEntity>[];
    }): void {
        const target = this as unknown as Record<string, unknown>;
        if (data.models) target['_ScoreModels'] = data.models;
        if (data.bandSets) target['_ScoreBandSets'] = data.bandSets;
        if (data.bands) target['_ScoreBands'] = data.bands;
        if (data.timeWindows) target['_TimeWindows'] = data.timeWindows;
        if (data.relatedEntities) target['_ModelRelatedEntities'] = data.relatedEntities;
        if (data.factors) target['_Factors'] = data.factors;
        if (data.modelFactors) target['_ModelFactors'] = data.modelFactors;
    }

    public triggerNotifyDataChange(config: BaseEnginePropertyConfig, data: unknown[]): void {
        this.NotifyDataChange(config, data, 'refresh');
    }

    public readDerivedCensus(): Record<string, number> {
        return this.GetDerivedStateCensus();
    }
}

describe('SonarEngineBase', () => {
    let engine: TestableSonarEngine;
    let loadCalls: RecordedLoadCall[];
    let fakeLoaded: boolean;

    beforeEach(() => {
        engine = new TestableSonarEngine();
        loadCalls = [];
        fakeLoaded = false;

        vi.spyOn(engine, 'Loaded', 'get').mockImplementation(() => fakeLoaded);
        vi.spyOn(
            BaseEngine.prototype as unknown as {
                Load: (
                    configs: Partial<BaseEnginePropertyConfig>[],
                    provider: IMetadataProvider,
                    forceRefresh?: boolean,
                    contextUser?: UserInfo,
                ) => Promise<void>;
            },
            'Load',
        ).mockImplementation(async (configs, provider, forceRefresh, contextUser) => {
            loadCalls.push({ configs, provider, forceRefresh, contextUser });
            fakeLoaded = true;
        });
    });

    it('exposes a BaseSingleton Instance', () => {
        expect(SonarEngineBase.Instance).toBe(SonarEngineBase.Instance);
    });

    it('caches only bounded taxonomy/config entities and excludes unbounded runtime tables', async () => {
        const provider = makeMockProvider({ entities: [] });
        await engine.Config(false, makeUser('u-1'), provider);

        expect(loadCalls).toHaveLength(1);
        const entityNames = loadCalls[0].configs.map((c) => c.EntityName);
        expect(entityNames).toEqual([
            SONAR_CACHED_ENTITY_NAMES.ScoreModels,
            SONAR_CACHED_ENTITY_NAMES.ScoreBandSets,
            SONAR_CACHED_ENTITY_NAMES.ScoreBands,
            SONAR_CACHED_ENTITY_NAMES.TimeWindows,
            SONAR_CACHED_ENTITY_NAMES.ModelRelatedEntities,
            SONAR_CACHED_ENTITY_NAMES.Factors,
            SONAR_CACHED_ENTITY_NAMES.ModelFactors,
        ]);

        // Unbounded runtime/audit/snapshot tables must NEVER be bulk-cached.
        const forbidden = [
            'MJ_BizApps_Sonar: Scores',
            'MJ_BizApps_Sonar: Score Factor Contributions',
            'MJ_BizApps_Sonar: Score Histories',
            'MJ_BizApps_Sonar: Score Band Transitions',
            'MJ_BizApps_Sonar: Score Recompute Runs',
            'MJ_BizApps_Sonar: Score Model Audit Events',
            'MJ_BizApps_Sonar: Score Model Versions',
        ];
        for (const name of forbidden) {
            expect(entityNames).not.toContain(name);
        }

        // All non-RLS config entities default to AutoRefresh: true and CacheLocal: true.
        for (const cfg of loadCalls[0].configs) {
            expect(cfg.AutoRefresh).toBe(true);
            expect(cfg.CacheLocal).toBe(true);
        }
    });

    it('tracks active ProviderToUse, passes provider unchanged to super.Load, and forces refresh on provider switch', async () => {
        const providerA = makeMockProvider({ currentUser: makeUser('u-a') });
        const providerB = makeMockProvider({ currentUser: makeUser('u-b') });

        // Undefined provider passes through unchanged (never hardcoded to Metadata.Provider).
        await engine.Config(false, makeUser('u-0'), undefined);
        expect(loadCalls[0].provider).toBeUndefined();
        expect(loadCalls[0].forceRefresh).toBe(false);

        // Switching to explicit providerA updates ProviderToUse and forces refresh because already Loaded.
        await engine.Config(false, makeUser('u-a'), providerA);
        expect(engine.ProviderToUse).toBe(providerA);
        expect(loadCalls[1].provider).toBe(providerA);
        expect(loadCalls[1].forceRefresh).toBe(true);

        // Re-calling with same providerA and same user does not force refresh.
        await engine.Config(false, makeUser('u-a'), providerA);
        expect(loadCalls[2].forceRefresh).toBe(false);

        // Switching to providerB updates ProviderToUse and forces refresh.
        await engine.Config(false, makeUser('u-b'), providerB);
        expect(engine.ProviderToUse).toBe(providerB);
        expect(loadCalls[3].provider).toBe(providerB);
        expect(loadCalls[3].forceRefresh).toBe(true);
    });

    it('forces refresh on client user switch, but preserves shared server cache across users on Database provider', async () => {
        const netProvider = makeMockProvider({ providerType: ProviderType.Network });
        await engine.Config(false, makeUser('client-1'), netProvider);
        expect(loadCalls[0].forceRefresh).toBe(false);

        await engine.Config(false, makeUser('client-2'), netProvider);
        expect(loadCalls[1].forceRefresh).toBe(true);

        // On Database provider (server), switching contextUser does not force-reload the process-wide cache.
        const dbEngine = new TestableSonarEngine();
        let dbLoaded = false;
        vi.spyOn(dbEngine, 'Loaded', 'get').mockImplementation(() => dbLoaded);
        const dbProvider = makeMockProvider({ providerType: ProviderType.Database });

        const startIdx = loadCalls.length;
        await dbEngine.Config(false, makeUser('srv-user-1'), dbProvider);
        dbLoaded = true;
        await dbEngine.Config(false, makeUser('srv-user-2'), dbProvider);
        expect(loadCalls[startIdx].forceRefresh).toBe(false);
        expect(loadCalls[startIdx + 1].forceRefresh).toBe(false);
    });

    it('sets CacheLocal: false dynamically for any entity protected by RLS while keeping CacheLocal: true for global entities', async () => {
        const entities = Object.values(SONAR_CACHED_ENTITY_NAMES).map((name) => {
            if (name === SONAR_CACHED_ENTITY_NAMES.ScoreModels) {
                return makeMockEntity({ name, hasPermissionRls: true });
            }
            if (name === SONAR_CACHED_ENTITY_NAMES.Factors) {
                return makeMockEntity({ name, userRlsFilters: [{ ID: 'rls-2' }] });
            }
            return makeMockEntity({ name });
        });
        const provider = makeMockProvider({ entities });
        await engine.Config(false, makeUser('u-rls'), provider);

        const byEntity = new Map(loadCalls[0].configs.map((c) => [c.EntityName, c]));
        expect(byEntity.get(SONAR_CACHED_ENTITY_NAMES.ScoreModels)?.CacheLocal).toBe(false);
        expect(byEntity.get(SONAR_CACHED_ENTITY_NAMES.Factors)?.CacheLocal).toBe(false);
        expect(byEntity.get(SONAR_CACHED_ENTITY_NAMES.ScoreBands)?.CacheLocal).toBe(true);
        expect(byEntity.get(SONAR_CACHED_ENTITY_NAMES.TimeWindows)?.CacheLocal).toBe(true);
    });

    it('gates entity loading on existence and CanRead without failing readable sibling entities', async () => {
        const entities = [
            makeMockEntity({ name: SONAR_CACHED_ENTITY_NAMES.ScoreModels, canRead: true }),
            makeMockEntity({ name: SONAR_CACHED_ENTITY_NAMES.ScoreBandSets, canRead: true }),
            makeMockEntity({ name: SONAR_CACHED_ENTITY_NAMES.ScoreBands, canRead: false }),
            makeMockEntity({ name: SONAR_CACHED_ENTITY_NAMES.TimeWindows, canRead: true }),
            // ModelRelatedEntities, Factors, ModelFactors intentionally absent from catalog
        ];
        const provider = makeMockProvider({ entities });
        engine.seedData({
            bands: [{ ID: 'stale-band', BandSetID: 'bs-1', Label: 'Stale', MinScore: 0, MaxScore: 100 }],
        });

        await engine.Config(false, makeUser('restricted-user'), provider);

        const loadedNames = loadCalls[0].configs.map((c) => c.EntityName);
        expect(loadedNames).toEqual([
            SONAR_CACHED_ENTITY_NAMES.ScoreModels,
            SONAR_CACHED_ENTITY_NAMES.ScoreBandSets,
            SONAR_CACHED_ENTITY_NAMES.TimeWindows,
        ]);
        // Denied/missing entities are cleared cleanly.
        expect(engine.ScoreBands).toEqual([]);
        expect(engine.GetBandById('stale-band')).toBeUndefined();
    });

    it('provides O(1) case-insensitive lookup helpers, sorted collections, band-set expansion, and signal counts', async () => {
        const provider = makeMockProvider({ entities: [] });
        engine.seedData({
            models: [
                { ID: 'M-1', Name: 'Member Health', Status: 'Active', BandSetID: 'BS-1' },
                { ID: 'M-2', Name: 'Draft Model', Status: 'Draft', BandSetID: null },
            ],
            bandSets: [{ ID: 'BS-1', Name: 'Default Health Bands' }],
            bands: [
                { ID: 'B-HIGH', BandSetID: 'BS-1', Label: 'Healthy', MinScore: 75, MaxScore: 100, Severity: 1 },
                { ID: 'B-LOW', BandSetID: 'BS-1', Label: 'Critical', MinScore: 0, MaxScore: 30, Severity: 4 },
                { ID: 'B-MID', BandSetID: 'BS-1', Label: 'Watch', MinScore: 30, MaxScore: 75, Severity: 2 },
            ],
            timeWindows: [
                { ID: 'TW-2', Name: 'Last 90 Days' },
                { ID: 'TW-1', Name: 'All Time' },
            ],
            relatedEntities: [
                { ID: 'MRE-2', ScoreModelID: 'M-1', Alias: 'Payments', RelatedEntityID: 'E-PAY' },
                { ID: 'MRE-1', ScoreModelID: 'M-1', Alias: 'Events', RelatedEntityID: 'E-EVT' },
            ],
            factors: [
                { ID: 'F-1', ScoreModelID: 'M-1', Name: 'Event Count' },
                { ID: 'F-2', ScoreModelID: 'M-1', Name: 'Payment Total' },
            ],
            modelFactors: [
                { ID: 'MF-2', ScoreModelID: 'M-1', FactorID: 'F-2', DisplayOrder: 2 },
                { ID: 'MF-1', ScoreModelID: 'M-1', FactorID: 'F-1', DisplayOrder: 1 },
            ],
        });

        await engine.Config(false, makeUser('u-1'), provider);

        // Case-insensitive ID and Name lookup
        expect(engine.GetModelById('m-1')?.Name).toBe('Member Health');
        expect(engine.GetModelByName('member health')?.ID).toBe('M-1');
        expect(engine.GetActiveModels().map((m) => m.ID)).toEqual(['M-1']);

        // Band sets and bands sorted by MinScore ASC
        expect(engine.GetBandSetById('bs-1')?.Name).toBe('Default Health Bands');
        expect(engine.GetBandsForBandSet('bs-1').map((b) => b.ID)).toEqual(['B-LOW', 'B-MID', 'B-HIGH']);
        expect(engine.GetBandsForModel('m-1').map((b) => b.ID)).toEqual(['B-LOW', 'B-MID', 'B-HIGH']);
        expect(engine.GetBandsForModel('m-2')).toEqual([]);

        // Expanding a single band ID returns the entire band set for rank-based color context
        const bandMap = engine.GetBandMapForBandIds(['b-high', null]);
        expect([...bandMap.keys()].sort()).toEqual(['B-HIGH', 'B-LOW', 'B-MID']);

        // Time windows sorted by Name ASC
        expect(engine.GetTimeWindowById('tw-1')?.Name).toBe('All Time');
        expect(engine.GetTimeWindowsSorted().map((w) => w.Name)).toEqual(['All Time', 'Last 90 Days']);

        // Related entities sorted by Alias ASC
        expect(engine.GetModelRelatedEntityById('mre-1')?.Alias).toBe('Events');
        expect(engine.GetRelatedEntitiesForModel('m-1').map((r) => r.Alias)).toEqual(['Events', 'Payments']);

        // Factors and ModelFactors sorted by DisplayOrder ASC
        expect(engine.GetFactorById('f-1')?.Name).toBe('Event Count');
        expect(engine.GetFactorsForModel('m-1')).toHaveLength(2);
        expect(engine.GetModelFactorById('mf-1')?.FactorID).toBe('F-1');
        expect(engine.GetModelFactorsForModel('m-1').map((mf) => mf.ID)).toEqual(['MF-1', 'MF-2']);

        // Signal counts
        expect(engine.GetSignalCountsByModel().get('M-1')).toBe(2);
        expect(engine.GetSignalCountsByModel().get('M-2')).toBeUndefined();

        // Derived state census
        expect(engine.readDerivedCensus()).toEqual({
            modelsById: 2,
            bandSetsById: 1,
            bandsBySetId: 1,
            timeWindowsById: 2,
            relatedEntitiesByModelId: 1,
            factorsById: 2,
            modelFactorsByModelId: 1,
        });
    });

    it('rebuilds derived indexes when NotifyDataChange fires and exposes ObserveProperty streams', async () => {
        const provider = makeMockProvider({ entities: [] });
        await engine.Config(false, makeUser('u-1'), provider);

        // ObserveProperty streams emit current values immediately (BehaviorSubject semantics)
        const emittedModels: mjBizAppsSonarScoreModelEntity[][] = [];
        const sub = engine.ScoreModels$.subscribe((list) => emittedModels.push(list));
        expect(emittedModels).toHaveLength(1);
        expect(emittedModels[0]).toEqual([]);

        // Mutate underlying array and notify (simulating BaseEntity save/delete auto-refresh)
        const updatedModels = [{ ID: 'M-NEW', Name: 'New Model', Status: 'Active' }];
        engine.seedData({ models: updatedModels });
        engine.triggerNotifyDataChange(
            new BaseEnginePropertyConfig({
                Type: 'entity',
                EntityName: SONAR_CACHED_ENTITY_NAMES.ScoreModels,
                PropertyName: '_ScoreModels',
            }),
            updatedModels,
        );

        expect(engine.GetModelById('m-new')?.Name).toBe('New Model');
        expect(engine.GetModelByName('new model')?.ID).toBe('M-NEW');
        expect(engine.ScoreBandSets$).toBeDefined();
        expect(engine.ScoreBands$).toBeDefined();
        expect(engine.TimeWindows$).toBeDefined();
        expect(engine.ModelRelatedEntities$).toBeDefined();
        expect(engine.Factors$).toBeDefined();
        expect(engine.ModelFactors$).toBeDefined();
        sub.unsubscribe();
    });
});
