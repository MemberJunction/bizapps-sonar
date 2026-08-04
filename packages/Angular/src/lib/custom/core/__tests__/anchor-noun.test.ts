import { describe, it, expect } from "vitest";
import { anchorNounFor, DEFAULT_ANCHOR_NOUN } from "../anchor-noun";

describe("anchorNounFor", () => {
    it("derives all four forms from a plural entity name", () => {
        expect(anchorNounFor("Members")).toEqual({
            one: "member",
            many: "members",
            One: "Member",
            Many: "Members",
        });
    });

    it("strips the schema suffix the demo's own anchor carries", () => {
        // The real anchor entity is named `Members__AssociationDemo` with a null DisplayName. Without the
        // strip this would render "Members__AssociationDemos who are sliding" — worse than the hardcoded
        // word it replaces, which is exactly the trap this test exists to hold shut.
        expect(anchorNounFor("Members__AssociationDemo").many).toBe("members");
        expect(anchorNounFor("Members__AssociationDemo").One).toBe("Member");
    });

    it("handles the anchors this product is actually pitched at", () => {
        expect(anchorNounFor("Accounts").one).toBe("account");
        expect(anchorNounFor("Organizations").one).toBe("organization");
        expect(anchorNounFor("Contacts").many).toBe("contacts");
        expect(anchorNounFor("Chapters").one).toBe("chapter");
    });

    it("inflects -ies correctly", () => {
        expect(anchorNounFor("Companies").one).toBe("company");
        expect(anchorNounFor("Companies").many).toBe("companies");
        expect(anchorNounFor("AccreditingBodies").one).toBe("accreditingbody");
    });

    it("adds -es where a bare -s would not read", () => {
        expect(anchorNounFor("Franchise").many).toBe("franchises");
        expect(anchorNounFor("Church").many).toBe("churches");
        expect(anchorNounFor("Box").many).toBe("boxes");
    });

    it("pluralizes an entity that is named in the singular", () => {
        expect(anchorNounFor("Member")).toEqual({
            one: "member",
            many: "members",
            One: "Member",
            Many: "Members",
        });
        expect(anchorNounFor("Company").many).toBe("companies");
    });

    it("does not amputate a trailing s that belongs to the word", () => {
        // The failure mode being guarded: "Status" -> "Statu", "Address" -> "Addres".
        expect(anchorNounFor("Status").one).toBe("status");
        expect(anchorNounFor("Address").one).toBe("address");
        expect(anchorNounFor("Campus").one).toBe("campus");
        expect(anchorNounFor("Analysis").one).toBe("analysis");
    });

    it("knows the irregulars a scoring anchor might plausibly use", () => {
        expect(anchorNounFor("People").one).toBe("person");
        expect(anchorNounFor("People").many).toBe("people");
        expect(anchorNounFor("Children").One).toBe("Child");
    });

    it("inflects only the LAST word of a multi-word name", () => {
        expect(anchorNounFor("Association Members").one).toBe("association member");
        expect(anchorNounFor("Association Members").One).toBe("Association Member");
        // The capitalized forms only touch the FIRST letter; a multi-word name keeps its own casing
        // beyond that, which is what you want for something reading as a proper name.
        expect(anchorNounFor("Board Members").Many).toBe("Board Members");
    });

    it("cleans underscores and stray whitespace", () => {
        expect(anchorNounFor("  Board_Members  ").one).toBe("board member");
    });

    it("falls back to a generic noun rather than guessing 'member'", () => {
        // Before a model is chosen Sonar does not know what it is looking at. Assuming the demo's noun is
        // how the hardcoding got in.
        expect(anchorNounFor(null)).toEqual(DEFAULT_ANCHOR_NOUN);
        expect(anchorNounFor(undefined)).toEqual(DEFAULT_ANCHOR_NOUN);
        expect(anchorNounFor("")).toEqual(DEFAULT_ANCHOR_NOUN);
        expect(anchorNounFor("   ")).toEqual(DEFAULT_ANCHOR_NOUN);
        expect(anchorNounFor("__OnlyASuffix")).toEqual(DEFAULT_ANCHOR_NOUN);
    });

    it("keeps an all-caps name in caps", () => {
        expect(anchorNounFor("MEMBERS").One).toBe("MEMBER");
    });
});
