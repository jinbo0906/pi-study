export type PrologueOwner = "user" | "model" | "loop" | "tool";

export type PrologueTraceType =
  | "user_message"
  | "model_start"
  | "assistant_message"
  | "tool_start"
  | "tool_result";

export interface PrologueTraceEvent {
  step: number;
  owner: PrologueOwner;
  type: PrologueTraceType;
  detail: string;
  toolCallId?: string;
}

const trace: PrologueTraceEvent[] = [
  {
    step: 1,
    owner: "user",
    type: "user_message",
    detail: "读取 README.md，并概括项目",
  },
  { step: 2, owner: "model", type: "model_start", detail: "turn=1" },
  {
    step: 3,
    owner: "model",
    type: "assistant_message",
    detail: "stopReason=toolUse name=read",
    toolCallId: "call_1",
  },
  {
    step: 4,
    owner: "loop",
    type: "tool_start",
    detail: "name=read",
    toolCallId: "call_1",
  },
  {
    step: 5,
    owner: "tool",
    type: "tool_result",
    detail: "README fixture",
    toolCallId: "call_1",
  },
  { step: 6, owner: "model", type: "model_start", detail: "turn=2" },
  {
    step: 7,
    owner: "model",
    type: "assistant_message",
    detail: "stopReason=stop",
  },
];

export function runPrologueDemo(): PrologueTraceEvent[] {
  const result = structuredClone(trace);
  assertValidPrologueTrace(result);
  return result;
}

export function assertValidPrologueTrace(
  events: PrologueTraceEvent[],
): void {
  const calls = new Set<string>();
  const results = new Set<string>();

  events.forEach((event, index) => {
    if (event.step !== index + 1) {
      throw new Error(`trace step 应为 ${index + 1}`);
    }
    if (event.type === "assistant_message" && event.toolCallId) {
      calls.add(event.toolCallId);
    }
    if (event.type === "tool_result") {
      if (!event.toolCallId || !calls.has(event.toolCallId)) {
        throw new Error("tool result 先于对应的 tool call");
      }
      results.add(event.toolCallId);
    }
  });

  for (const callId of calls) {
    if (!results.has(callId)) {
      throw new Error(`tool call ${callId} 缺少配对结果`);
    }
  }
}

export function formatPrologueTrace(
  events: PrologueTraceEvent[],
): string {
  return events
    .map(
      (event) =>
        `${String(event.step).padStart(2, "0")} ${event.type.padEnd(17)} owner=${event.owner} ${event.detail}`,
    )
    .join("\n");
}
