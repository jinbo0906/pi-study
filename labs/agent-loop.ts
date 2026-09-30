import { Agent, type AgentEvent, type AgentTool } from "@earendil-works/pi-agent-core";
import {
  type Context,
  createModels,
  fauxAssistantMessage,
  fauxProvider,
  fauxToolCall,
  Type,
} from "@earendil-works/pi-ai";

export type Scenario = "success" | "invalid-args" | "tool-error" | "blocked" | "truncated" | "parallel" | "model-error";

export interface LabOptions {
  scenario?: Scenario;
  toolExecution?: "parallel" | "sequential";
  sequentialTool?: boolean;
}

const readParameters = Type.Object({ path: Type.String({ minLength: 1 }) });
const fixture = new Map([
  ["README.md", "pi-study: learn the message → tool → model feedback loop."],
  ["first.txt", "first fixture"],
  ["second.txt", "second fixture"],
]);

/** Run the official Agent and Faux Provider; only the model answers and file contents are fixtures. */
export async function runToolLoopLab(options: LabOptions = {}) {
  const scenario = options.scenario ?? "success";
  const events: AgentEvent[] = [];
  const requests: Context[] = [];
  const executed: string[] = [];
  // Release the first tool only after the second tool's completion event.
  // This proves ordering without timing-dependent sleeps.
  let releaseFirst = () => {};
  const secondFinished = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const forceReverseCompletion = scenario === "parallel" && options.toolExecution !== "sequential" && !options.sequentialTool;
  const read: AgentTool<typeof readParameters, { path: string }> = {
    name: "read_fixture",
    label: "Read fixture",
    description: "Read a named in-memory teaching fixture; no filesystem access.",
    parameters: readParameters,
    executionMode: options.sequentialTool ? "sequential" : undefined,
    execute: async (_id, { path }) => {
      executed.push(path);
      if (scenario === "tool-error") throw new Error("fixture read failed");
      if (forceReverseCompletion && path === "first.txt") await secondFinished;
      const text = fixture.get(path);
      if (text === undefined) throw new Error(`Unknown fixture: ${path}`);
      return { content: [{ type: "text", text }], details: { path } };
    },
  };

  const faux = fauxProvider({ tokenSize: { min: 4, max: 4 } });
  const models = createModels();
  models.setProvider(faux.provider);
  const calls = scenario === "parallel"
    ? [fauxToolCall(read.name, { path: "first.txt" }, { id: "call_1" }), fauxToolCall(read.name, { path: "second.txt" }, { id: "call_2" })]
    : [fauxToolCall(read.name, scenario === "invalid-args" ? {} : { path: "README.md" }, { id: "call_1" })];
  faux.setResponses([
    scenario === "model-error"
      ? fauxAssistantMessage([], { stopReason: "error", errorMessage: "simulated provider failure" })
      : fauxAssistantMessage(calls, { stopReason: scenario === "truncated" ? "length" : "toolUse" }),
    // The final answer is derived from the actual tool results in the second request.
    // It does not invent a successful read when execution failed.
    (context) => {
      const results = context.messages.filter((message) => message.role === "toolResult");
      const text = results.map((result) => `${result.toolCallId} ${result.isError ? "error" : "ok"}: ${result.content.map((block) => block.type === "text" ? block.text : "[image]").join(" ")}`).join("\n");
      return fauxAssistantMessage(text);
    },
  ]);

  const agent = new Agent({
    initialState: { model: faux.getModel(), systemPrompt: "Read fixtures and report only observed results.", tools: [read] },
    streamFn: (model, context, streamOptions) => {
      // Agent tools still contain execute functions here. Capture only the
      // model-visible definition, not the executable host object.
      requests.push(structuredClone({
        systemPrompt: context.systemPrompt,
        messages: context.messages,
        tools: context.tools?.map(({ name, description, parameters }) => ({ name, description, parameters })),
      }));
      return models.streamSimple(model, context, streamOptions);
    },
    toolExecution: options.toolExecution,
    beforeToolCall: scenario === "blocked"
      ? async () => ({ block: true, reason: "fixture access blocked by teaching hook" })
      : undefined,
    // A broken scripted model must not turn a teaching experiment into an endless run.
    shouldStopAfterTurn: ({ newMessages }) => newMessages.filter((message) => message.role === "assistant").length >= 2,
  });
  agent.subscribe((event) => {
    events.push(structuredClone(event));
    if (event.type === "tool_execution_end" && event.toolCallId === "call_2") releaseFirst();
  });
  await agent.prompt("读取 fixture，并依据工具返回结果回答。");
  await agent.waitForIdle();
  return {
    events,
    requests,
    executed,
    messages: structuredClone(agent.state.messages),
    isStreaming: agent.state.isStreaming,
    pendingToolCalls: agent.state.pendingToolCalls.size,
  };
}
