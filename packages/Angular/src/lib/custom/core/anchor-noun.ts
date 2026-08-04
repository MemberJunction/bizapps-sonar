/**
 * What to CALL the thing a model scores.
 *
 * Sonar's anchor entity is configurable — a model can score Members, Accounts, Organizations, Chapters,
 * anything with an id. Every surface used to say "member" in fixed text, which was true only because all
 * three demo models happen to anchor on Members. Point one at Accounts and the UI starts lying: "Cohort:
 * members who slid 3 cycles" over a list of companies.
 *
 * This derives the noun from the anchor entity's own metadata so the copy follows the configuration.
 */

/** The four forms the copy needs. Mid-sentence and sentence-start, singular and plural. */
export interface AnchorNoun {
    /** "member" — mid-sentence singular ("each treated member"). */
    one: string;
    /** "members" — mid-sentence plural ("269 members match"). */
    many: string;
    /** "Member" — sentence-start, column header, group label. */
    One: string;
    /** "Members" — sentence-start plural. */
    Many: string;
}

/**
 * What to say before a model is chosen, or when the anchor entity can't be resolved.
 *
 * Deliberately generic rather than "member": at that point Sonar genuinely does not know what it is
 * looking at, and guessing the demo's noun is how the hardcoding got there in the first place.
 */
export const DEFAULT_ANCHOR_NOUN: AnchorNoun = { one: "record", many: "records", One: "Record", Many: "Records" };

/** Plurals that don't follow the rules. Kept deliberately short — this is copy, not a linguistics engine. */
const IRREGULAR: ReadonlyMap<string, string> = new Map([
    ["people", "person"],
    ["children", "child"],
    ["men", "man"],
    ["women", "woman"],
]);

/** Endings where a trailing "s" is part of the word, not a plural marker. */
const NOT_A_PLURAL = /(ss|us|is|sis|ows|news)$/i;

/**
 * Build the noun forms for an anchor entity.
 *
 * @param entityName  The entity's DisplayName if it has one, else its Name. Both are accepted raw —
 *                    suffixes and surrounding whitespace are cleaned here so callers don't each do it.
 *
 * Known limits, all deliberate: no camel-case splitting (MJ entity names in practice are already words),
 * and the irregular list covers only what a scoring anchor is plausibly called.
 */
export function anchorNounFor(entityName: string | null | undefined): AnchorNoun {
    const base = cleanEntityName(entityName);
    if (!base) return DEFAULT_ANCHOR_NOUN;

    // Only the last word inflects: "Association Members" -> "Association Member".
    const words = base.split(/\s+/);
    const last = words[words.length - 1];
    const lead = words.slice(0, -1).join(" ");
    const join = (w: string): string => (lead ? `${lead} ${w}` : w);

    const one = join(singularize(last));
    const many = join(pluralize(last));
    return { one: one.toLowerCase(), many: many.toLowerCase(), One: capitalize(one), Many: capitalize(many) };
}

/**
 * Strip what an entity name carries for the database's benefit rather than a reader's.
 *
 * The demo's anchor is literally named `Members__AssociationDemo` (a schema-suffixed entity), and
 * DisplayName is null on it — so without this the "fix" would render "Members__AssociationDemos who are
 * sliding", which is worse than the hardcoded word it replaced.
 */
function cleanEntityName(raw: string | null | undefined): string {
    if (!raw) return "";
    return raw.split("__")[0].replace(/[_-]+/g, " ").trim();
}

function singularize(word: string): string {
    const lower = word.toLowerCase();
    const irregular = IRREGULAR.get(lower);
    if (irregular) return matchCase(word, irregular);
    if (NOT_A_PLURAL.test(word)) return word;
    if (/[^aeiou]ies$/i.test(word)) return word.slice(0, -3) + matchCase(word, "y");
    if (/(ches|shes|xes|zes|ses)$/i.test(word)) return word.slice(0, -2);
    if (/s$/i.test(word)) return word.slice(0, -1);
    return word;
}

function pluralize(word: string): string {
    const lower = word.toLowerCase();
    // Already plural (its singular differs), so leave it alone.
    if (IRREGULAR.has(lower)) return word;
    if (!NOT_A_PLURAL.test(word) && /s$/i.test(word)) return word;
    if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + matchCase(word, "ies");
    if (/(ch|sh|s|x|z)$/i.test(word)) return word + matchCase(word, "es");
    return word + matchCase(word, "s");
}

/** Keep an added/replaced suffix in the same case as the word it joins ("MEMBERS" -> "MEMBER"). */
function matchCase(source: string, suffix: string): string {
    return source === source.toUpperCase() && /[A-Z]/.test(source) ? suffix.toUpperCase() : suffix;
}

function capitalize(text: string): string {
    return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}
