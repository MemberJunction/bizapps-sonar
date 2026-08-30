# Signal Studio & the Authoring Agent toolset

How custom (code-backed) signals get authored, tested, and approved, and how the conversational
authoring agent builds/edits models on its own. Three pieces shipped together:

1. **Signal Studio** — the async workspace for authoring custom factor-actions.
2. **Authoring-agent tools** — read/edit actions that make the agent self-sufficient.
3. **Copilot on MJ native chat** — the floating assistant now rides MJ's conversation UI.

> Background: declarative factors (count/sum/recency over a related entity) cover ~80% of signals. The
> weird 20% — streaks, decay curves, sentiment, cross-source ratios — need code. Those are **Runtime
> factor-actions**: JS behind an approval gate, satisfying the same AnchorRecordID/AsOf → Value/Explanation
> contract as any factor. See [`action-factors.md`](./action-factors.md) for the factor contract itself.

---

## 1. Signal Studio (`features/signal-studio/`)

A dedicated nav surface (DriverClass `SonarSignalStudioResource`), decoupled from the factor builder
because authoring a signal runs **minutes** (an agent writes + self-tests code) — you don't want that
blocking the builder. Commission a signal, let it cook in the background, then review/test/refine/approve.

### The three-rail workbench

`[ pipeline ]  |  [ code workbench ]  |  [ generator ]`

- **Left — pipeline:** *In flight* (running jobs, polled) → *For review* (authored, Pending) → *Library*
  (approved + compiled signals). Every item is clickable.
- **Centre — code workbench:** the generated code (view/edit), **test on a sample of records**, the
  **Refine with AI** panel, and the **Approve** gate.
- **Right — generator:** the commission box. Describe a signal in plain English; it runs detached.

### Async authoring (the detached pattern)

`Sonar: Start Factor Job` fires the **ActionSmith** agent **un-awaited** and returns its `AgentRunID`
immediately via the `onAgentRunCreated` hook. The run keeps executing server-side; the Studio **observes**
it by polling `AIAgentRun.Status` (Running → Completed/Failed). No held connection, no frozen tab, jobs
batch freely. ActionSmith writes the code, **self-tests it** (via `Test Runtime Action`, below), and
persists a Runtime action at `CodeApprovalStatus='Pending'`.

### Test-before-approve (the governance escape hatch)

Runtime actions are gated: `RuntimeActionExecutor` **refuses to execute un-approved code**, so a normal
`RunAction` on a Pending signal fails — which is exactly the signal you're reviewing. The Studio tests
through MJ's **`Test Runtime Action`** instead: it builds a throwaway in-memory `MJActionEntity` flagged
`Approved` and runs the code ephemerally, so you can **test a Pending signal before approving it**. It
runs a **sample of N anchor records** (1/5/10/25) in one call (`TestCases` is an array) and shows a
results table (record → Value → Explanation). Results come back on the `TestResults` output param (not
the aggregate `Result`) — read it with `extractActionParam`.

### Refine in place

`Sonar: Refine Factor Action` reprompts ActionSmith with the **current code + your feedback**, it
rewrites + self-tests, then the server **transplants the improved code back onto the same signal**
(→ Pending for re-review) and **disables the agent's scratch row** (Status `Disabled` hides it from the
catalog). The approval gate is never bypassed — a refine lands Pending, exactly like a manual edit.
Because ActionSmith always authors a *new* row, the transplant is what keeps the catalog one-signal-per-idea.

### Catalog merge

`Sonar: List Factor Actions` surfaces **compiled** factor-action subclasses **plus** Runtime
factor-actions detected by shape (AnchorRecordID input + Value output), each tagged with `kind`
(`compiled`|`runtime`) and `approvalStatus`. The Studio splits this into *For review* (runtime + not
Approved) vs *Library*.

### Key files

| Concern | File |
|---|---|
| Async kickoff (detached fire) | `packages/Actions/src/custom/SonarStartFactorJobAction.ts` |
| Refine + in-place transplant | `packages/Actions/src/custom/SonarRefineFactorActionAction.ts` |
| Shared ActionSmith fire/brief | `packages/Actions/src/custom/actionsmith.shared.ts` |
| Catalog merge (compiled + runtime) | `packages/Actions/src/custom/SonarListFactorActionsAction.ts` |
| Studio engine (poll/test/refine/approve) | `packages/Angular/.../core/services/sonar-factor-smith.service.ts` |
| Studio UI (3-rail) | `packages/Angular/.../features/signal-studio/` |

---

## 2. Authoring-agent tools (`Sonar Authoring Agent`)

The conversational agent (a Loop agent; see [`agentic-authoring.md`](./agentic-authoring.md)) builds and
edits models by calling tool-actions. These were added to close gaps found in live lazy-prompt testing —
so the agent **resolves things itself instead of dead-ending or looping**:

| Tool | What it does | Gap it closes |
|---|---|---|
| `Sonar: Unpublish Model` | Active/Paused → Draft (**safe direction only** — never publishes/activates; idempotent) | The agent had no way to unlock a published model and looped asking the user to do it manually. |
| `Sonar: Find Entities` | Resolve a **business entity** name → ID (system/Sonar schemas hidden) | A new model needs an anchorEntityID; the agent used to beg the user for a raw UUID. |
| `Sonar: Find Models` | Fuzzy/substring-match a **model** by name; enumerate models | A vague reference ("the cheese model") didn't resolve; `Describe Model` needs a near-exact name. |

The agent's prompt (`scripts/update-authoring-agent.mjs`) is hardened to: pick the right model by **name
intent** (not just shared anchor), **unlock-don't-loop** (call Unpublish itself, or pivot to a new draft),
**resolve IDs itself** (Find Entities/Find Models, never ask for UUIDs), and stay **drafts-only**.

Net result: a self-serve **discover → build → edit → unlock** loop, verified robust to lazy input
("make me a model" → one question → "members idk you pick" → grounded proposal → built).

---

## 3. Copilot on MJ native chat (`features/assistant/`)

The floating copilot embeds MJ's native **`<mj-conversation-chat-area>`** (overlayMode), **not** a custom
panel. The old "MJ chat needs a parent workspace" blocker was only true of the monolithic
`ConversationWorkspaceComponent` — its child components embed standalone (their services are
`providedIn:'root'`, so importing `ConversationsModule` is the only wiring). This brings token streaming,
message rendering, persistence, **replay-on-reload**, speaker attribution, and multi-turn for free.

`SonarAssistantConversationService` is now just the bindings that must survive a launcher re-render
(`open`, `agentId`, `environmentId`, `chatConversationId`, `currentUser`, `rememberChatConversation`); the
conversation id is persisted to localStorage on `conversationCreated` so a reload resumes the thread. The
old custom panel + its send/save/hydrate logic were deleted. (Input send shortcut: **Ctrl+Enter**.)

---

## Dev loop — shipping a new tool-action

1. Add the action under `packages/Actions/src/custom/` (extend `SonarActionBase`, register with
   `@RegisterClass(BaseAction, "DriverClass")`), export it from `custom/index.ts`.
2. Add its metadata block to `metadata/actions/.sonar-actions.json` (next free `5044A100-00NN-…` block).
3. `npm run check:action-ids` → build the Actions package.
4. Push metadata from the **`metadata/` root**: `npx mj sync push`. The CLI's encryption validator aborts
   without a key, so set a throwaway one for the push: `export MJ_BASE_ENCRYPTION_KEY=$(openssl rand -base64 32)`.
5. To link it to the authoring agent, add it to `LINKED_ACTIONS` in `scripts/update-authoring-agent.mjs`
   and run that script.
6. Restart MJAPI (the class registers at boot via the Actions barrel import).
