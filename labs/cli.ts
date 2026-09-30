import { runToolLoopLab, type Scenario } from "./agent-loop.js";

const scenarios: Scenario[] = ["success", "invalid-args", "tool-error", "blocked", "truncated", "parallel", "model-error"];
const scenario = process.argv[2] ?? "success";
if (!scenarios.includes(scenario as Scenario)) {
  throw new Error(`Usage: npm run demo -- ${scenarios.join("|")}`);
}
const result = await runToolLoopLab({ scenario: scenario as Scenario });
for (const event of result.events) {
  if (event.type === "message_end") {
    const message = event.message;
    console.log(`message_end role=${message.role}${message.role === "toolResult" ? ` id=${message.toolCallId} isError=${message.isError}` : ""}`);
  } else if (event.type === "tool_execution_start" || event.type === "tool_execution_end") {
    console.log(`${event.type} id=${event.toolCallId}`);
  } else if (event.type !== "message_update" && event.type !== "message_start") {
    console.log(event.type);
  }
}
console.log(`requests=${result.requests.length} executed=${result.executed.length} idle=${!result.isStreaming}`);
const last = result.messages.at(-1);
if (last?.role === "assistant") {
  console.log(last.errorMessage ?? last.content.map((block) => block.type === "text" ? block.text : `[${block.type}]`).join("\n"));
}
