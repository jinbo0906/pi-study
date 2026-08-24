import assert from "node:assert/strict";
import test from "node:test";
import {
  assertValidPrologueTrace,
  formatPrologueTrace,
  runPrologueDemo,
} from "../src/demo/prologue.js";

test("离线轨迹稳定呈现一条完整反馈回路", () => {
  const trace = runPrologueDemo();
  assert.equal(trace.length, 7);
  assert.deepEqual(
    trace.map((event) => event.owner),
    ["user", "model", "model", "loop", "tool", "model", "model"],
  );
  assert.match(formatPrologueTrace(trace), /07 assistant_message/);
});

test("悬空 tool call 在结果文本之前暴露", () => {
  const broken = runPrologueDemo()
    .filter((event) => event.type !== "tool_result")
    .map((event, index) => ({ ...event, step: index + 1 }));
  assert.throws(() => assertValidPrologueTrace(broken), /缺少配对结果/);
});
