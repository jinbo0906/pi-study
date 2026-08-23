# Checkpoint 00：完整 Agent 闭环

## 状态

- 开始日期：待开始
- 完成日期：
- Practice 目录：`pi-practice-00/`
- 聚焦测试：`packages/pi-course/test/00-prologue.test.ts`
- 结果：未开始

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

## 待验证的不变量

- tool call 只表示模型提出了动作，不能证明动作已经成功执行。
- tool result 才是环境观察结果，必须通过同一个 call id 与请求配对。
- `model_start`、`tool_start` 等过程事件适合展示运行进度，不一定需要进入长期 transcript。
- 下一轮模型输入必须保留 user、assistant tool call 和 tool result 的完整事实链。

## 预习问题

1. 如果存在最终回答但缺少 tool result，系统能否证明文件确实被读取？
2. 为什么工具调度属于 loop，而文件内容属于 tool？
3. 哪些记录需要持久化到 transcript，哪些只属于短期运行事件？

## 实践记录

完成 `pi-practice-00` 后补充：

- 七条离线事件的 owner：
- 删除 tool result 后的测试结果：
- 当前 Pi 主线入口：`pi/packages/coding-agent/src/main.ts`
- 课程实现省略、真实 Pi 增加的复杂度：
