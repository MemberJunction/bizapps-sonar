/**
 * Minimal RFC-4180 CSV builder + browser download — no dependency. Shared helper (first consumer:
 * the Engagement Manager cohort export). A field is quoted only when it contains a comma, quote, or
 * newline; embedded quotes are doubled.
 */

/** Cell value a CSV accepts; null/undefined render as an empty field. */
type CsvCell = string | number | null | undefined;

/** Quote/escape one field per RFC 4180, and neutralize CSV formula injection.
 *  A TEXT cell whose first char is = + - @ (or tab/CR) is executed as a formula when the file opens
 *  in Excel/Sheets — since cells carry member names + LLM-generated explanations, we prefix such a
 *  value with a single quote so it's read as literal text. Numbers pass through untouched (they're
 *  never formulas, and guarding them would mangle legitimate negatives). RFC-4180-correct ≠ safe. */
function escapeField(value: CsvCell): string {
    if (value == null) return "";
    let s = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) {
        s = `'${s}`;
    }
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV string from a header row + data rows (each row's cells aligned to the headers).
 *  Prefixed with a UTF-8 BOM so Excel reads accented names correctly; CRLF line endings. */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
    const lines = [headers, ...rows].map((cells) => cells.map(escapeField).join(","));
    return "﻿" + lines.join("\r\n");
}

/** Trigger a client-side download of `content` as `filename` (text/csv). */
export function downloadCsv(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
