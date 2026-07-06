/** Smoke test for the new prompt actions: run Sonar: Get Prompt for the sentiment prompt. */
import { bootstrap } from "./lib/bootstrap.mjs";
import { ActionEngineServer } from "@memberjunction/actions";
import "@memberjunction/core-entities";
import "@mj-biz-apps/sonar-entities";
import "@mj-biz-apps/sonar-actions";
import "@memberjunction/core-actions";

async function main() {
    const { pool, user } = await bootstrap();
    const engine = ActionEngineServer.Instance;
    await engine.Config(false, user);

    const action = engine.Actions.find((a) => a.Name === "Sonar: Get Prompt");
    console.log("Sonar: Get Prompt action found:", !!action);
    const res = await engine.RunAction({
        Action: action,
        ContextUser: user,
        Params: [
            { Name: "PromptName", Type: "Input", Value: "Sonar: Resource Review Sentiment" },
        ],
        Filters: [],
    });
    // The action APPENDS a Result param; with no pre-passed Result there's exactly one.
    const result = res.Params?.filter((p) => p.Name === "Result").pop()?.Value;
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    console.log("Success:", res.Success);
    console.log("promptId:", parsed?.promptId, "| templateContentId:", parsed?.templateContentId);
    console.log("text (first 120 chars):", (parsed?.text ?? "").slice(0, 120).replace(/\n/g, " "));
    await pool.close();
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
