import { Metadata, RunView } from "@memberjunction/core";
import { sqlString } from "./sql.util";

/**
 * Resolve a friendly display name for a scored anchor record — the engine returns only its ID, so
 * the UI looks up the record and picks the entity's name field, falling back to FirstName+LastName,
 * then Name, then Email, then the raw id. Shared by the model builder and factor builder (both showed
 * a "sample member" name and had identical copies of this).
 */
export async function resolveAnchorName(anchorEntityId: string | null, recordId: string): Promise<string> {
    const ent = anchorEntityId ? new Metadata().Entities.find((e) => e.ID === anchorEntityId) : null;
    if (!ent) return recordId;
    const pk = ent.PrimaryKeys[0]?.Name ?? "ID";
    const res = await new RunView().RunView<Record<string, unknown>>({
        EntityName: ent.Name,
        ExtraFilter: `${pk}='${sqlString(recordId)}'`,
        ResultType: "simple",
    });
    const row = res.Success ? res.Results?.[0] : undefined;
    if (!row) return recordId;
    const pick = (k: string): string | null => {
        const v = row[k];
        return v != null && v !== "" ? String(v) : null;
    };
    const nameField = ent.Fields.find((f) => f.IsNameField)?.Name;
    const composed = [pick("FirstName"), pick("LastName")].filter(Boolean).join(" ");
    return (nameField ? pick(nameField) : null) || composed || pick("Name") || pick("Email") || recordId;
}
