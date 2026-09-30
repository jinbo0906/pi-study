import assert from "node:assert/strict";
import test from "node:test";
import { createAssistantMessageEventStream, fauxAssistantMessage } from "@earendil-works/pi-ai";
import { runToolLoopLab } from "./agent-loop.js";

test("official Agent feeds paired tool facts into the second model request", async () => {
  const result = await runToolLoopLab();
  assert.equal(result.requests.length, 2);
  assert.deepEqual(result.messages.map((message) => message.role), ["user", "assistant", "toolResult", "assistant"]);
  const secondRequest = result.requests[1];
  const observation = secondRequest.messages.at(-1);
  assert.equal(observation?.role, "toolResult");
  if (observation?.role !== "toolResult") throw new Error("missing tool fact");
  assert.equal(observation.toolCallId, "call_1");
  assert.equal(observation.isError, false);
  assert.deepEqual(result.executed, ["README.md"]);
  const answer = result.messages.at(-1);
  assert.equal(answer?.role, "assistant");
  if (answer?.role !== "assistant") throw new Error("missing answer");
  assert.ok(answer.content.some((block) => block.type === "text" && block.text.includes("pi-study")));
  assert.equal(result.events.at(-1)?.type, "agent_end");
  assert.equal(result.isStreaming, false);
  assert.equal(result.pendingToolCalls, 0);
});

for (const scenario of ["invalid-args", "blocked", "truncated", "tool-error"] as const) {
  test(`${scenario}: official loop returns a paired error and lets the model observe it`, async () => {
    const result = await runToolLoopLab({ scenario });
    assert.equal(result.requests.length, 2);
    assert.equal(result.executed.length, scenario === "tool-error" ? 1 : 0);
    const observation = result.requests[1].messages.at(-1);
    assert.equal(observation?.role, "toolResult");
    if (observation?.role !== "toolResult") throw new Error("missing error fact");
    assert.equal(observation.toolCallId, "call_1");
    assert.equal(observation.isError, true);
    assert.ok(observation.content.some((block) => block.type === "text" && block.text.length > 0));
  });
}

test("parallel completion events reverse while transcript results retain call order", async () => {
  const result = await runToolLoopLab({ scenario: "parallel" });
  assert.deepEqual(result.events.filter((event) => event.type === "tool_execution_end").map((event) => event.toolCallId), ["call_2", "call_1"]);
  assert.deepEqual(result.requests[1].messages.filter((message) => message.role === "toolResult").map((message) => message.toolCallId), ["call_1", "call_2"]);
});

test("a sequential tool forces the whole batch to run in call order", async () => {
  const result = await runToolLoopLab({ scenario: "parallel", sequentialTool: true });
  assert.deepEqual(result.events.filter((event) => event.type === "tool_execution_end").map((event) => event.toolCallId), ["call_1", "call_2"]);
});

test("provider error ends the run without executing tools or starting a second request", async () => {
  const result = await runToolLoopLab({ scenario: "model-error" });
  assert.equal(result.requests.length, 1);
  assert.equal(result.executed.length, 0);
  const last = result.messages.at(-1);
  assert.equal(last?.role, "assistant");
  if (last?.role !== "assistant") throw new Error("missing provider error");
  assert.equal(last.stopReason, "error");
  assert.match(last.errorMessage ?? "", /simulated provider failure/);
  assert.equal(result.isStreaming, false);
});

test("ai error terminal resolves result() and closes iteration instead of rejecting", async () => {
  const stream = createAssistantMessageEventStream();
  const failure = fauxAssistantMessage([], { stopReason: "error", errorMessage: "offline failure" });
  stream.push({ type: "error", reason: "error", error: failure });
  const events = [];
  for await (const event of stream) events.push(event);
  assert.equal(events.length, 1);
  assert.equal(await stream.result(), failure);
});
