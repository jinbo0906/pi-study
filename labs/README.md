# 官方 API 离线工具循环实验

先理解 [Checkpoint 00](../pi-practice-00/LEARNING.md) 的固定轨迹，再观察真实官方循环怎样产生同样的事实链。实验运行官方 Agent 和 Models / Faux Provider；只有预设模型回答和内存文件内容是 fixture。

## 环境与运行

从仓库根目录运行，要求 Node 22.19+ / 24 LTS 与 npm：

```powershell
npm ci --ignore-scripts --prefix labs
npm run check:labs
npm run test:labs
npm run demo:labs
```

锁文件固定 ai、agent-core、telemetry 为 **0.84.2**。不需要 `.env`、真实模型名或 API Key。Faux 在进程内产生事件，`read_fixture` 只读取内存 Map，不触碰磁盘，不发出模型网络请求，不产生模型费用；安装依赖仍需网络。

正常输出的关键部分：

```text
message_end role=user
message_end role=assistant
tool_execution_start id=call_1
tool_execution_end id=call_1
message_end role=toolResult id=call_1 isError=false
...
requests=2 executed=1 idle=true
call_1 ok: pi-study: learn the message → tool → model feedback loop.
```

第一次回复提出调用，Agent 校验参数并执行工具；第二次请求收到 `toolResult` 后才生成最终回答。返回结果包含 `requests`（请求快照）、`events`、`messages` 和实际执行次数。快照只克隆模型可见的工具定义，不克隆宿主的 `execute` 函数。

## 故障与并发

```powershell
npm --prefix labs run demo -- invalid-args
npm --prefix labs run demo -- tool-error
npm --prefix labs run demo -- blocked
npm --prefix labs run demo -- truncated
npm --prefix labs run demo -- parallel
npm --prefix labs run demo -- model-error
```

| 场景 | 改变的输入 | 预期观察 | 说明 |
| --- | --- | --- | --- |
| `success` | 合法 read 请求 | 2 次请求、1 次执行、成功回执 | 工具事实进入下一轮 |
| `invalid-args` | 缺少必填 path | 2 次请求、0 次执行、错误回执 | 校验失败仍配对；校验含类型转换，不保证所有不同类型都被拒绝 |
| `tool-error` | 工具抛异常 | 2 次请求、1 次执行、错误回执 | 异常被转换为模型可见事实 |
| `blocked` | beforeToolCall 返回 block | 2 次请求、0 次执行、错误回执 | 合法参数也能被宿主拦截 |
| `truncated` | stopReason 为 length | 2 次请求、0 次执行、错误回执 | 参数可能不完整，整批不执行 |
| `parallel` | 同轮两个工具 | 完成事件 2→1，历史结果 1→2 | UI 进度与模型消息排序不同 |
| `model-error` | Provider error 终态 | 1 次请求、0 次执行、idle=true | 本次引擎运行结束 |

测试还验证 sequential 工具覆盖会使整批串行，以及 error 终态 resolve `EventStream.result()`。并发使用事件门控制顺序，不依赖睡眠时间。每次实验新建模型与 Agent，不共享游标。故障测试通过表示观察到预期错误，不代表读取成功。

## 代码与源码

实现：[agent-loop.ts](agent-loop.ts)；入口：[cli.ts](cli.ts)；行为断言：[agent-loop.test.ts](agent-loop.test.ts)。

```text
Agent.prompt → runAgentLoop / runLoop
  → transformContext → convertToLlm → streamFn
  → Models.streamSimple → Faux Provider
  → prepareToolCall → execute → finalize
  → ToolResultMessage → 下一次 streamFn
  → agent_end → prompt 返回 / waitForIdle
```

npm 发布对应 [`v0.84.2 / 914cf147`](https://github.com/earendil-works/pi/tree/914cf1472e715297caa30db4b9535d534a9eb718)。关键符号：[`Agent`](https://github.com/earendil-works/pi/blob/914cf1472e715297caa30db4b9535d534a9eb718/packages/agent/src/agent.ts)、[`runLoop / executeToolCalls`](https://github.com/earendil-works/pi/blob/914cf1472e715297caa30db4b9535d534a9eb718/packages/agent/src/agent-loop.ts)、[`Models`](https://github.com/earendil-works/pi/blob/914cf1472e715297caa30db4b9535d534a9eb718/packages/ai/src/models.ts)、[`fauxProvider`](https://github.com/earendil-works/pi/blob/914cf1472e715297caa30db4b9535d534a9eb718/packages/ai/src/providers/faux.ts)、[`validateToolArguments`](https://github.com/earendil-works/pi/blob/914cf1472e715297caa30db4b9535d534a9eb718/packages/ai/src/utils/validation.ts)。这些文件与固定 `pi/` 一致，其他 API / coding-agent 存在发布后差异，见 [源码指南](../notes/source-guide.md)。

## 扩展练习与范围

先预测，再一次改一个边界：增加新 fixture；注册纯函数 `count_words` 并让 Faux 调用；把 `toolExecution` 改为 sequential 比较排序；用 `afterToolCall` 改结果并检查第二次请求。每次运行 `npm --prefix labs test`，从公开消息和事件判断行为。

`shouldStopAfterTurn` 将回复限制为两轮，是教学策略；官方 loop 没有课程的 `maxSteps` 参数。实验未创建 AgentSession，不保存会话、不做 compaction，不加载 coding-agent 扩展；这些沿课程 10–13 继续学习。取消、真实 HTTP/SSE 与厂商认证尚未在这里验证。
