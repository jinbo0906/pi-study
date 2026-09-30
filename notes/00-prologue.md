# Checkpoint 00：完整 Agent 闭环

本页保留作者完成 00 的学习记录。课程代码是静态 fixture；官方真实循环及其版本边界见 [源码指南](source-guide.md) 和 [离线实验](../labs/README.md)，不要把本章事件类型当成官方 API。

## 状态

- 开始日期：2026-08-23
- 完成日期：2026-08-24
- Practice 目录：`pi-practice-00/`
- 聚焦测试：`packages/pi-course/test/00-prologue.test.ts`
- 聚焦测试结果：`2/2` 通过
- 结果：已完成
- 命令记录：[00-setup-log.md](00-setup-log.md)

## 本章目标

观察一次离线 README 请求如何闭合，不急于实现真实模型和文件工具。重点是分清“模型提出动作”“循环调度动作”和“工具返回环境事实”。

## 初始执行图

```text
用户目标
  → 第一次模型调用
  → assistant 提出 read call
  → Agent Loop 调度 read
  → 工具返回配对 result
  → 第二次模型调用读取新增事实
  → assistant 给出最终回答
```

## 已验证的不变量

- tool call 只表示模型提出了动作，不能证明动作已经成功执行。
- tool result 才是环境观察结果，必须通过同一个 call id 与请求配对。
- `model_start`、`tool_start` 等过程事件适合展示运行进度，不一定需要进入长期 transcript。
- 下一轮模型输入必须保留 user、assistant tool call 和 tool result 的完整事实链。

## 预习问题

1. 如果存在最终回答但缺少 tool result，系统能否证明文件确实被读取？
2. 为什么工具调度属于 loop，而文件内容属于 tool？
3. 哪些记录需要持久化到 transcript，哪些只属于短期运行事件？

## 我的回答与订正

我最初写出的七个事件是：

```text
user_message
→ model_start
→ assistant_message
→ tool_start
→ tool_result
→ model_start
→ assistant_message
```

这个事件顺序是正确的。我最初把 owner 写成：

```text
user → model → model → tool → tool → model → model
```

其中第 4 个 owner 写错了。`tool_start` 表示 Agent Loop 开始调度工具，因此它的 owner 是 `loop`，不是 `tool`。订正后的 owner 顺序是：

```text
user → model → model → loop → tool → model → model
```

我对职责边界的理解是：

- `model` 提出要执行 `read`，但不直接访问文件系统。
- `loop` 接收模型的请求并开始调度 `read`。
- `tool` 真正访问环境，并把读取结果作为新的事实返回。

因此，“开始调度工具”和“工具已经返回结果”是两个不同动作，不能都归给 `tool`。

## Trace 与 Transcript

### 什么是 Trace

Trace 是一次运行按时间顺序产生的可观察事件轨迹。它回答的是：

> 这次 Agent 运行过程中，依次发生了什么？

Trace 可以用于显示进度、调试、日志和分析生命周期。例如 `model_start` 告诉我模型调用开始了，`tool_start` 告诉我 Loop 已经开始调度工具。这些事件能说明系统正在做什么，但不一定包含下一轮模型推理所需的新事实。

本章展示的七个事件全部属于运行 Trace：

| 步骤 | Trace 事件 | Owner | 说明 |
| ---: | --- | --- | --- |
| 1 | `user_message` | `user` | 用户提出读取 README 的目标 |
| 2 | `model_start` | `model` | 第一次模型调用开始 |
| 3 | `assistant_message` | `model` | 模型提出 `read` tool call |
| 4 | `tool_start` | `loop` | Loop 开始调度 `read` |
| 5 | `tool_result` | `tool` | 工具返回 README fixture |
| 6 | `model_start` | `model` | 第二次模型调用开始 |
| 7 | `assistant_message` | `model` | 模型给出最终回答 |

### 什么是 Transcript

Transcript 是需要长期保留、并在下一次模型调用时继续提供给模型的规范化对话历史。它回答的是：

> 模型下一轮仍然需要看到哪些消息和环境事实？

在本章中，进入 Transcript 的是 Trace 中与对话语义和环境事实有关的子集：

```text
第 1 步 user_message
→ 第 3 步 assistant_message（包含 tool call）
→ 第 5 步 tool_result
→ 第 7 步 assistant_message（最终回答）
```

第 2、6 步的 `model_start` 和第 4 步的 `tool_start` 不进入 Transcript。它们记录生命周期和进度，没有给下一轮模型增加新的任务事实。

我的简化记忆方式是：

```text
Trace      = 运行时发生了什么
Transcript = 下一轮模型仍需知道什么
```

Transcript 是 Trace 中需要持久化的一部分，而不是 Trace 的另一个名称。

## 核心问题作答

### 1. 为什么 tool call 不能证明 README 已经读取

`tool call` 只表达模型的意图：模型希望系统调用 `read` 并读取 `README.md`。它不能证明：

- Loop 已经开始调度工具；
- 文件存在；
- 工具有权限访问文件；
- 读取过程没有发生异常或取消；
- 工具实际返回了什么内容。

只有 `tool_result` 才记录环境实际观察到的成功结果或错误结果。因此，即使最终回答看起来正确，只保留 tool call 也不能作为“README 已读取”的证据。

### 2. call_1 如何连接请求和结果

模型提出工具请求时，为这次调用分配 id `call_1`：

```text
tool call:   id = call_1, name = read
tool start:  toolCallId = call_1
tool result: toolCallId = call_1
```

`call_1` 是这次工具交互的关联标识。Loop 和 Transcript 可以根据它确认：“这条 result 回答的是哪一条 call。”即使以后同时存在多个工具调用，结果返回顺序与请求顺序不同，也可以通过各自的 call id 正确配对。

### 3. 删除 tool_result 后，验证器为什么必须失败

一旦 assistant message 中出现 tool call，Transcript 最终必须出现使用相同 call id 的 tool result。否则会形成悬空调用：系统只知道模型想读取文件，却不知道动作成功、失败、取消还是根本没有执行。

本章验证器先收集所有 tool call id，再收集所有 result id。最后逐个检查 call 是否存在配对 result。删除 `call_1` 的 `tool_result` 后，`calls` 中仍有 `call_1`，但 `results` 中没有，因此验证器抛出：

```text
tool call call_1 缺少配对结果
```

聚焦测试显示为通过，是因为测试本来就期望这条损坏轨迹被验证器拒绝。测试通过证明验证器正确发现了协议错误，而不是证明删除 result 后的轨迹有效。

## 源码阅读

阅读入口：`pi-practice-00/packages/pi-course/src/demo/prologue.ts`。

### 事件类型

`PrologueOwner` 把 owner 限制为四种角色：

```text
user / model / loop / tool
```

`PrologueTraceType` 把本章可能出现的 Trace 事件限制为五类：

```text
user_message / model_start / assistant_message / tool_start / tool_result
```

同一种事件类型可以出现多次，所以五类事件组成了七步轨迹，其中 `model_start` 和 `assistant_message` 各出现两次。

`PrologueTraceEvent` 为每个事件保存：

- `step`：事件在当前 Trace 中的顺序；
- `owner`：动作由谁产生；
- `type`：事件类型；
- `detail`：本章用于观察的简短说明；
- `toolCallId`：只在需要关联工具交互时出现。

`toolCallId` 是可选字段，因为用户消息、模型启动和最终纯文本回答不需要工具关联 id。

### 固定轨迹与副本隔离

源码用静态数组保存七步离线 fixture。`runPrologueDemo()` 没有调用真实模型或文件工具，而是执行两个动作：

1. 使用 `structuredClone(trace)` 返回固定轨迹的深副本；
2. 返回前调用 `assertValidPrologueTrace()` 验证副本。

我对 `structuredClone()` 的理解是：调用者修改返回数组或其中的事件时，不会污染模块内部的固定 fixture，因此下一次运行仍然得到稳定的初始轨迹。

### 验证器的执行顺序

`assertValidPrologueTrace()` 使用两个集合：

```text
calls   = 已经出现的 tool call id
results = 已经出现的 tool result id
```

它按事件顺序完成三层检查：

1. `event.step` 必须等于当前数组索引加一，保证步骤连续；
2. 遇到 `tool_result` 时，对应 call 必须已经出现，防止 result 先于 call；
3. 遍历结束后，每个 call 都必须存在 result，防止悬空调用。

本章验证器只实现课程当前需要观察的不变量，并不等同于真实 Pi 的完整消息协议校验器。

### 格式化输出

`formatPrologueTrace()` 把事件映射成便于人阅读的单行文本：

- `padStart(2, "0")` 把步骤格式化为 `01`–`07`；
- `padEnd(17)` 对齐不同长度的事件类型；
- `join("\n")` 把七行组合成完整 Trace 文本。

格式化只改变展示方式，不改变结构化事件本身。

## 测试阅读

测试入口：`pi-practice-00/packages/pi-course/test/00-prologue.test.ts`。

### 测试一：稳定呈现完整反馈回路

第一项测试验证三件事：

1. `runPrologueDemo()` 返回恰好七个事件；
2. owner 顺序严格等于 `user / model / model / loop / tool / model / model`；
3. 格式化文本包含第 7 步最终 `assistant_message`。

这项测试同时约束结构化轨迹和面向人的格式化输出。

### 测试二：暴露悬空 tool call

第二项测试先取得一份有效轨迹，然后：

1. 用 `filter()` 删除 `tool_result`；
2. 用 `map()` 重新生成连续的 step；
3. 再次调用验证器，并断言错误包含“缺少配对结果”。

删除事件后重新编号很重要。如果保留原编号，验证器会先报告 step 不连续，测试就无法单独证明“悬空 tool call”这条协议。重新编号让实验只破坏 call/result 配对，从而精确命中预期错误。

### 测试证据

```text
✔ 离线轨迹稳定呈现一条完整反馈回路
✔ 悬空 tool call 在结果文本之前暴露

tests 2
pass 2
fail 0
```

我的结论是：测试通过不仅表示正常轨迹正确，也表示验证器能拒绝一个经过精确构造的损坏轨迹。

## 实践记录

当前记录：

- 七条离线事件的 owner：`user / model / model / loop / tool / model / model`
- 聚焦测试：`2/2` 通过
- 删除 tool result 后的预期：验证器报告 `tool call call_1 缺少配对结果`
- `structuredClone()`：隔离返回值与固定 fixture，保持重复运行稳定
- 第二项测试重新编号的原因：避免 step 错误遮蔽 call/result 配对错误
- 当前 Pi 主线入口：`pi/packages/coding-agent/src/main.ts`
- 当前 Pi 核心循环入口：`pi/packages/agent/src/agent-loop.ts`
- 课程实现省略、真实 Pi 增加的复杂度：课程使用静态 fixture 和最小验证器；真实 Pi 还需要处理配置加载、模型流、并发工具、取消、错误、会话持久化和界面事件。

## 完成判定

- [x] 已创建独立的 `pi-practice-00/`。
- [x] 已阅读 UTF-8 编码的 `LEARNING.md`。
- [x] 已安装 Practice 依赖并完成 TypeScript 构建。
- [x] 两项聚焦测试通过。
- [x] 能写出七个事件和正确的 owner 顺序。
- [x] 能区分 Trace 与 Transcript。
- [x] 能解释 tool call、tool result 与 `call_1` 的配对关系。
- [x] 已理解缺少 result 和 result 先于 call 两种协议错误。
- [x] 已阅读本章源码和测试，并理解第二项测试重新编号的原因。
- [x] 已找到课程标注的官方 Pi 入口，并记录课程实现与真实工程的复杂度差异。

Checkpoint 00 的目标是建立完整 Agent 反馈闭环的心智模型，不要求实现真实模型或工具。上述验收项已覆盖本章目标，后续从 Checkpoint 01 开始逐步重建协议和代码。
