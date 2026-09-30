# Pi Agent 系统学习计划

这是作者的学习进度与建议节奏；新读者从 [README](README.md) 的安装和 Checkpoint 00 开始，不继承表中的完成状态。教材、课程和官方源码的固定版本及逐主题映射见 [源码指南](notes/source-guide.md)，真实 Agent Loop 的可重复观察见 [离线实验](labs/README.md)。

## 学习目标

完成 15 个 checkpoint 后，应当能够：

- 解释一次工具调用从用户消息到最终回答的完整反馈闭环。
- 实现统一消息协议、流式模型边界、工具契约和 Agent Loop。
- 处理并发工具、取消、错误终态、运行中指令和 follow-up。
- 使用会话树保存历史，并在 token 预算内重建模型上下文。
- 理解资源发现、Skill、扩展信任边界和 Runtime 组合根。
- 为完整 Agent 设计不依赖主实现内部状态的评测。
- 在课程实现与固定 Pi 源码之间识别“核心不变量”和“产品复杂度”。

教材标注学习时间约 37 小时。包含独立实现、调试和上游源码对照后，作者估计总投入为 50～70 小时；这只是节奏参考。

## 进度状态

- `[ ]` 尚未开始
- `[~]` 正在学习
- `[x]` 已通过本章验收

## 阶段一：模型与协议

目标：建立贯穿整个系统的消息、事件和模型边界。

| 状态 | Checkpoint | 主题 | 主要上游对照 |
| --- | ---: | --- | --- |
| `[x]` | 00 | 完整离线 Agent 轨迹 | `packages/coding-agent/src/main.ts` |
| `[ ]` | 01 | TypeScript 协议与运行时收窄 | `packages/agent/src/types.ts` |
| `[ ]` | 02 | EventStream | `packages/ai/src/utils/event-stream.ts` |
| `[ ]` | 03 | Canonical Message IR | `packages/ai/src/types.ts` |
| `[ ]` | 04 | Scripted Model | `packages/ai/src/providers/faux.ts` |
| `[ ]` | 05 | Provider Adapter 与 SSE | `packages/ai/src/api/openai-completions.ts` |

阶段验收：能从内存画出消息、流事件、assistant message 和 Provider wire format 的边界，并解释为什么流式 partial 不能代替最终消息。

## 阶段二：工具与循环

目标：让模型提出的动作经过受控执行，形成完整、可验证的反馈回路。

| 状态 | Checkpoint | 主题 | 主要上游对照 |
| --- | ---: | --- | --- |
| `[ ]` | 06 | Tool Contract | `packages/agent/src/types.ts`、`agent-loop.ts` |
| `[ ]` | 07 | Agent Loop | `packages/agent/src/agent-loop.ts` |
| `[ ]` | 08 | Read/Write/Edit/Bash | `packages/coding-agent/src/core/tools/` |

阶段验收：独立实现一次“模型请求 read → 工具返回结果 → 模型继续回答”的双轮调用，并能说明 call/result 配对、并发顺序、取消和课程 step 上限。随后运行官方离线实验，对照 `shouldStopAfterTurn` 与 `maxSteps` 的接口差异。

## 阶段三：状态与历史

目标：从单次函数调用扩展为可订阅、可取消、可持久化、可恢复的 Agent。

| 状态 | Checkpoint | 主题 | 主要上游对照 |
| --- | ---: | --- | --- |
| `[ ]` | 09 | Stateful Agent | `packages/agent/src/agent.ts` |
| `[ ]` | 10 | Session Tree 与 JSONL | `packages/coding-agent/src/core/session-manager.ts` |
| `[ ]` | 11 | Context Compaction | `packages/coding-agent/src/core/compaction/` |

阶段验收：能够区分不可变历史与临时模型上下文，恢复指定会话分支，并保证压缩不会拆散完整的工具交互。

## 阶段四：扩展与验证

目标：把所有能力组合成 Runtime，并从系统外部验证行为。

| 状态 | Checkpoint | 主题 | 主要上游对照 |
| --- | ---: | --- | --- |
| `[ ]` | 12 | Resources、Skills 与 Extensions | `packages/coding-agent/src/core/resource-loader.ts` |
| `[ ]` | 13 | Runtime 组合根 | `packages/coding-agent/src/core/agent-session-runtime.ts` |
| `[ ]` | 14 | Eval Capstone | `packages/agent/test/`、`packages/coding-agent/test/` |

阶段验收：从一个空目录组装并运行完整 Runtime，保存活动路径和文件结果，再由独立评测判断任务结果与基础设施故障。

## 每章完成定义

只有同时满足以下条件，才把状态标为 `[x]`：

- 已完成正文中的预测题，且能解释答案。
- 已创建独立 practice 目录。
- 聚焦测试全部通过。
- 已记录至少一个失败实验及其原因。
- 已对照 target commit，但没有直接复制答案完成练习。
- 已找到教材标注的上游入口，并在本仓库固定 commit 核对符号与行为。
- 已写下一个保持不变的协议和一个真实工程增加的复杂度。

## 建议节奏

| 周期 | 内容 | 建议投入 |
| --- | --- | ---: |
| 第 1 周 | 00–02 | 6～8 小时 |
| 第 2 周 | 03–05 | 8～12 小时 |
| 第 3 周 | 06–08 | 10～14 小时 |
| 第 4 周 | 09–11 | 10～14 小时 |
| 第 5 周 | 12–14 | 10～12 小时 |
| 第 6 周 | 官方 Pi 主线复盘与小型综合项目 | 8～12 小时 |

进度以理解和可重复的测试证据为准，不以周数为硬性截止日期。

## 本次维护补齐的入口

课程 00 的原始 fixture 与两项测试保持不变；01–14 的练习由根目录 `npm run practice -- XX` 生成，不会覆盖已有目录，也不改上游教学源码。学习时沿“预测 → 聚焦测试 → 实现 → 故障实验 → target diff → 固定源码对照”推进。

官方离线实验覆盖两轮工具反馈、参数缺失、宿主拦截、异常回执、截断、并发排序和模型错误。它补齐验证入口，不代表作者已完成 01–14 的个人重建练习。会话树、真实 Provider、压缩与扩展运行仍由相应课程与后续实验验收。
